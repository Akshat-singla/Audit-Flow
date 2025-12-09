import { useStore } from './store';
import { walletManager } from './walletManager';
import { deployContract } from './contractDeployer';
import { extractConstructorArguments, validateConstructorArguments, convertArgumentValues } from './abiParser';
import { toastManager } from './toast';
import type {
    CompileResponse,
    ConstructorArgument,
} from './types';

/**
 * WorkflowController manages the step-by-step deployment workflow
 * Handles: AI Analysis → Compilation → Constructor Args → Deployment
 */
export class WorkflowController {
    /**
     * Start the workflow for a project
     * @param projectId The project to deploy
     * @param aiAnalysisEnabled Whether to run AI security analysis
     */
    async startWorkflow(projectId: string, aiAnalysisEnabled: boolean): Promise<void> {
        const store = useStore.getState();

        // Initialize workflow state
        store.initializeWorkflow(projectId, aiAnalysisEnabled);

        // Start with first step
        if (aiAnalysisEnabled) {
            await this.runAnalysisStep();
        } else {
            // Skip analysis and go to compilation
            await this.runCompilationStep();
        }
    }

    /**
     * Run AI security analysis step
     */
    async runAnalysisStep(): Promise<void> {
        const store = useStore.getState();
        const workflow = store.workflow;

        if (!workflow) {
            const error = new Error('Workflow not initialized');
            toastManager.error(error.message);
            throw error;
        }

        const project = store.projects.find(p => p.id === workflow.projectId);
        if (!project) {
            const error = new Error('Project not found');
            toastManager.error(error.message);
            throw error;
        }

        if (!project.contractCode || project.contractCode.trim() === '') {
            const error = new Error('Contract code is empty. Please write some code first.');
            toastManager.error(error.message);
            throw error;
        }

        // Find analysis step index
        const analysisStepIndex = workflow.steps.findIndex(s => s.id === 'analyze');
        if (analysisStepIndex === -1) {
            const error = new Error('Analysis step not found');
            toastManager.error(error.message);
            throw error;
        }

        try {
            // Update step to in-progress
            store.updateWorkflowStep(analysisStepIndex, 'in-progress');
            toastManager.info('Running AI security analysis...');

            // Call analysis API
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractCode: project.contractCode,
                }),
            });

            if (!response.ok) {
                throw new Error(`Analysis request failed with status ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Analysis failed');
            }

            // Store analysis result
            if (data.analysis) {
                store.setAnalysisResult(data.analysis);
            }

            // Complete the analysis step
            store.updateWorkflowStep(analysisStepIndex, 'completed');
            toastManager.success('Security analysis completed');

            // DO NOT automatically proceed - wait for user to review the report
            // The UI will show the SecurityReport modal and user will decide to fix or continue
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
            store.updateWorkflowStep(analysisStepIndex, 'failed', errorMessage);
            toastManager.error(`Analysis failed: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Continue after security analysis (called when user clicks "Continue" in SecurityReport)
     */
    async continueAfterAnalysis(): Promise<void> {
        await this.runCompilationStep();
    }

    /**
     * Run compilation step
     */
    async runCompilationStep(): Promise<void> {
        const store = useStore.getState();
        const workflow = store.workflow;

        if (!workflow) {
            const error = new Error('Workflow not initialized');
            toastManager.error(error.message);
            throw error;
        }

        const project = store.projects.find(p => p.id === workflow.projectId);
        if (!project) {
            const error = new Error('Project not found');
            toastManager.error(error.message);
            throw error;
        }

        if (!project.contractCode || project.contractCode.trim() === '') {
            const error = new Error('Contract code is empty. Please write some code first.');
            toastManager.error(error.message);
            throw error;
        }

        // Find compilation step index
        const compileStepIndex = workflow.steps.findIndex(s => s.id === 'compile');
        if (compileStepIndex === -1) {
            const error = new Error('Compilation step not found');
            toastManager.error(error.message);
            throw error;
        }

        try {
            // Update step to in-progress
            store.updateWorkflowStep(compileStepIndex, 'in-progress');
            toastManager.info('Compiling contract...');

            // Call compiler API
            const response = await fetch('/api/compiler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractCode: project.contractCode,
                }),
            });

            if (!response.ok) {
                throw new Error(`Compilation request failed with status ${response.status}`);
            }

            const result: CompileResponse = await response.json();

            if (!result.success) {
                // Store compilation result even on failure so errors can be displayed
                store.setCompilationResult(result);

                // Compilation failed with errors
                const errorMessage = result.errors?.join('\n') || 'Compilation failed';
                store.updateWorkflowStep(compileStepIndex, 'failed', errorMessage);
                toastManager.error('Compilation failed. Please review the errors.');
                throw new Error(errorMessage);
            }

            // Store compilation result
            store.setCompilationResult(result);

            // Complete compilation step
            store.updateWorkflowStep(compileStepIndex, 'completed');

            // Show warnings if any
            if (result.warnings && result.warnings.length > 0) {
                toastManager.warning(`Compilation succeeded with ${result.warnings.length} warning(s)`);
            } else {
                toastManager.success('Contract compiled successfully');
            }

            // Extract constructor arguments if any
            if (result.abi) {
                const constructorArgs = extractConstructorArguments(result.abi);
                store.setConstructorArgs(constructorArgs);
            }

            // Proceed to review step
            const reviewStepIndex = workflow.steps.findIndex(s => s.id === 'review');
            if (reviewStepIndex !== -1) {
                // If there are constructor arguments, set review to in-progress
                // so the UI can show the constructor modal
                if (result.abi) {
                    const constructorArgs = extractConstructorArguments(result.abi);
                    if (constructorArgs.length > 0) {
                        store.updateWorkflowStep(reviewStepIndex, 'in-progress');
                        return; // Wait for user to provide constructor args
                    }
                }

                // No constructor arguments needed, mark review as in-progress
                // The UI will handle proceeding to deployment
                store.updateWorkflowStep(reviewStepIndex, 'in-progress');
            }
        } catch (error) {
            // Error already handled above for compilation errors
            if (!(error instanceof Error && error.message.includes('Compilation failed'))) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown compilation error';
                store.updateWorkflowStep(compileStepIndex, 'failed', errorMessage);
                toastManager.error(`Compilation error: ${errorMessage}`);
            }
            throw error;
        }
    }

    /**
     * Complete the review step (called after user reviews constructor args)
     * This is called from the UI after user provides constructor arguments
     */
    completeReviewStep(): void {
        const store = useStore.getState();
        const workflow = store.workflow;

        if (!workflow) {
            throw new Error('Workflow not initialized');
        }

        const reviewStepIndex = workflow.steps.findIndex(s => s.id === 'review');
        if (reviewStepIndex === -1) {
            throw new Error('Review step not found');
        }

        const reviewStep = workflow.steps[reviewStepIndex];

        // Only complete if currently in progress
        if (reviewStep.status === 'in-progress') {
            store.updateWorkflowStep(reviewStepIndex, 'completed');
        }
    }

    /**
     * Validate and prepare constructor arguments
     * Called before deployment to ensure args are valid
     */
    validateConstructorArgs(args: ConstructorArgument[]): void {
        const store = useStore.getState();
        const workflow = store.workflow;

        if (!workflow || !workflow.compilationResult) {
            throw new Error('No compilation result available');
        }

        const abi = workflow.compilationResult.abi;
        if (!abi) {
            throw new Error('No ABI available');
        }

        const validation = validateConstructorArguments(abi, args);
        if (!validation.valid) {
            const errorMessages = validation.errors.map(e => e.message).join(', ');
            throw new Error(`Invalid constructor arguments: ${errorMessages}`);
        }

        // Update constructor args in store
        store.setConstructorArgs(args);
    }

    /**
     * Run deployment step
     */
    async runDeploymentStep(): Promise<void> {
        const store = useStore.getState();
        const workflow = store.workflow;

        if (!workflow) {
            const error = new Error('Workflow not initialized');
            toastManager.error(error.message);
            throw error;
        }

        if (!workflow.compilationResult) {
            const error = new Error('No compilation result available');
            toastManager.error(error.message);
            throw error;
        }

        const project = store.projects.find(p => p.id === workflow.projectId);
        if (!project) {
            const error = new Error('Project not found');
            toastManager.error(error.message);
            throw error;
        }

        const selectedNetwork = store.networks.find(n => n.id === store.selectedNetworkId);
        if (!selectedNetwork) {
            const error = new Error('No network selected');
            toastManager.error(error.message);
            throw error;
        }

        // Check wallet connection
        if (!store.wallet.isConnected) {
            const error = new Error('Wallet not connected. Please connect your wallet first.');
            toastManager.error(error.message);
            throw error;
        }

        const signer = walletManager.getSigner();
        if (!signer) {
            const error = new Error('Wallet signer not available');
            toastManager.error(error.message);
            throw error;
        }

        // Find deployment step index
        const deployStepIndex = workflow.steps.findIndex(s => s.id === 'deploy');
        if (deployStepIndex === -1) {
            const error = new Error('Deployment step not found');
            toastManager.error(error.message);
            throw error;
        }

        try {
            // Update step to in-progress
            store.updateWorkflowStep(deployStepIndex, 'in-progress');
            toastManager.info('Deploying contract... Please confirm the transaction in MetaMask.');

            // Convert constructor arguments
            const constructorArgs = convertArgumentValues(workflow.constructorArgs);

            // Get project info
            const state = useStore.getState();
            const project = state.projects.find(p => p.id === workflow.projectId);

            // Deploy contract
            const result = await deployContract(
                {
                    abi: workflow.compilationResult.abi!,
                    bytecode: workflow.compilationResult.bytecode!,
                    constructorArgs,
                    network: selectedNetwork,
                },
                signer,
                workflow.projectId,
                project?.name
            );

            // Store deployment result
            store.setDeploymentResult(result);

            // Complete deployment step
            store.updateWorkflowStep(deployStepIndex, 'completed');

            // Save to deployment history
            try {
                store.addDeployment({
                    projectId: project.id,
                    projectName: project.name,
                    networkId: selectedNetwork.id,
                    networkName: selectedNetwork.name,
                    contractAddress: result.contractAddress,
                    transactionHash: result.transactionHash,
                    abi: workflow.compilationResult.abi!,
                    bytecode: workflow.compilationResult.bytecode!,
                    timestamp: Date.now(),
                    auditReport: workflow.analysisResult || undefined, // Include audit report if AI analysis was run
                });
            } catch (storageError) {
                // Deployment succeeded but history save failed
                console.error('Failed to save deployment history:', storageError);
                if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
                    toastManager.warning('Deployment succeeded but history could not be saved: ' + storageError.message);
                } else {
                    toastManager.warning('Deployment succeeded but history could not be saved');
                }
            }

            toastManager.success('Contract deployed successfully!');

            // Complete the workflow
            this.completeWorkflow();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown deployment error';
            store.updateWorkflowStep(deployStepIndex, 'failed', errorMessage);

            // Provide more specific error messages
            if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
                toastManager.error('Transaction rejected by user');
            } else if (errorMessage.includes('insufficient funds')) {
                toastManager.error('Insufficient funds for deployment');
            } else if (errorMessage.includes('network')) {
                toastManager.error('Network error. Please check your connection and try again.');
            } else {
                toastManager.error(`Deployment failed: ${errorMessage}`);
            }

            throw error;
        }
    }

    /**
     * Complete the workflow by marking the done step as completed
     */
    private completeWorkflow(): void {
        const store = useStore.getState();
        const workflow = store.workflow;

        if (!workflow) {
            return;
        }

        const doneStepIndex = workflow.steps.findIndex(s => s.id === 'done');
        if (doneStepIndex !== -1) {
            store.updateWorkflowStep(doneStepIndex, 'completed');
        }
    }

    /**
     * Reset the workflow
     */
    resetWorkflow(): void {
        const store = useStore.getState();
        store.resetWorkflow();
    }

    /**
     * Pause workflow and allow editing (called when user wants to fix issues)
     */
    pauseWorkflow(): void {
        // Workflow is paused by not progressing to next step
        // User can edit contract and restart workflow
    }

    /**
     * Skip AI analysis step
     */
    skipAnalysisStep(): void {
        const store = useStore.getState();
        const workflow = store.workflow;

        if (!workflow) {
            throw new Error('Workflow not initialized');
        }

        const analysisStepIndex = workflow.steps.findIndex(s => s.id === 'analyze');
        if (analysisStepIndex !== -1) {
            store.updateWorkflowStep(analysisStepIndex, 'skipped');
        }

        // Proceed to compilation
        this.runCompilationStep();
    }

    /**
     * Get current workflow state
     */
    getWorkflowState() {
        return useStore.getState().workflow;
    }
}

// Export singleton instance
export const workflowController = new WorkflowController();
