'use client';

import ProjectList from '@/components/ProjectList';
import LazyCodeEditor from '@/components/LazyCodeEditor';
import WorkflowVisualizer from '@/components/WorkflowVisualizer';
import DeploymentHistory from '@/components/DeploymentHistory';
import SecurityReport from '@/components/SecurityReport';
import ConstructorArgumentsModal from '@/components/ConstructorArgumentsModal';
import DeploymentPanel from '@/components/DeploymentPanel';
import ToastContainer from '@/components/ToastContainer';
import ErrorBoundary from '@/components/ErrorBoundary';
import NetworkSelector from '@/components/NetworkSelector';
import WalletConnect from '@/components/WalletConnect';

import CompilationErrorDisplay from '@/components/CompilationErrorDisplay';
import StorageWarning from '@/components/StorageWarning';
import { useStore } from '@/lib/store';
import { workflowController } from '@/lib/workflowController';
import { toastManager } from '@/lib/toast';
import { useEffect, useState, useCallback } from 'react';

export default function Home() {
    const {
        loadNetworks,
        loadProjects,
        loadDeploymentHistory,
        projects,
        selectedProjectId,
        updateProject,
        workflow,
        networks,
        selectedNetworkId,
        wallet,
    } = useStore();

    const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [showConstructorModal, setShowConstructorModal] = useState(false);
    const [showDeploymentPanel, setShowDeploymentPanel] = useState(false);
    const [showSecurityReport, setShowSecurityReport] = useState(false);
    const [showCompilationErrors, setShowCompilationErrors] = useState(false);
    const [autoDeployTriggered, setAutoDeployTriggered] = useState(false);

    // Load data from localStorage on mount
    useEffect(() => {
        try {
            loadNetworks();
            loadProjects();
            loadDeploymentHistory();
        } catch (error) {
            console.error('Failed to load data:', error);
            toastManager.error('Failed to load application data. Please refresh the page.');
        }
    }, [loadNetworks, loadProjects, loadDeploymentHistory]);

    // Monitor workflow state to show modals
    useEffect(() => {
        if (!workflow) return;

        const currentStep = workflow.steps[workflow.currentStepIndex];

        // Show security report after analysis step completes
        if (currentStep?.id === 'analyze' && currentStep.status === 'completed') {
            setShowSecurityReport(true);
        }

        // Show compilation errors if compilation fails
        if (currentStep?.id === 'compile' && currentStep.status === 'failed') {
            setShowCompilationErrors(true);
        }

        // Show constructor modal after compilation if constructor args needed
        if (
            currentStep?.id === 'review' &&
            currentStep.status === 'in-progress'
        ) {
            if (workflow.constructorArgs.length > 0) {
                setShowConstructorModal(true);
            } else if (!autoDeployTriggered) {
                // No constructor arguments, proceed directly to deployment
                setAutoDeployTriggered(true);
                const proceedToDeployment = async () => {
                    try {
                        workflowController.completeReviewStep();
                        await workflowController.runDeploymentStep();
                    } catch (error) {
                        console.error('Auto-deployment failed:', error);
                    }
                };
                proceedToDeployment();
            }
        }

        // Show deployment panel after deployment completes
        if (currentStep?.id === 'done' && currentStep.status === 'completed' && workflow.deploymentResult) {
            setShowDeploymentPanel(true);
        }
    }, [workflow]);

    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    const selectedNetwork = networks.find((n) => n.id === selectedNetworkId);

    const handleStartWorkflow = useCallback(async () => {
        if (!selectedProjectId) {
            toastManager.warning('Please select a project first');
            return;
        }

        if (!wallet.isConnected) {
            toastManager.warning('Please connect your wallet first');
            return;
        }

        if (!selectedNetworkId) {
            toastManager.warning('Please select a network first');
            return;
        }

        setIsStarting(true);
        try {
            await workflowController.startWorkflow(selectedProjectId, aiAnalysisEnabled);
            toastManager.success('Workflow started successfully');
        } catch (error) {
            console.error('Workflow start failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toastManager.error(`Failed to start workflow: ${errorMessage}`);
        } finally {
            setIsStarting(false);
        }
    }, [selectedProjectId, wallet.isConnected, selectedNetworkId, aiAnalysisEnabled]);

    const handleResetWorkflow = useCallback(() => {
        workflowController.resetWorkflow();
        setShowConstructorModal(false);
        setShowDeploymentPanel(false);
        setShowSecurityReport(false);
        setShowCompilationErrors(false);
        setAutoDeployTriggered(false);
    }, []);

    const handleCompilationErrorRetry = useCallback(() => {
        setShowCompilationErrors(false);
        handleResetWorkflow();
    }, [handleResetWorkflow]);

    const handleCodeChange = useCallback((code: string) => {
        if (selectedProjectId) {
            try {
                updateProject(selectedProjectId, { contractCode: code });
            } catch (error) {
                console.error('Failed to save contract code:', error);
                if (error instanceof Error && error.name === 'QuotaExceededError') {
                    toastManager.error(error.message);
                } else {
                    toastManager.error('Failed to save contract code');
                }
            }
        }
    }, [selectedProjectId, updateProject]);

    const handleSecurityContinue = useCallback(async () => {
        setShowSecurityReport(false);
        // Workflow will automatically proceed to compilation
    }, []);

    const handleSecurityFixIssues = useCallback(() => {
        setShowSecurityReport(false);
        // Pause workflow to allow editing
        // User can restart workflow after fixing
        workflowController.resetWorkflow();
    }, []);

    const handleConstructorSubmit = useCallback(async () => {
        setIsDeploying(true);
        try {
            // Validate constructor arguments
            if (workflow?.constructorArgs) {
                workflowController.validateConstructorArgs(workflow.constructorArgs);
            }

            // Complete review step
            workflowController.completeReviewStep();

            setShowConstructorModal(false);

            // Run deployment step
            await workflowController.runDeploymentStep();
        } catch (error) {
            console.error('Deployment failed:', error);

            // Error toast is already shown in workflowController
            // Just keep the modal open for retry
            setShowConstructorModal(true);
        } finally {
            setIsDeploying(false);
        }
    }, [workflow?.constructorArgs]);

    const handleConstructorCancel = useCallback(() => {
        setShowConstructorModal(false);
        handleResetWorkflow();
    }, [handleResetWorkflow]);

    const handleDeploymentClose = useCallback(() => {
        setShowDeploymentPanel(false);
        handleResetWorkflow();
    }, [handleResetWorkflow]);

    const isWorkflowRunning = workflow !== null;
    const isCodeReadOnly = isWorkflowRunning;

    return (
        <ErrorBoundary>
            <ToastContainer />
            <StorageWarning />
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
                <main className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Project List */}
                    <aside className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
                        <ProjectList />
                    </aside>

                    {/* Center Panel - Code Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Workflow Controls */}
                        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedProject ? selectedProject.name : 'No Project Selected'}
                                    </h2>
                                    {selectedProject && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {selectedProject.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* AI Analysis Toggle */}
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={aiAnalysisEnabled}
                                            onChange={(e) => setAiAnalysisEnabled(e.target.checked)}
                                            disabled={isWorkflowRunning}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        AI Analysis
                                    </label>

                                    {/* Workflow Control Buttons */}
                                    {!isWorkflowRunning ? (
                                        <button
                                            onClick={handleStartWorkflow}
                                            disabled={!selectedProjectId || isStarting}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                                        >
                                            {isStarting ? 'Starting...' : 'Start Workflow'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleResetWorkflow}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            Reset Workflow
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1 overflow-hidden">
                            {selectedProject ? (
                                <LazyCodeEditor
                                    value={selectedProject.contractCode}
                                    onChange={handleCodeChange}
                                    readOnly={isCodeReadOnly}
                                    language="solidity"
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    <div className="text-center">
                                        <svg
                                            className="w-16 h-16 mx-auto mb-4 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="text-lg font-medium">No project selected</p>
                                        <p className="text-sm mt-2">Create or select a project to get started</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Network, Wallet, Workflow Visualizer and Deployment History */}
                    <aside className="w-96 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
                        {/* Network and Wallet Controls */}
                        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                            <div className="flex flex-col gap-3">
                                <NetworkSelector />
                                <WalletConnect />
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Workflow Visualizer */}
                            {workflow && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Workflow Progress
                                    </h3>
                                    <WorkflowVisualizer
                                        steps={workflow.steps}
                                        currentStepIndex={workflow.currentStepIndex}
                                    />
                                </div>
                            )}

                            {/* Deployment History */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Deployment History
                                </h3>
                                <DeploymentHistory />
                            </div>
                        </div>
                    </aside>
                </main>

                {/* Modals */}
                {showCompilationErrors && workflow?.compilationResult && (
                    <CompilationErrorDisplay
                        errors={workflow.compilationResult.errors || []}
                        warnings={workflow.compilationResult.warnings}
                        onRetry={handleCompilationErrorRetry}
                        onClose={() => setShowCompilationErrors(false)}
                    />
                )}

                {showSecurityReport && workflow?.analysisResult && (
                    <div className="fixed inset-0 z-50">
                        <SecurityReport
                            analysis={workflow.analysisResult}
                            onFixIssues={handleSecurityFixIssues}
                            onContinue={handleSecurityContinue}
                        />
                    </div>
                )}

                {showConstructorModal && workflow?.constructorArgs && workflow?.compilationResult?.abi && (
                    <ConstructorArgumentsModal
                        isOpen={showConstructorModal}
                        abi={workflow.compilationResult.abi}
                        arguments={workflow.constructorArgs}
                        onArgumentChange={(index, value) => {
                            const args = [...workflow.constructorArgs];
                            args[index].value = value;
                            useStore.getState().setConstructorArgs(args);
                        }}
                        onSubmit={handleConstructorSubmit}
                        onCancel={handleConstructorCancel}
                        isDeploying={isDeploying}
                    />
                )}

                {showDeploymentPanel &&
                    workflow?.deploymentResult &&
                    workflow?.compilationResult &&
                    selectedNetwork &&
                    selectedProject && (
                        <DeploymentPanel
                            isOpen={showDeploymentPanel}
                            contractAddress={workflow.deploymentResult.contractAddress}
                            transactionHash={workflow.deploymentResult.transactionHash}
                            networkName={selectedNetwork.name}
                            explorerUrl={selectedNetwork.explorerUrl}
                            timestamp={Date.now()}
                            abi={workflow.compilationResult.abi || []}
                            bytecode={workflow.compilationResult.bytecode || ''}
                            contractName={selectedProject.name}
                            onClose={handleDeploymentClose}
                        />
                    )}
            </div>
        </ErrorBoundary>
    );
}
