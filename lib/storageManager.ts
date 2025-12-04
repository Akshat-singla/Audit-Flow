import type {
    Project,
    Network,
    DeploymentHistoryEntry,
    WalletState,
    LocalStorageSchema,
} from './types';

const CURRENT_SCHEMA_VERSION = 1;

// Storage keys
const KEYS = {
    PROJECTS: 'sc-deployer:projects',
    NETWORKS: 'sc-deployer:networks',
    DEPLOYMENT_HISTORY: 'sc-deployer:deployment-history',
    SELECTED_NETWORK: 'sc-deployer:selected-network',
    WALLET_STATE: 'sc-deployer:wallet-state',
    SCHEMA_VERSION: 'sc-deployer:schema-version',
} as const;

class StorageManager {
    private isBrowser: boolean;

    constructor() {
        this.isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
        if (this.isBrowser) {
            this.initializeStorage();
        }
    }

    /**
     * Initialize storage with default values and handle migrations
     */
    private initializeStorage(): void {
        try {
            const version = this.getSchemaVersion();

            if (version === 0) {
                // First time initialization
                this.setSchemaVersion(CURRENT_SCHEMA_VERSION);
                this.setItem(KEYS.PROJECTS, []);
                this.setItem(KEYS.NETWORKS, this.getDefaultNetworks());
                this.setItem(KEYS.DEPLOYMENT_HISTORY, []);
            } else if (version < CURRENT_SCHEMA_VERSION) {
                // Run migrations
                this.migrate(version, CURRENT_SCHEMA_VERSION);
            }
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            this.resetStorage();
        }
    }

    /**
     * Get default predefined networks (Sepolia, Holesky)
     */
    private getDefaultNetworks(): Network[] {
        return [
            {
                id: 'sepolia',
                name: 'Sepolia',
                chainId: 11155111,
                rpcUrl: 'https://rpc.sepolia.org',
                explorerUrl: 'https://sepolia.etherscan.io',
                currencySymbol: 'ETH',
                isCustom: false,
            },
            {
                id: 'holesky',
                name: 'Holesky',
                chainId: 17000,
                rpcUrl: 'https://ethereum-holesky.publicnode.com',
                explorerUrl: 'https://holesky.etherscan.io',
                currencySymbol: 'ETH',
                isCustom: false,
            },
        ];
    }

    /**
     * Get current schema version
     */
    private getSchemaVersion(): number {
        const version = this.getItem<number>(KEYS.SCHEMA_VERSION);
        return version ?? 0;
    }

    /**
     * Set schema version
     */
    private setSchemaVersion(version: number): void {
        this.setItem(KEYS.SCHEMA_VERSION, version);
    }

    /**
     * Migrate data between schema versions
     */
    private migrate(fromVersion: number, toVersion: number): void {
        console.log(`Migrating storage from version ${fromVersion} to ${toVersion}`);
        // Future migrations would go here
        this.setSchemaVersion(toVersion);
    }

    /**
     * Reset storage to default state
     */
    private resetStorage(): void {
        if (!this.isBrowser) return;

        try {
            Object.values(KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            this.initializeStorage();
        } catch (error) {
            console.error('Failed to reset storage:', error);
        }
    }

    /**
     * Generic get item from localStorage with type safety
     */
    private getItem<T>(key: string): T | null {
        if (!this.isBrowser) return null;

        try {
            const item = localStorage.getItem(key);
            if (item === null) return null;
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Failed to get item ${key}:`, error);
            return null;
        }
    }

    /**
     * Generic set item to localStorage with error handling
     */
    private setItem<T>(key: string, value: T): void {
        if (!this.isBrowser) return;

        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
        } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                const quotaError = new Error('Storage quota exceeded. Please clear deployment history or delete unused projects to free up space.');
                quotaError.name = 'QuotaExceededError';
                throw quotaError;
            }
            if (error instanceof Error) {
                throw new Error(`Failed to save data: ${error.message}`);
            }
            throw new Error('Failed to save data to local storage');
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo(): { used: number; available: number; percentage: number } | null {
        if (!this.isBrowser) return null;

        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        totalSize += key.length + value.length;
                    }
                }
            }

            // Most browsers have a 5-10MB limit for localStorage
            const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
            const percentage = (totalSize / estimatedLimit) * 100;

            return {
                used: totalSize,
                available: estimatedLimit - totalSize,
                percentage: Math.min(percentage, 100),
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    /**
     * Generic delete item from localStorage
     */
    private deleteItem(key: string): void {
        if (!this.isBrowser) return;

        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Failed to delete item ${key}:`, error);
        }
    }

