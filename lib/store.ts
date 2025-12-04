import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storageManager } from './storageManager';
import type {
    Project,
    Network,
    WalletState,
    WorkflowState,
    WorkflowStep,
    CompileResponse,
    SecurityAnalysis,
    ConstructorArgument,
    DeploymentResult,
    DeploymentHistoryEntry,
} from './types';
import { generateUUID } from './uuid';

// ==================== Network Slice ====================

interface NetworkSlice {
    networks: Network[];
    selectedNetworkId: string | null;

    // Actions
    addNetwork: (network: Omit<Network, 'id' | 'isCustom'>) => void;
    selectNetwork: (networkId: string) => void;
    deleteNetwork: (networkId: string) => void;
    loadNetworks: () => void;
}

// ==================== Project Slice ====================

interface ProjectSlice {
    projects: Project[];
    selectedProjectId: string | null;

    // Actions
    createProject: (name: string, description: string) => void;
    selectProject: (projectId: string) => void;
    updateProject: (projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
    deleteProject: (projectId: string) => void;
    loadProjects: () => void;
}

// ==================== Wallet Slice ====================

interface WalletSlice {
    wallet: WalletState;

    // Actions
    setWalletState: (state: WalletState) => void;
    disconnectWallet: () => void;
}

// ==================== Workflow Slice ====================

interface WorkflowSlice {
    workflow: WorkflowState | null;

    // Actions
    initializeWorkflow: (projectId: string, aiAnalysisEnabled: boolean) => void;
    updateWorkflowStep: (stepIndex: number, status: WorkflowStep['status'], errorMessage?: string) => void;
    setAnalysisResult: (result: SecurityAnalysis) => void;
    setCompilationResult: (result: CompileResponse) => void;
    setConstructorArgs: (args: ConstructorArgument[]) => void;
    setDeploymentResult: (result: DeploymentResult) => void;
    resetWorkflow: () => void;
}

// ==================== Deployment History Slice ====================

interface DeploymentHistorySlice {
    deploymentHistory: DeploymentHistoryEntry[];

    // Actions
    addDeployment: (entry: Omit<DeploymentHistoryEntry, 'id'>) => void;
    deleteDeployment: (deploymentId: string) => void;
    clearAllDeployments: () => void;
    loadDeploymentHistory: () => void;
}

// ==================== Combined Store ====================

type AppStore = NetworkSlice & ProjectSlice & WalletSlice & WorkflowSlice & DeploymentHistorySlice;

const createDefaultWorkflowSteps = (aiAnalysisEnabled: boolean): WorkflowStep[] => {
    const steps: WorkflowStep[] = [];

    if (aiAnalysisEnabled) {
        steps.push({
            id: 'analyze',
            name: 'Analyze',
            status: 'pending',
        });
    }

    steps.push(
        {
            id: 'compile',
            name: 'Compile',
            status: 'pending',
        },
        {
            id: 'review',
            name: 'Review',
            status: 'pending',
        },
        {
            id: 'deploy',
            name: 'Deploy',
            status: 'pending',
        },
        {
            id: 'done',
            name: 'Done',
            status: 'pending',
        }
    );

    return steps;
};

export const useStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // ==================== Network State & Actions ====================
            networks: [],
            selectedNetworkId: null,

            addNetwork: (network) => {
                const newNetwork: Network = {
                    ...network,
                    id: generateUUID(),
                    isCustom: true,
                };

                try {
                    storageManager.saveNetwork(newNetwork);

                    set((state) => ({
                        networks: [...state.networks, newNetwork],
                    }));
                } catch (error) {
                    console.error('Failed to save network:', error);
                    throw error;
                }
            },

            selectNetwork: (networkId) => {
                storageManager.setSelectedNetwork(networkId);
                set({ selectedNetworkId: networkId });
            },

            deleteNetwork: (networkId) => {
                storageManager.deleteNetwork(networkId);

                set((state) => ({
                    networks: state.networks.filter(n => n.id !== networkId),
                    selectedNetworkId: state.selectedNetworkId === networkId ? null : state.selectedNetworkId,
                }));
            },

            loadNetworks: () => {
                const networks = storageManager.getNetworks();
                const selectedNetworkId = storageManager.getSelectedNetwork();
                set({ networks, selectedNetworkId });
            },

            // ==================== Project State & Actions ====================
            projects: [],
            selectedProjectId: null,

