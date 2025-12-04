import {
    Project,
    Network,
    DeploymentHistoryEntry,
    ValidationResult,
    ValidationError,
} from './types';

/**
 * Validates a network configuration
 */
export function validateNetwork(network: Partial<Network>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!network.name || network.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Network name is required' });
    }

    if (network.chainId === undefined || network.chainId === null) {
        errors.push({ field: 'chainId', message: 'Chain ID is required' });
    } else if (!Number.isInteger(network.chainId) || network.chainId < 0) {
        errors.push({ field: 'chainId', message: 'Chain ID must be a non-negative integer' });
    }

    if (!network.rpcUrl || network.rpcUrl.trim().length === 0) {
        errors.push({ field: 'rpcUrl', message: 'RPC URL is required' });
    } else if (!isValidUrl(network.rpcUrl)) {
        errors.push({ field: 'rpcUrl', message: 'RPC URL must be a valid URL' });
    }

    if (!network.explorerUrl || network.explorerUrl.trim().length === 0) {
        errors.push({ field: 'explorerUrl', message: 'Explorer URL is required' });
    } else if (!isValidUrl(network.explorerUrl)) {
        errors.push({ field: 'explorerUrl', message: 'Explorer URL must be a valid URL' });
    }

    if (!network.currencySymbol || network.currencySymbol.trim().length === 0) {
        errors.push({ field: 'currencySymbol', message: 'Currency symbol is required' });
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true };
}

/**
 * Validates a project
 */
export function validateProject(project: Partial<Project>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!project.name || project.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Project name is required' });
    }

    if (project.description === undefined || project.description === null) {
        errors.push({ field: 'description', message: 'Project description is required' });
    }

    if (project.contractCode === undefined || project.contractCode === null) {
        errors.push({ field: 'contractCode', message: 'Contract code is required' });
    }

    if (project.createdAt !== undefined && (!Number.isInteger(project.createdAt) || project.createdAt < 0)) {
        errors.push({ field: 'createdAt', message: 'Created timestamp must be a non-negative integer' });
    }

    if (project.updatedAt !== undefined && (!Number.isInteger(project.updatedAt) || project.updatedAt < 0)) {
        errors.push({ field: 'updatedAt', message: 'Updated timestamp must be a non-negative integer' });
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true };
}

/**
 * Validates a deployment history entry
 */
export function validateDeploymentHistoryEntry(entry: Partial<DeploymentHistoryEntry>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!entry.projectId || entry.projectId.trim().length === 0) {
        errors.push({ field: 'projectId', message: 'Project ID is required' });
    }

    if (!entry.projectName || entry.projectName.trim().length === 0) {
        errors.push({ field: 'projectName', message: 'Project name is required' });
    }

    if (!entry.networkId || entry.networkId.trim().length === 0) {
        errors.push({ field: 'networkId', message: 'Network ID is required' });
    }

    if (!entry.networkName || entry.networkName.trim().length === 0) {
        errors.push({ field: 'networkName', message: 'Network name is required' });
    }

    if (!entry.contractAddress || entry.contractAddress.trim().length === 0) {
        errors.push({ field: 'contractAddress', message: 'Contract address is required' });
    } else if (!isValidEthereumAddress(entry.contractAddress)) {
        errors.push({ field: 'contractAddress', message: 'Contract address must be a valid Ethereum address' });
    }

    if (!entry.transactionHash || entry.transactionHash.trim().length === 0) {
        errors.push({ field: 'transactionHash', message: 'Transaction hash is required' });
    } else if (!isValidTransactionHash(entry.transactionHash)) {
        errors.push({ field: 'transactionHash', message: 'Transaction hash must be a valid hex string' });
    }

    if (!entry.abi || !Array.isArray(entry.abi)) {
        errors.push({ field: 'abi', message: 'ABI must be an array' });
    }

    if (!entry.bytecode || entry.bytecode.trim().length === 0) {
        errors.push({ field: 'bytecode', message: 'Bytecode is required' });
    } else if (!isValidBytecode(entry.bytecode)) {
        errors.push({ field: 'bytecode', message: 'Bytecode must be a valid hex string' });
    }

    if (entry.timestamp === undefined || entry.timestamp === null) {
        errors.push({ field: 'timestamp', message: 'Timestamp is required' });
    } else if (!Number.isInteger(entry.timestamp) || entry.timestamp < 0) {
        errors.push({ field: 'timestamp', message: 'Timestamp must be a non-negative integer' });
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true };
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Helper function to validate Ethereum addresses
 */
function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Helper function to validate transaction hashes
 */
function isValidTransactionHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Helper function to validate bytecode
 */
function isValidBytecode(bytecode: string): boolean {
    return /^0x[a-fA-F0-9]*$/.test(bytecode) && bytecode.length > 2;
}
