// Core data models for the application

export interface Project {
    id: string;
    name: string;
    description: string;
    contractCode: string;
    createdAt: number;
    updatedAt: number;
}

export interface Network {
    id: string;
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    currencySymbol: string;
    isCustom: boolean;
}

export interface DeploymentHistoryEntry {
    id: string;
    projectId: string;
    projectName: string;
    networkId: string;
    networkName: string;
    contractAddress: string;
    transactionHash: string;
    abi: any[];
    bytecode: string;
    timestamp: number;
}

export interface WalletState {
    address: string | null;
    chainId: number | null;
    isConnected: boolean;
}

export interface LocalStorageSchema {
    'sc-deployer:projects': Project[];
    'sc-deployer:networks': Network[];
    'sc-deployer:deployment-history': DeploymentHistoryEntry[];
    'sc-deployer:selected-network': string;
    'sc-deployer:wallet-state': WalletState;
    'sc-deployer:schema-version': number;
}

// Workflow types
export type WorkflowStepStatus = 'pending' | 'in-progress' | 'completed' | 'skipped' | 'failed';

export interface WorkflowStep {
    id: string;
    name: string;
    status: WorkflowStepStatus;
    errorMessage?: string;
}

export interface CompileResponse {
    success: boolean;
    abi?: any[];
    bytecode?: string;
    warnings?: string[];
    errors?: string[];
}

export interface ConstructorArgument {
    name: string;
    type: string;
    value: string;
}

export interface DeploymentResult {
    contractAddress: string;
    transactionHash: string;
    blockNumber: number;
}

export interface WorkflowState {
    projectId: string;
    steps: WorkflowStep[];
    currentStepIndex: number;
    aiAnalysisEnabled: boolean;
    analysisResult: SecurityAnalysis | null;
    compilationResult: CompileResponse | null;
    constructorArgs: ConstructorArgument[];
    deploymentResult: DeploymentResult | null;
}

// Validation error type
export interface ValidationError {
    field: string;
    message: string;
}

export type ValidationResult = {
    valid: true;
} | {
    valid: false;
    errors: ValidationError[];
}

// Security Analysis types
export interface SecurityVulnerability {
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
}

export interface SecurityAnalysis {
    summary: string;
    vulnerabilities: SecurityVulnerability[];
    recommendations: string[];
}