    // ==================== Projects ====================

    /**
     * Get all projects
     */
    getProjects(): Project[] {
        return this.getItem<Project[]>(KEYS.PROJECTS) ?? [];
    }

    /**
     * Get a single project by ID
     */
    getProject(projectId: string): Project | null {
        const projects = this.getProjects();
        return projects.find(p => p.id === projectId) ?? null;
    }

    /**
     * Save a project (create or update)
     */
    saveProject(project: Project): void {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === project.id);

        if (index >= 0) {
            projects[index] = project;
        } else {
            projects.push(project);
        }

        this.setItem(KEYS.PROJECTS, projects);
    }

    /**
     * Delete a project and all associated deployment history
     */
    deleteProject(projectId: string): void {
        // Remove project
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== projectId);
        this.setItem(KEYS.PROJECTS, filteredProjects);

        // Remove associated deployment history
        const history = this.getDeploymentHistory();
        const filteredHistory = history.filter(h => h.projectId !== projectId);
        this.setItem(KEYS.DEPLOYMENT_HISTORY, filteredHistory);
    }

    // ==================== Networks ====================

    /**
     * Get all networks
     */
    getNetworks(): Network[] {
        return this.getItem<Network[]>(KEYS.NETWORKS) ?? [];
    }

    /**
     * Get a single network by ID
     */
    getNetwork(networkId: string): Network | null {
        const networks = this.getNetworks();
        return networks.find(n => n.id === networkId) ?? null;
    }

    /**
     * Save a network (create or update)
     */
    saveNetwork(network: Network): void {
        const networks = this.getNetworks();
        const index = networks.findIndex(n => n.id === network.id);

        if (index >= 0) {
            networks[index] = network;
        } else {
            networks.push(network);
        }

        this.setItem(KEYS.NETWORKS, networks);
    }

    /**
     * Delete a network
     */
    deleteNetwork(networkId: string): void {
        const networks = this.getNetworks();
        const filteredNetworks = networks.filter(n => n.id !== networkId);
        this.setItem(KEYS.NETWORKS, filteredNetworks);
    }

    /**
     * Get selected network ID
     */
    getSelectedNetwork(): string | null {
        return this.getItem<string>(KEYS.SELECTED_NETWORK);
    }

    /**
     * Set selected network ID
     */
    setSelectedNetwork(networkId: string): void {
        this.setItem(KEYS.SELECTED_NETWORK, networkId);
    }

    // ==================== Deployment History ====================

    /**
     * Get all deployment history entries
     */
    getDeploymentHistory(): DeploymentHistoryEntry[] {
        return this.getItem<DeploymentHistoryEntry[]>(KEYS.DEPLOYMENT_HISTORY) ?? [];
    }

    /**
     * Get a single deployment history entry by ID
     */
    getDeployment(deploymentId: string): DeploymentHistoryEntry | null {
        const history = this.getDeploymentHistory();
        return history.find(h => h.id === deploymentId) ?? null;
    }

    /**
     * Save a deployment history entry
     */
    saveDeployment(entry: DeploymentHistoryEntry): void {
        const history = this.getDeploymentHistory();
        const index = history.findIndex(h => h.id === entry.id);

        if (index >= 0) {
            history[index] = entry;
        } else {
            history.push(entry);
        }

        this.setItem(KEYS.DEPLOYMENT_HISTORY, history);
    }

    /**
     * Delete a single deployment history entry
     */
    deleteDeployment(deploymentId: string): void {
        const history = this.getDeploymentHistory();
        const filteredHistory = history.filter(h => h.id !== deploymentId);
        this.setItem(KEYS.DEPLOYMENT_HISTORY, filteredHistory);
    }

    /**
     * Clear all deployment history while preserving networks and projects
     */
    clearAllDeployments(): void {
        this.setItem(KEYS.DEPLOYMENT_HISTORY, []);
    }

    // ==================== Wallet State ====================

    /**
     * Get wallet state
     */
    getWalletState(): WalletState | null {
        return this.getItem<WalletState>(KEYS.WALLET_STATE);
    }

    /**
     * Save wallet state
     */
    saveWalletState(state: WalletState): void {
        this.setItem(KEYS.WALLET_STATE, state);
    }

    /**
     * Clear wallet state
     */
    clearWalletState(): void {
        this.deleteItem(KEYS.WALLET_STATE);
    }
}

// Export singleton instance
export const storageManager = new StorageManager();
