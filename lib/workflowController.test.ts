import { describe, it, expect, beforeEach, vi } from 'vitest';
import { workflowController } from './workflowController';
import { useStore } from './store';
import { walletManager } from './walletManager';
import * as contractDeployer from './contractDeployer';

// Mock fetch
global.fetch = vi.fn();

// Mock wallet manager
vi.mock('./walletManager', () => ({
    walletManager: {
        getSigner: vi.fn(),
        getProvider: vi.fn(),
    },
}));

// Mock contract deployer
vi.mock('./contractDeployer', () => ({
    deployContract: vi.fn(),
    ensureNetwork: vi.fn(),
}));

describe('WorkflowController', () => {
    beforeEach(() => {
        // Reset store
        useStore.getState().resetWorkflow();

        // Clear all mocks
        vi.clearAllMocks();

        // Reset fetch mock
        (global.fetch as any).mockReset();
    });

    describe('startWorkflow', () => {
        it('should initialize workflow with AI analysis enabled', async () => {
            const store = useStore.getState();

            // Load projects first
            store.loadProjects();

            // Create a test project
            store.createProject('Test Project', 'Test description');

            // Get the project after creation
            const updatedStore = useStore.getState();
            const project = updatedStore.projects[0];

            // Update project with contract code
            store.updateProject(project.id, {
                ...project,
                contractCode: 'pragma solidity ^0.8.0; contract Test {}',
            });

            // Mock successful analysis
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    analysis: {
                        summary: 'Test summary',
                        vulnerabilities: [],
                        recommendations: [],
                    },
                }),
            });

            // Mock successful compilation
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    abi: [],
                    bytecode: '0x123',
                }),
            });

            await workflowController.startWorkflow(project.id, true);

            const workflow = useStore.getState().workflow;
            expect(workflow).not.toBeNull();
            expect(workflow?.aiAnalysisEnabled).toBe(true);
            expect(workflow?.steps.some(s => s.id === 'analyze')).toBe(true);
        });

        it('should initialize workflow without AI analysis', async () => {
            const store = useStore.getState();

            // Create a test project
            store.createProject('Test Project', 'Test description');
            const project = store.projects[0];

            // Update project with contract code
            store.updateProject(project.id, {
                ...project,
                contractCode: 'pragma solidity ^0.8.0; contract Test {}',
            });

            // Mock successful compilation
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    abi: [],
                    bytecode: '0x123',
                }),
            });

            await workflowController.startWorkflow(project.id, false);

            const workflow = useStore.getState().workflow;
            expect(workflow).not.toBeNull();
            expect(workflow?.aiAnalysisEnabled).toBe(false);
            expect(workflow?.steps.some(s => s.id === 'analyze')).toBe(false);
        });
    });

    describe('runCompilationStep', () => {
        it('should compile contract successfully', async () => {
            const store = useStore.getState();

            // Create a test project
            store.createProject('Test Project', 'Test description');
            const project = store.projects[0];

            // Update project with contract code
            store.updateProject(project.id, {
                ...project,
                contractCode: 'pragma solidity ^0.8.0; contract Test {}',
            });

            // Initialize workflow
            store.initializeWorkflow(project.id, false);

            // Mock successful compilation
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    abi: [{ type: 'constructor', inputs: [] }],
                    bytecode: '0x123456',
                }),
            });

            await workflowController.runCompilationStep();

            const workflow = useStore.getState().workflow;
            expect(workflow?.compilationResult).not.toBeNull();
            expect(workflow?.compilationResult?.success).toBe(true);
            expect(workflow?.compilationResult?.abi).toBeDefined();
            expect(workflow?.compilationResult?.bytecode).toBe('0x123456');
        });

        it('should handle compilation errors', async () => {
            const store = useStore.getState();

            // Create a test project
            store.createProject('Test Project', 'Test description');
            const project = store.projects[0];

            // Update project with contract code
            store.updateProject(project.id, {
                ...project,
                contractCode: 'pragma solidity ^0.8.0; contract Test { invalid syntax }',
            });

            // Initialize workflow
            store.initializeWorkflow(project.id, false);

            // Mock compilation error
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: false,
                    errors: ['Syntax error on line 5'],
                }),
            });

            await expect(workflowController.runCompilationStep()).rejects.toThrow();

            const workflow = useStore.getState().workflow;
            const compileStep = workflow?.steps.find(s => s.id === 'compile');
            expect(compileStep?.status).toBe('failed');
            expect(compileStep?.errorMessage).toContain('Syntax error');
        });
    });

    describe('validateConstructorArgs', () => {
        it('should validate constructor arguments', () => {
            const store = useStore.getState();

            // Create a test project
            store.createProject('Test Project', 'Test description');
            const project = store.projects[0];

            // Initialize workflow with compilation result
            store.initializeWorkflow(project.id, false);
            store.setCompilationResult({
                success: true,
                abi: [
                    {
                        type: 'constructor',
                        inputs: [
                            { name: 'value', type: 'uint256' },
                        ],
                    },
                ],
                bytecode: '0x123',
            });

            const args = [
                { name: 'value', type: 'uint256', value: '100' },
            ];

            expect(() => workflowController.validateConstructorArgs(args)).not.toThrow();
        });

        it('should reject invalid constructor arguments', () => {
            const store = useStore.getState();

            // Create a test project
            store.createProject('Test Project', 'Test description');
            const project = store.projects[0];

            // Initialize workflow with compilation result
            store.initializeWorkflow(project.id, false);
            store.setCompilationResult({
                success: true,
                abi: [
                    {
                        type: 'constructor',
                        inputs: [
                            { name: 'value', type: 'uint256' },
                        ],
                    },
                ],
                bytecode: '0x123',
            });

            const args = [
                { name: 'value', type: 'uint256', value: '' }, // Empty value
            ];

            expect(() => workflowController.validateConstructorArgs(args)).toThrow();
        });
    });

    describe('runDeploymentStep', () => {
        it('should deploy contract successfully', async () => {
            const store = useStore.getState();

            // Load data first
            store.loadProjects();
            store.loadNetworks();

            // Set up test data
            store.createProject('Test Project', 'Test description');
            const updatedStore1 = useStore.getState();
            const project = updatedStore1.projects[0];

            store.addNetwork({
                name: 'Test Network',
                chainId: 1,
                rpcUrl: 'http://localhost:8545',
                explorerUrl: 'http://explorer.test',
                currencySymbol: 'ETH',
            });
            const updatedStore2 = useStore.getState();
            const network = updatedStore2.networks[0];
            store.selectNetwork(network.id);

            store.setWalletState({
                address: '0x1234567890123456789012345678901234567890',
                chainId: 1,
                isConnected: true,
            });

            // Initialize workflow with compilation result
            store.initializeWorkflow(project.id, false);
            store.setCompilationResult({
                success: true,
                abi: [],
                bytecode: '0x123',
            });

            // Mock signer
            const mockSigner = { address: '0x123' };
            (walletManager.getSigner as any).mockReturnValue(mockSigner);

            // Mock deployment
            (contractDeployer.deployContract as any).mockResolvedValue({
                contractAddress: '0xabcdef',
                transactionHash: '0x123abc',
                blockNumber: 100,
            });

            await workflowController.runDeploymentStep();

            const workflow = useStore.getState().workflow;
            expect(workflow?.deploymentResult).not.toBeNull();
            expect(workflow?.deploymentResult?.contractAddress).toBe('0xabcdef');

            // Check deployment was saved to history
            const history = useStore.getState().deploymentHistory;
            expect(history.length).toBe(1);
            expect(history[0].contractAddress).toBe('0xabcdef');
        });

        it('should handle deployment errors', async () => {
            const store = useStore.getState();

            // Set up test data
            store.createProject('Test Project', 'Test description');
            const project = store.projects[0];

            store.addNetwork({
                name: 'Test Network',
                chainId: 1,
                rpcUrl: 'http://localhost:8545',
                explorerUrl: 'http://explorer.test',
                currencySymbol: 'ETH',
            });
            const network = store.networks[0];
            store.selectNetwork(network.id);

            store.setWalletState({
                address: '0x1234567890123456789012345678901234567890',
                chainId: 1,
                isConnected: true,
            });

            // Initialize workflow with compilation result
            store.initializeWorkflow(project.id, false);
            store.setCompilationResult({
                success: true,
                abi: [],
                bytecode: '0x123',
            });

            // Mock signer
            const mockSigner = { address: '0x123' };
            (walletManager.getSigner as any).mockReturnValue(mockSigner);

            // Mock deployment failure
            (contractDeployer.deployContract as any).mockRejectedValue(
                new Error('Insufficient funds')
            );

            await expect(workflowController.runDeploymentStep()).rejects.toThrow('Insufficient funds');

            const workflow = useStore.getState().workflow;
            const deployStep = workflow?.steps.find(s => s.id === 'deploy');
            expect(deployStep?.status).toBe('failed');
        });
    });

    describe('resetWorkflow', () => {
        it('should reset workflow state', () => {
            const store = useStore.getState();

            // Create a test project
            store.createProject('Test Project', 'Test description');
            const project = store.projects[0];

            // Initialize workflow
            store.initializeWorkflow(project.id, false);
            expect(useStore.getState().workflow).not.toBeNull();

            // Reset workflow
            workflowController.resetWorkflow();
            expect(useStore.getState().workflow).toBeNull();
        });
    });
});
