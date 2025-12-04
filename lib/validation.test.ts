import { describe, it, expect } from 'vitest';
import {
    validateNetwork,
    validateProject,
    validateDeploymentHistoryEntry,
} from './validation';
import { Network, Project, DeploymentHistoryEntry } from './types';

describe('validateNetwork', () => {
    it('should validate a valid network configuration', () => {
        const network: Omit<Network, 'id' | 'isCustom'> = {
            name: 'Sepolia',
            chainId: 11155111,
            rpcUrl: 'https://sepolia.infura.io/v3/test',
            explorerUrl: 'https://sepolia.etherscan.io',
            currencySymbol: 'ETH',
        };

        const result = validateNetwork(network);
        expect(result.valid).toBe(true);
    });

    it('should reject network with empty name', () => {
        const network = {
            name: '',
            chainId: 1,
            rpcUrl: 'https://eth.llamarpc.com',
            explorerUrl: 'https://etherscan.io',
            currencySymbol: 'ETH',
        };

        const result = validateNetwork(network);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'name',
                message: 'Network name is required',
            });
        }
    });

    it('should reject network with negative chainId', () => {
        const network = {
            name: 'Test Network',
            chainId: -1,
            rpcUrl: 'https://test.com',
            explorerUrl: 'https://explorer.test.com',
            currencySymbol: 'TEST',
        };

        const result = validateNetwork(network);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'chainId',
                message: 'Chain ID must be a non-negative integer',
            });
        }
    });

    it('should reject network with invalid RPC URL', () => {
        const network = {
            name: 'Test Network',
            chainId: 1,
            rpcUrl: 'not-a-url',
            explorerUrl: 'https://explorer.test.com',
            currencySymbol: 'TEST',
        };

        const result = validateNetwork(network);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'rpcUrl',
                message: 'RPC URL must be a valid URL',
            });
        }
    });

    it('should reject network with invalid explorer URL', () => {
        const network = {
            name: 'Test Network',
            chainId: 1,
            rpcUrl: 'https://test.com',
            explorerUrl: 'invalid-url',
            currencySymbol: 'TEST',
        };

        const result = validateNetwork(network);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'explorerUrl',
                message: 'Explorer URL must be a valid URL',
            });
        }
    });

    it('should reject network with missing currency symbol', () => {
        const network = {
            name: 'Test Network',
            chainId: 1,
            rpcUrl: 'https://test.com',
            explorerUrl: 'https://explorer.test.com',
            currencySymbol: '',
        };

        const result = validateNetwork(network);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'currencySymbol',
                message: 'Currency symbol is required',
            });
        }
    });
});

describe('validateProject', () => {
    it('should validate a valid project', () => {
        const project: Omit<Project, 'id'> = {
            name: 'My Contract',
            description: 'A test contract',
            contractCode: 'pragma solidity ^0.8.0; contract Test {}',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const result = validateProject(project);
        expect(result.valid).toBe(true);
    });

    it('should reject project with empty name', () => {
        const project = {
            name: '',
            description: 'A test contract',
            contractCode: 'pragma solidity ^0.8.0;',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const result = validateProject(project);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'name',
                message: 'Project name is required',
            });
        }
    });

    it('should reject project with missing description', () => {
        const project = {
            name: 'My Contract',
            contractCode: 'pragma solidity ^0.8.0;',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const result = validateProject(project);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'description',
                message: 'Project description is required',
            });
        }
    });

    it('should reject project with missing contract code', () => {
        const project = {
            name: 'My Contract',
            description: 'A test contract',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const result = validateProject(project);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'contractCode',
                message: 'Contract code is required',
            });
        }
    });

    it('should accept project with empty contract code', () => {
        const project = {
            name: 'My Contract',
            description: 'A test contract',
            contractCode: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const result = validateProject(project);
        expect(result.valid).toBe(true);
    });

    it('should reject project with negative timestamp', () => {
        const project = {
            name: 'My Contract',
            description: 'A test contract',
            contractCode: 'pragma solidity ^0.8.0;',
            createdAt: -1,
            updatedAt: Date.now(),
        };

        const result = validateProject(project);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'createdAt',
                message: 'Created timestamp must be a non-negative integer',
            });
        }
    });
});

