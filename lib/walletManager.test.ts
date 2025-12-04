import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { walletManager } from './walletManager';
import type { Network } from './types';

// Mock ethers module
vi.mock('ethers', async () => {
    const actual = await vi.importActual('ethers');
    return {
        ...actual,
        BrowserProvider: vi.fn(),
    };
});

// Mock window.ethereum
const createMockEthereum = () => {
    const listeners: Record<string, Function[]> = {};

    return {
        request: vi.fn(),
        on: vi.fn((event: string, callback: Function) => {
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(callback);
        }),
        removeListener: vi.fn((event: string, callback: Function) => {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(cb => cb !== callback);
            }
        }),
        _trigger: (event: string, ...args: any[]) => {
            if (listeners[event]) {
                listeners[event].forEach(cb => cb(...args));
            }
        },
        _listeners: listeners,
    };
};

describe('WalletManager Property Tests', () => {
    let mockEthereum: ReturnType<typeof createMockEthereum>;

    beforeEach(() => {
        // Reset wallet manager state
        walletManager.disconnect();

        // Create fresh mock
        mockEthereum = createMockEthereum();
        (global as any).window = {
            ethereum: mockEthereum,
        };
    });

    // Feature: smart-contract-deployer, Property 3: Wallet state consistency
    // For any successful MetaMask connection, the displayed wallet address should match the connected account address.
    // Validates: Requirements 2.2
    describe('Property 3: Wallet state consistency', () => {
        it('should return wallet state with address matching the connected account', async () => {
            const { BrowserProvider } = await import('ethers');

            await fc.assert(
                fc.asyncProperty(
                    fc.hexaString({ minLength: 40, maxLength: 40 }),
                    fc.integer({ min: 1, max: 999999 }),
                    async (addressHex, chainId) => {
                        const address = `0x${addressHex}`;

                        // Create a complete mock ethereum object
                        const mockEthereumForTest = {
                            ...mockEthereum,
                            request: vi.fn().mockImplementation(async ({ method }: any) => {
                                if (method === 'eth_requestAccounts') {
                                    return [address];
                                }
                                if (method === 'eth_chainId') {
                                    return `0x${chainId.toString(16)}`;
                                }
                                if (method === 'eth_accounts') {
                                    return [address];
                                }
                                return null;
                            }),
                        };

                        // Update global window.ethereum
                        (global as any).window.ethereum = mockEthereumForTest;

                        // Mock provider responses
                        const mockProvider = {
                            getNetwork: vi.fn().mockResolvedValue({ chainId: BigInt(chainId) }),
                            getSigner: vi.fn().mockResolvedValue({
                                getAddress: vi.fn().mockResolvedValue(address),
                            }),
                        };

                        // Mock BrowserProvider for this iteration
                        vi.mocked(BrowserProvider).mockImplementation(() => mockProvider as any);

                        try {
                            const walletState = await walletManager.connect();

                            // Property: The returned wallet state address should match the connected account
                            expect(walletState.address).toBe(address);
                            expect(walletState.chainId).toBe(chainId);
                            expect(walletState.isConnected).toBe(true);
                        } finally {
                            walletManager.disconnect();
                            vi.clearAllMocks();
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    // Feature: smart-contract-deployer, Property 4: Wallet disconnect clears state
    // For any wallet connection state, disconnecting should result in a null address and isConnected = false.
    // Validates: Requirements 2.3
    describe('Property 4: Wallet disconnect clears state', () => {
        it('should clear wallet state after disconnect', async () => {
            const { BrowserProvider } = await import('ethers');

            await fc.assert(
                fc.asyncProperty(
                    fc.hexaString({ minLength: 40, maxLength: 40 }),
                    fc.integer({ min: 1, max: 999999 }),
                    async (addressHex, chainId) => {
                        const address = `0x${addressHex}`;

                        // Create a complete mock ethereum object
                        const mockEthereumForTest = {
                            ...mockEthereum,
                            request: vi.fn().mockImplementation(async ({ method }: any) => {
                                if (method === 'eth_requestAccounts') {
                                    return [address];
                                }
                                if (method === 'eth_chainId') {
                                    return `0x${chainId.toString(16)}`;
                                }
                                if (method === 'eth_accounts') {
                                    return [address];
                                }
                                return null;
                            }),
                        };

                        // Update global window.ethereum
                        (global as any).window.ethereum = mockEthereumForTest;

                        // Mock provider responses
                        const mockProvider = {
                            getNetwork: vi.fn().mockResolvedValue({ chainId: BigInt(chainId) }),
                            getSigner: vi.fn().mockResolvedValue({
                                getAddress: vi.fn().mockResolvedValue(address),
                            }),
                        };

                        // Mock BrowserProvider for this iteration
                        vi.mocked(BrowserProvider).mockImplementation(() => mockProvider as any);

                        try {
                            // Connect first
                            await walletManager.connect();

                            // Disconnect
                            walletManager.disconnect();

                            // Property: After disconnect, provider and signer should be null
                            const provider = walletManager.getProvider();
                            const signer = walletManager.getSigner();

                            expect(provider).toBeNull();
                            expect(signer).toBeNull();
                        } finally {
                            walletManager.disconnect();
                            vi.clearAllMocks();
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

describe('WalletManager Unit Tests', () => {
    let mockEthereum: ReturnType<typeof createMockEthereum>;

    beforeEach(() => {
        walletManager.disconnect();
        mockEthereum = createMockEthereum();
        (global as any).window = {
            ethereum: mockEthereum,
        };
    });

    describe('MetaMask Installation Check', () => {
        it('should detect when MetaMask is installed', () => {
            expect(walletManager.isMetaMaskInstalled()).toBe(true);
        });

        it('should detect when MetaMask is not installed', () => {
            delete (global as any).window.ethereum;
            expect(walletManager.isMetaMaskInstalled()).toBe(false);
        });

        it('should throw error when connecting without MetaMask', async () => {
            delete (global as any).window.ethereum;
            await expect(walletManager.connect()).rejects.toThrow('MetaMask is not installed');
        });
    });

    describe('Network Switching', () => {
        it('should switch to a different network', async () => {
            const targetChainId = 11155111; // Sepolia

            mockEthereum.request.mockResolvedValue(null);

            await walletManager.switchNetwork(targetChainId);

            expect(mockEthereum.request).toHaveBeenCalledWith({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xaa36a7' }],
            });
        });

        it('should throw error when network is not found in MetaMask', async () => {
            const targetChainId = 12345;

            mockEthereum.request.mockRejectedValue({ code: 4902 });

            await expect(walletManager.switchNetwork(targetChainId)).rejects.toThrow(
                'Network not found in MetaMask'
            );
        });

        it('should throw error when MetaMask is not installed', async () => {
            delete (global as any).window.ethereum;

            await expect(walletManager.switchNetwork(1)).rejects.toThrow('MetaMask is not installed');
        });
    });

    describe('Adding Custom Network', () => {
        it('should add a custom network to MetaMask', async () => {
            const network: Network = {
                id: 'test-network',
                name: 'Test Network',
                chainId: 12345,
                rpcUrl: 'https://rpc.test.network',
                explorerUrl: 'https://explorer.test.network',
                currencySymbol: 'TEST',
                isCustom: true,
            };

            mockEthereum.request.mockResolvedValue(null);

            await walletManager.addNetwork(network);

            expect(mockEthereum.request).toHaveBeenCalledWith({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: '0x3039',
                        chainName: 'Test Network',
                        nativeCurrency: {
                            name: 'TEST',
                            symbol: 'TEST',
                            decimals: 18,
                        },
                        rpcUrls: ['https://rpc.test.network'],
                        blockExplorerUrls: ['https://explorer.test.network'],
                    },
                ],
            });
        });

        it('should throw error when MetaMask is not installed', async () => {
            delete (global as any).window.ethereum;

            const network: Network = {
                id: 'test',
                name: 'Test',
                chainId: 1,
                rpcUrl: 'https://test.com',
                explorerUrl: '',
                currencySymbol: 'TEST',
                isCustom: true,
            };

            await expect(walletManager.addNetwork(network)).rejects.toThrow('MetaMask is not installed');
        });
    });
});