            createProject: (name, description) => {
                const newProject: Project = {
                    id: generateUUID(),
                    name,
                    description,
                    contractCode: '',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                try {
                    storageManager.saveProject(newProject);

                    set((state) => ({
                        projects: [...state.projects, newProject],
                    }));
                } catch (error) {
                    console.error('Failed to create project:', error);
                    throw error;
                }
            },

            selectProject: (projectId) => {
                set({ selectedProjectId: projectId });
            },

            updateProject: (projectId, updates) => {
                const project = get().projects.find(p => p.id === projectId);
                if (!project) return;

                const updatedProject: Project = {
                    ...project,
                    ...updates,
                    updatedAt: Date.now(),
                };

                try {
                    storageManager.saveProject(updatedProject);

                    set((state) => ({
                        projects: state.projects.map(p =>
                            p.id === projectId ? updatedProject : p
                        ),
                    }));
                } catch (error) {
                    console.error('Failed to update project:', error);
                    throw error;
                }
            },

            deleteProject: (projectId) => {
                storageManager.deleteProject(projectId);

                set((state) => ({
                    projects: state.projects.filter(p => p.id !== projectId),
                    selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
                    deploymentHistory: state.deploymentHistory.filter(h => h.projectId !== projectId),
                }));
            },

            loadProjects: () => {
                const projects = storageManager.getProjects();
                set({ projects });
            },

            // ==================== Wallet State & Actions ====================
            wallet: {
                address: null,
                chainId: null,
                isConnected: false,
            },

            setWalletState: (state) => {
                storageManager.saveWalletState(state);
                set({ wallet: state });
            },

            disconnectWallet: () => {
                const disconnectedState: WalletState = {
                    address: null,
                    chainId: null,
                    isConnected: false,
                };
                storageManager.clearWalletState();
                set({ wallet: disconnectedState });
            },

            // ==================== Workflow State & Actions ====================
            workflow: null,

            initializeWorkflow: (projectId, aiAnalysisEnabled) => {
                const steps = createDefaultWorkflowSteps(aiAnalysisEnabled);

                set({
                    workflow: {
                        projectId,
                        steps,
                        currentStepIndex: 0,
                        aiAnalysisEnabled,
                        analysisResult: null,
                        compilationResult: null,
                        constructorArgs: [],
                        deploymentResult: null,
                    },
                });
            },

            updateWorkflowStep: (stepIndex, status, errorMessage) => {
                set((state) => {
                    if (!state.workflow) return state;

                    const updatedSteps = [...state.workflow.steps];
                    updatedSteps[stepIndex] = {
                        ...updatedSteps[stepIndex],
                        status,
                        errorMessage,
                    };

                    return {
                        workflow: {
                            ...state.workflow,
                            steps: updatedSteps,
                            currentStepIndex: status === 'completed' ? stepIndex + 1 : stepIndex,
                        },
                    };
                });
            },

            setAnalysisResult: (result) => {
                set((state) => {
                    if (!state.workflow) return state;

                    return {
                        workflow: {
                            ...state.workflow,
                            analysisResult: result,
                        },
                    };
                });
            },

            setCompilationResult: (result) => {
                set((state) => {
                    if (!state.workflow) return state;

                    return {
                        workflow: {
                            ...state.workflow,
                            compilationResult: result,
                        },
                    };
                });
            },

            setConstructorArgs: (args) => {
                set((state) => {
                    if (!state.workflow) return state;

                    return {
                        workflow: {
                            ...state.workflow,
                            constructorArgs: args,
                        },
                    };
                });
            },

            setDeploymentResult: (result) => {
                set((state) => {
                    if (!state.workflow) return state;

                    return {
                        workflow: {
                            ...state.workflow,
                            deploymentResult: result,
                        },
                    };
                });
            },

            resetWorkflow: () => {
                set({ workflow: null });
            },

            // ==================== Deployment History State & Actions ====================
            deploymentHistory: [],

            addDeployment: (entry) => {
                const newEntry: DeploymentHistoryEntry = {
                    ...entry,
                    id: generateUUID(),
                };

                try {
                    storageManager.saveDeployment(newEntry);

                    set((state) => ({
                        deploymentHistory: [...state.deploymentHistory, newEntry],
                    }));
                } catch (error) {
                    console.error('Failed to save deployment:', error);
                    throw error;
                }
            },

            deleteDeployment: (deploymentId) => {
                storageManager.deleteDeployment(deploymentId);

                set((state) => ({
                    deploymentHistory: state.deploymentHistory.filter(h => h.id !== deploymentId),
                }));
            },

            clearAllDeployments: () => {
                storageManager.clearAllDeployments();
                set({ deploymentHistory: [] });
            },

            loadDeploymentHistory: () => {
                const deploymentHistory = storageManager.getDeploymentHistory();
                set({ deploymentHistory });
            },
        }),
        {
            name: 'sc-deployer-store',
            // Only persist selected IDs and wallet state, not the full data
            partialize: (state) => ({
                selectedNetworkId: state.selectedNetworkId,
                selectedProjectId: state.selectedProjectId,
                wallet: state.wallet,
            }),
        }
    )
);
