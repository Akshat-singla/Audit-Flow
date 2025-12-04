import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useStore } from './store';
import { storageManager } from './storageManager';
import type { Network } from './types';

// Mock localStorage for testing
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

// Setup global localStorage mock
Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

describe('Store Property Tests', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorageMock.clear();

        // Reset store state
        useStore.setState({
            networks: [],
            selectedNetworkId: null,
            projects: [],
            selectedProjectId: null,
            wallet: {
                address: null,
                chainId: null,
                isConnected: false,
            },
            workflow: null,
            deploymentHistory: [],
        });
    });

    // ==================== Property 2: Active network selection ====================

    // Feature: smart-contract-deployer, Property 2: Active network selection
    // For any network in the network selector, selecting it should set that network as the active deployment target.
    // Validates: Requirements 1.4
    it('Property 2: Active network selection', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 1, maxLength: 50 }),
                    chainId: fc.integer({ min: 1, max: 999999 }),
                    rpcUrl: fc.webUrl(),
                    explorerUrl: fc.webUrl(),
                    currencySymbol: fc.string({ minLength: 1, maxLength: 10 }),
                }),
                (networkData) => {
                    const store = useStore.getState();

                    // Add network to store
                    store.addNetwork(networkData);

                    // Get the added network
                    const networks = useStore.getState().networks;
                    const addedNetwork = networks[networks.length - 1];

                    // Select the network
                    store.selectNetwork(addedNetwork.id);

                    // Verify the network is selected
                    const selectedNetworkId = useStore.getState().selectedNetworkId;
                    expect(selectedNetworkId).toBe(addedNetwork.id);

                    // Verify it's persisted in storage
                    const storedSelectedId = storageManager.getSelectedNetwork();
                    expect(storedSelectedId).toBe(addedNetwork.id);
                }
            ),
            { numRuns: 100 }
        );
    });

    // ==================== Property 22: Data persistence immediacy ====================

    // Feature: smart-contract-deployer, Property 22: Data persistence immediacy
    // For any modification to networks, projects, or deployment history, the change should be immediately present in local storage without requiring explicit save action.
    // Validates: Requirements 11.1
    it('Property 22: Data persistence immediacy - Networks', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 1, maxLength: 50 }),
                    chainId: fc.integer({ min: 1, max: 999999 }),
                    rpcUrl: fc.webUrl(),
                    explorerUrl: fc.webUrl(),
                    currencySymbol: fc.string({ minLength: 1, maxLength: 10 }),
                }),
                (networkData) => {
                    const store = useStore.getState();

                    // Add network
                    store.addNetwork(networkData);

                    // Get the added network from store
                    const networks = useStore.getState().networks;
                    const addedNetwork = networks[networks.length - 1];

                    // Verify it's immediately in localStorage
                    const storedNetworks = storageManager.getNetworks();
                    const storedNetwork = storedNetworks.find(n => n.id === addedNetwork.id);

                    expect(storedNetwork).toBeDefined();
                    expect(storedNetwork?.name).toBe(networkData.name);
                    expect(storedNetwork?.chainId).toBe(networkData.chainId);
                    expect(storedNetwork?.rpcUrl).toBe(networkData.rpcUrl);
                    expect(storedNetwork?.explorerUrl).toBe(networkData.explorerUrl);
                    expect(storedNetwork?.currencySymbol).toBe(networkData.currencySymbol);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 22: Data persistence immediacy - Projects', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 1, maxLength: 100 }),
                    description: fc.string({ maxLength: 500 }),
                }),
                (projectData) => {
                    const store = useStore.getState();

                    // Create project
                    store.createProject(projectData.name, projectData.description);

                    // Get the created project from store
                    const projects = useStore.getState().projects;
                    const createdProject = projects[projects.length - 1];

                    // Verify it's immediately in localStorage
                    const storedProjects = storageManager.getProjects();
                    const storedProject = storedProjects.find(p => p.id === createdProject.id);

                    expect(storedProject).toBeDefined();
                    expect(storedProject?.name).toBe(projectData.name);
                    expect(storedProject?.description).toBe(projectData.description);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 22: Data persistence immediacy - Project Updates', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 1, maxLength: 100 }),
                    description: fc.string({ maxLength: 500 }),
                }),
                fc.string({ minLength: 1, maxLength: 1000 }),
                (projectData, newContractCode) => {
                    const store = useStore.getState();

                    // Create project
                    store.createProject(projectData.name, projectData.description);

                    // Get the created project
                    const projects = useStore.getState().projects;
                    const createdProject = projects[projects.length - 1];

                    // Update project with contract code
                    store.updateProject(createdProject.id, { contractCode: newContractCode });

                    // Verify update is immediately in localStorage
                    const storedProject = storageManager.getProject(createdProject.id);

                    expect(storedProject).toBeDefined();
                    expect(storedProject?.contractCode).toBe(newContractCode);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 22: Data persistence immediacy - Deployment History', () => {
        fc.assert(
            fc.property(
                fc.record({
                    projectId: fc.uuid(),
                    projectName: fc.string({ minLength: 1, maxLength: 100 }),
                    networkId: fc.uuid(),
                    networkName: fc.string({ minLength: 1, maxLength: 50 }),
                    contractAddress: fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => '0x' + s),
                    transactionHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => '0x' + s),
                    abi: fc.constant([]),
                    bytecode: fc.hexaString({ minLength: 10, maxLength: 100 }).map(s => '0x' + s),
                    timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
                }),
                (deploymentData) => {
                    const store = useStore.getState();

                    // Add deployment
                    store.addDeployment(deploymentData);

                    // Get the added deployment from store
                    const history = useStore.getState().deploymentHistory;
                    const addedDeployment = history[history.length - 1];

                    // Verify it's immediately in localStorage
                    const storedHistory = storageManager.getDeploymentHistory();
                    const storedDeployment = storedHistory.find(h => h.id === addedDeployment.id);

                    expect(storedDeployment).toBeDefined();
                    expect(storedDeployment?.projectId).toBe(deploymentData.projectId);
                    expect(storedDeployment?.contractAddress).toBe(deploymentData.contractAddress);
                    expect(storedDeployment?.transactionHash).toBe(deploymentData.transactionHash);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 22: Data persistence immediacy - Network Deletion', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 1, maxLength: 50 }),
                    chainId: fc.integer({ min: 1, max: 999999 }),
                    rpcUrl: fc.webUrl(),
                    explorerUrl: fc.webUrl(),
                    currencySymbol: fc.string({ minLength: 1, maxLength: 10 }),
                }),
                (networkData) => {
                    const store = useStore.getState();

                    // Add network
                    store.addNetwork(networkData);

                    // Get the added network
                    const networks = useStore.getState().networks;
                    const addedNetwork = networks[networks.length - 1];

                    // Delete network
                    store.deleteNetwork(addedNetwork.id);

                    // Verify it's immediately removed from localStorage
                    const storedNetworks = storageManager.getNetworks();
                    const storedNetwork = storedNetworks.find(n => n.id === addedNetwork.id);

                    expect(storedNetwork).toBeUndefined();
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 22: Data persistence immediacy - Project Deletion', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 1, maxLength: 100 }),
                    description: fc.string({ maxLength: 500 }),
                }),
                (projectData) => {
                    const store = useStore.getState();

                    // Create project
                    store.createProject(projectData.name, projectData.description);

                    // Get the created project
                    const projects = useStore.getState().projects;
                    const createdProject = projects[projects.length - 1];

                    // Delete project
                    store.deleteProject(createdProject.id);

                    // Verify it's immediately removed from localStorage
                    const storedProject = storageManager.getProject(createdProject.id);

                    expect(storedProject).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 22: Data persistence immediacy - Deployment Deletion', () => {
        fc.assert(
            fc.property(
                fc.record({
                    projectId: fc.uuid(),
                    projectName: fc.string({ minLength: 1, maxLength: 100 }),
                    networkId: fc.uuid(),
                    networkName: fc.string({ minLength: 1, maxLength: 50 }),
                    contractAddress: fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => '0x' + s),
                    transactionHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => '0x' + s),
                    abi: fc.constant([]),
                    bytecode: fc.hexaString({ minLength: 10, maxLength: 100 }).map(s => '0x' + s),
                    timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
                }),
                (deploymentData) => {
                    const store = useStore.getState();

                    // Add deployment
                    store.addDeployment(deploymentData);

                    // Get the added deployment
                    const history = useStore.getState().deploymentHistory;
                    const addedDeployment = history[history.length - 1];

                    // Delete deployment
                    store.deleteDeployment(addedDeployment.id);

                    // Verify it's immediately removed from localStorage
                    const storedDeployment = storageManager.getDeployment(addedDeployment.id);

                    expect(storedDeployment).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    // ==================== Property 21: Workflow status synchronization ====================

    // Feature: smart-contract-deployer, Property 21: Workflow status synchronization
    // For any workflow step status change (in-progress, completed, skipped, or failed), the workflow visualizer should update to reflect the new status.
    // Validates: Requirements 10.2, 10.3, 10.4, 10.5
    it('Property 21: Workflow status synchronization - in-progress', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.boolean(),
                fc.integer({ min: 0, max: 3 }),
                (projectId, aiAnalysisEnabled, stepIndex) => {
                    const store = useStore.getState();

                    // Initialize workflow
                    store.initializeWorkflow(projectId, aiAnalysisEnabled);

                    // Get the workflow state
                    const workflow = useStore.getState().workflow;
                    expect(workflow).not.toBeNull();

                    // Adjust stepIndex based on actual number of steps
                    const actualStepIndex = Math.min(stepIndex, workflow!.steps.length - 1);

                    // Update step to in-progress
                    store.updateWorkflowStep(actualStepIndex, 'in-progress');

                    // Verify the step status is updated
                    const updatedWorkflow = useStore.getState().workflow;
                    expect(updatedWorkflow).not.toBeNull();
                    expect(updatedWorkflow!.steps[actualStepIndex].status).toBe('in-progress');
                    expect(updatedWorkflow!.currentStepIndex).toBe(actualStepIndex);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21: Workflow status synchronization - completed', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.boolean(),
                fc.integer({ min: 0, max: 3 }),
                (projectId, aiAnalysisEnabled, stepIndex) => {
                    const store = useStore.getState();

                    // Initialize workflow
                    store.initializeWorkflow(projectId, aiAnalysisEnabled);

                    // Get the workflow state
                    const workflow = useStore.getState().workflow;
                    expect(workflow).not.toBeNull();

                    // Adjust stepIndex based on actual number of steps
                    const actualStepIndex = Math.min(stepIndex, workflow!.steps.length - 1);

                    // Update step to completed
                    store.updateWorkflowStep(actualStepIndex, 'completed');

                    // Verify the step status is updated and currentStepIndex advances
                    const updatedWorkflow = useStore.getState().workflow;
                    expect(updatedWorkflow).not.toBeNull();
                    expect(updatedWorkflow!.steps[actualStepIndex].status).toBe('completed');
                    expect(updatedWorkflow!.currentStepIndex).toBe(actualStepIndex + 1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21: Workflow status synchronization - skipped', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.boolean(),
                fc.integer({ min: 0, max: 3 }),
                (projectId, aiAnalysisEnabled, stepIndex) => {
                    const store = useStore.getState();

                    // Initialize workflow
                    store.initializeWorkflow(projectId, aiAnalysisEnabled);

                    // Get the workflow state
                    const workflow = useStore.getState().workflow;
                    expect(workflow).not.toBeNull();

                    // Adjust stepIndex based on actual number of steps
                    const actualStepIndex = Math.min(stepIndex, workflow!.steps.length - 1);

                    // Update step to skipped
                    store.updateWorkflowStep(actualStepIndex, 'skipped');

                    // Verify the step status is updated
                    const updatedWorkflow = useStore.getState().workflow;
                    expect(updatedWorkflow).not.toBeNull();
                    expect(updatedWorkflow!.steps[actualStepIndex].status).toBe('skipped');
                    expect(updatedWorkflow!.currentStepIndex).toBe(actualStepIndex);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21: Workflow status synchronization - failed with error message', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.boolean(),
                fc.integer({ min: 0, max: 3 }),
                fc.string({ minLength: 1, maxLength: 200 }),
                (projectId, aiAnalysisEnabled, stepIndex, errorMessage) => {
                    const store = useStore.getState();

                    // Initialize workflow
                    store.initializeWorkflow(projectId, aiAnalysisEnabled);

                    // Get the workflow state
                    const workflow = useStore.getState().workflow;
                    expect(workflow).not.toBeNull();

                    // Adjust stepIndex based on actual number of steps
                    const actualStepIndex = Math.min(stepIndex, workflow!.steps.length - 1);

                    // Update step to failed with error message
                    store.updateWorkflowStep(actualStepIndex, 'failed', errorMessage);

                    // Verify the step status is updated with error message
                    const updatedWorkflow = useStore.getState().workflow;
                    expect(updatedWorkflow).not.toBeNull();
                    expect(updatedWorkflow!.steps[actualStepIndex].status).toBe('failed');
                    expect(updatedWorkflow!.steps[actualStepIndex].errorMessage).toBe(errorMessage);
                    expect(updatedWorkflow!.currentStepIndex).toBe(actualStepIndex);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21: Workflow status synchronization - multiple status changes', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.boolean(),
                (projectId, aiAnalysisEnabled) => {
                    const store = useStore.getState();

                    // Initialize workflow
                    store.initializeWorkflow(projectId, aiAnalysisEnabled);

                    // Get the workflow state
                    const workflow = useStore.getState().workflow;
                    expect(workflow).not.toBeNull();

                    const numSteps = workflow!.steps.length;

                    // Simulate a workflow progression through multiple steps
                    for (let i = 0; i < Math.min(3, numSteps); i++) {
                        // Set step to in-progress
                        store.updateWorkflowStep(i, 'in-progress');
                        let updatedWorkflow = useStore.getState().workflow;
                        expect(updatedWorkflow!.steps[i].status).toBe('in-progress');

                        // Complete the step
                        store.updateWorkflowStep(i, 'completed');
                        updatedWorkflow = useStore.getState().workflow;
                        expect(updatedWorkflow!.steps[i].status).toBe('completed');
                        expect(updatedWorkflow!.currentStepIndex).toBe(i + 1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 21: Workflow status synchronization - AI analysis enabled vs disabled', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                (projectId) => {
                    const store = useStore.getState();

                    // Test with AI analysis enabled
                    store.initializeWorkflow(projectId, true);
                    let workflow = useStore.getState().workflow;
                    expect(workflow).not.toBeNull();
                    const stepsWithAI = workflow!.steps.length;
                    expect(workflow!.steps[0].id).toBe('analyze');

                    // Reset workflow
                    store.resetWorkflow();

                    // Test with AI analysis disabled
                    store.initializeWorkflow(projectId, false);
                    workflow = useStore.getState().workflow;
                    expect(workflow).not.toBeNull();
                    const stepsWithoutAI = workflow!.steps.length;
                    expect(workflow!.steps[0].id).not.toBe('analyze');
                    expect(stepsWithAI).toBe(stepsWithoutAI + 1);
                }
            ),
            { numRuns: 100 }
        );
    });
});
