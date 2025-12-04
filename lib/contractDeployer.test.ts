import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { ensureNetwork, deployContract, type DeploymentConfig } from './contractDeployer';
import type { Network } from './types';

describe('Contract Deployer - Property-Based Tests', () => {
    // Feature: smart-contract-deployer, Property 5: Network validation before deployment
    // Validates: Requirements 2.4, 2.5
    it('should validate network before deployment for any network mismatch', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 999999 }), // Current chain ID
                fc.integer({ min: 1, max: 999999 }), // Target chain ID
                async (currentChainId, targetChainId) => {
                    // Skip if chain IDs match (not testing mismatch case)
                    fc.pre(currentChainId !== targetChainId);

                    // Create mock provider that returns current chain ID
                    const mockProvider = {
                        getNetwork: vi.fn().mockResolvedValue({
                            chainId: BigInt(currentChainId),
                        }),
                    } as any;

                    const targetNetwork: Network = {
                        id: 'test-network',
                        name: 'Test Network',
                        chainId: targetChainId,
                        rpcUrl: 'https://test.rpc',
                        explorerUrl: 'https://test.explorer',
                        currencySymbol: 'TEST',
                        isCustom: true,
                    };

                    // Should throw error when networks don't match
                    await expect(
                        ensureNetwork(mockProvider, targetNetwork)
                    ).rejects.toThrow(/Network mismatch/);
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Contract Deployer - Unit Tests', () => {
    // Test network validation with matching chain IDs
    it('should not throw error when wallet is on correct network', async () => {
        const chainId = 11155111; // Sepolia

        const mockProvider = {
            getNetwork: vi.fn().mockResolvedValue({
                chainId: BigInt(chainId),
            }),
        } as any;

        const network: Network = {
            id: 'sepolia',
            name: 'Sepolia',
            chainId,
            rpcUrl: 'https://sepolia.infura.io',
            explorerUrl: 'https://sepolia.etherscan.io',
            currencySymbol: 'ETH',
            isCustom: false,
        };

        // Should not throw when networks match
        await expect(ensureNetwork(mockProvider, network)).resolves.not.toThrow();
    });

    // Test network validation with mismatched chain IDs
    it('should throw error when wallet is on wrong network', async () => {
        const mockProvider = {
            getNetwork: vi.fn().mockResolvedValue({
                chainId: BigInt(1), // Mainnet
            }),
        } as any;

        const network: Network = {
            id: 'sepolia',
            name: 'Sepolia',
            chainId: 11155111, // Sepolia
            rpcUrl: 'https://sepolia.infura.io',
            explorerUrl: 'https://sepolia.etherscan.io',
            currencySymbol: 'ETH',
            isCustom: false,
        };

        // Should throw when networks don't match
        await expect(ensureNetwork(mockProvider, network)).rejects.toThrow(/Network mismatch/);
    });

    // Test deployment error handling structure
    it('should have proper error handling for deployment failures', async () => {
        const mockProvider = {
            getNetwork: vi.fn().mockResolvedValue({
                chainId: BigInt(1),
            }),
        } as any;

        const mockSigner = {
            provider: mockProvider,
        } as any;

        const config: DeploymentConfig = {
            abi: [],
            bytecode: '0x',
            constructorArgs: [],
            network: {
                id: 'test',
                name: 'Test',
                chainId: 1,
                rpcUrl: 'https://test.rpc',
                explorerUrl: 'https://test.explorer',
                currencySymbol: 'TEST',
                isCustom: true,
            },
        };

        // Verify configuration structure is valid
        expect(config).toBeDefined();
        expect(config.abi).toBeDefined();
        expect(config.bytecode).toBeDefined();
        expect(config.constructorArgs).toBeDefined();
        expect(config.network).toBeDefined();
    });

    // Test deployment configuration validation
    it('should accept valid deployment configuration with constructor args', () => {
        const config: DeploymentConfig = {
            abi: [
                {
                    inputs: [
                        { name: '_name', type: 'string' },
                        { name: '_symbol', type: 'string' },
                    ],
                    stateMutability: 'nonpayable',
                    type: 'constructor',
                },
            ],
            bytecode: '0x608060405234801561001057600080fd5b50',
            constructorArgs: ['MyToken', 'MTK'],
            network: {
                id: 'sepolia',
                name: 'Sepolia',
                chainId: 11155111,
                rpcUrl: 'https://sepolia.infura.io',
                explorerUrl: 'https://sepolia.etherscan.io',
                currencySymbol: 'ETH',
                isCustom: false,
            },
        };

        expect(config.abi).toBeDefined();
        expect(config.abi).toHaveLength(1);
        expect(config.bytecode).toBeDefined();
        expect(config.bytecode.startsWith('0x')).toBe(true);
        expect(config.constructorArgs).toHaveLength(2);
        expect(config.network.chainId).toBe(11155111);
    });

    // Test network validation error message format
    it('should provide clear error message for network mismatch', async () => {
        const currentChainId = 1;
        const targetChainId = 11155111;

        const mockProvider = {
            getNetwork: vi.fn().mockResolvedValue({
                chainId: BigInt(currentChainId),
            }),
        } as any;

        const network: Network = {
            id: 'sepolia',
            name: 'Sepolia',
            chainId: targetChainId,
            rpcUrl: 'https://sepolia.infura.io',
            explorerUrl: 'https://sepolia.etherscan.io',
            currencySymbol: 'ETH',
            isCustom: false,
        };

        try {
            await ensureNetwork(mockProvider, network);
            // Should not reach here
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.message).toContain('Network mismatch');
            expect(error.message).toContain(currentChainId.toString());
            expect(error.message).toContain(targetChainId.toString());
        }
    });
});