describe('validateDeploymentHistoryEntry', () => {
    it('should validate a valid deployment history entry', () => {
        const entry: Omit<DeploymentHistoryEntry, 'id'> = {
            projectId: 'proj-123',
            projectName: 'My Contract',
            networkId: 'net-456',
            networkName: 'Sepolia',
            contractAddress: '0x1234567890123456789012345678901234567890',
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            abi: [{ type: 'constructor', inputs: [] }],
            bytecode: '0x608060405234801561001057600080fd5b50',
            timestamp: Date.now(),
        };

        const result = validateDeploymentHistoryEntry(entry);
        expect(result.valid).toBe(true);
    });

    it('should reject entry with empty project ID', () => {
        const entry = {
            projectId: '',
            projectName: 'My Contract',
            networkId: 'net-456',
            networkName: 'Sepolia',
            contractAddress: '0x1234567890123456789012345678901234567890',
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            abi: [],
            bytecode: '0x608060405234801561001057600080fd5b50',
            timestamp: Date.now(),
        };

        const result = validateDeploymentHistoryEntry(entry);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'projectId',
                message: 'Project ID is required',
            });
        }
    });

    it('should reject entry with invalid contract address', () => {
        const entry = {
            projectId: 'proj-123',
            projectName: 'My Contract',
            networkId: 'net-456',
            networkName: 'Sepolia',
            contractAddress: 'invalid-address',
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            abi: [],
            bytecode: '0x608060405234801561001057600080fd5b50',
            timestamp: Date.now(),
        };

        const result = validateDeploymentHistoryEntry(entry);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'contractAddress',
                message: 'Contract address must be a valid Ethereum address',
            });
        }
    });

    it('should reject entry with invalid transaction hash', () => {
        const entry = {
            projectId: 'proj-123',
            projectName: 'My Contract',
            networkId: 'net-456',
            networkName: 'Sepolia',
            contractAddress: '0x1234567890123456789012345678901234567890',
            transactionHash: 'invalid-hash',
            abi: [],
            bytecode: '0x608060405234801561001057600080fd5b50',
            timestamp: Date.now(),
        };

        const result = validateDeploymentHistoryEntry(entry);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'transactionHash',
                message: 'Transaction hash must be a valid hex string',
            });
        }
    });

    it('should reject entry with non-array ABI', () => {
        const entry = {
            projectId: 'proj-123',
            projectName: 'My Contract',
            networkId: 'net-456',
            networkName: 'Sepolia',
            contractAddress: '0x1234567890123456789012345678901234567890',
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            abi: 'not-an-array' as any,
            bytecode: '0x608060405234801561001057600080fd5b50',
            timestamp: Date.now(),
        };

        const result = validateDeploymentHistoryEntry(entry);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'abi',
                message: 'ABI must be an array',
            });
        }
    });

    it('should reject entry with invalid bytecode', () => {
        const entry = {
            projectId: 'proj-123',
            projectName: 'My Contract',
            networkId: 'net-456',
            networkName: 'Sepolia',
            contractAddress: '0x1234567890123456789012345678901234567890',
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            abi: [],
            bytecode: 'not-hex',
            timestamp: Date.now(),
        };

        const result = validateDeploymentHistoryEntry(entry);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'bytecode',
                message: 'Bytecode must be a valid hex string',
            });
        }
    });

    it('should reject entry with negative timestamp', () => {
        const entry = {
            projectId: 'proj-123',
            projectName: 'My Contract',
            networkId: 'net-456',
            networkName: 'Sepolia',
            contractAddress: '0x1234567890123456789012345678901234567890',
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            abi: [],
            bytecode: '0x608060405234801561001057600080fd5b50',
            timestamp: -1,
        };

        const result = validateDeploymentHistoryEntry(entry);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.errors).toContainEqual({
                field: 'timestamp',
                message: 'Timestamp must be a non-negative integer',
            });
        }
    });
});
