import { ethers } from 'ethers';
import type { Network, WalletState } from './types';

// Extend Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

/**
 * WalletManager handles MetaMask integration for the application
 * Provides connect/disconnect, network switching, and provider/signer access
 */
class WalletManager {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.JsonRpcSigner | null = null;
    private accountChangeCallback: ((accounts: string[]) => void) | null = null;
    private chainChangeCallback: ((chainId: string) => void) | null = null;

    /**
     * Check if MetaMask is installed
     */
    isMetaMaskInstalled(): boolean {
        return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    }

    /**
     * Connect to MetaMask wallet
     * @returns WalletState with connected address and chainId
     * @throws Error if MetaMask is not installed or connection fails
     */
    async connect(): Promise<WalletState> {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found. Please unlock MetaMask.');
            }

            // Create provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Get network information
            const network = await this.provider.getNetwork();
            const chainId = Number(network.chainId);

            const walletState: WalletState = {
                address: accounts[0],
                chainId,
                isConnected: true,
            };

            // Set up event listeners
            this.setupEventListeners();

            return walletState;
        } catch (error) {
            this.provider = null;
            this.signer = null;
            throw error;
        }
    }

    /**
     * Disconnect wallet and clear state
     */
    disconnect(): void {
        this.provider = null;
        this.signer = null;
        this.removeEventListeners();
    }

    /**
     * Get the current provider
     * @returns ethers.BrowserProvider or null if not connected
     */
    getProvider(): ethers.BrowserProvider | null {
        return this.provider;
    }

    /**
     * Get the current signer
     * @returns ethers.JsonRpcSigner or null if not connected
     */
    getSigner(): ethers.JsonRpcSigner | null {
        return this.signer;
    }

    /**
     * Switch to a different network
     * @param chainId The chain ID to switch to
     * @throws Error if network switching fails
     */
    async switchNetwork(chainId: number): Promise<void> {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask is not installed');
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
        } catch (error: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (error.code === 4902) {
                throw new Error('Network not found in MetaMask. Please add it first.');
            }
            throw error;
        }
    }

    /**
     * Add a custom network to MetaMask
     * @param network Network configuration to add
     * @throws Error if adding network fails
     */
    async addNetwork(network: Network): Promise<void> {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask is not installed');
        }

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: `0x${network.chainId.toString(16)}`,
                        chainName: network.name,
                        nativeCurrency: {
                            name: network.currencySymbol,
                            symbol: network.currencySymbol,
                            decimals: 18,
                        },
                        rpcUrls: [network.rpcUrl],
                        blockExplorerUrls: network.explorerUrl ? [network.explorerUrl] : [],
                    },
                ],
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Set up event listeners for account and network changes
     */
    private setupEventListeners(): void {
        if (!this.isMetaMaskInstalled()) return;

        // Remove existing listeners first
        this.removeEventListeners();

        // Account change handler
        this.accountChangeCallback = (accounts: string[]) => {
            if (accounts.length === 0) {
                // User disconnected all accounts
                this.disconnect();
            }
        };

        // Chain change handler
        this.chainChangeCallback = (chainId: string) => {
            // Reload provider and signer when chain changes
            if (this.provider) {
                this.provider.getNetwork().then(async (network) => {
                    this.signer = await this.provider!.getSigner();
                });
            }
        };

        window.ethereum.on('accountsChanged', this.accountChangeCallback);
        window.ethereum.on('chainChanged', this.chainChangeCallback);
    }

    /**
     * Remove event listeners
     */
    private removeEventListeners(): void {
        if (!this.isMetaMaskInstalled()) return;

        if (this.accountChangeCallback) {
            window.ethereum.removeListener('accountsChanged', this.accountChangeCallback);
            this.accountChangeCallback = null;
        }

        if (this.chainChangeCallback) {
            window.ethereum.removeListener('chainChanged', this.chainChangeCallback);
            this.chainChangeCallback = null;
        }
    }

    /**
     * Get current wallet state
     * @returns Current WalletState or null if not connected
     */
    async getCurrentState(): Promise<WalletState | null> {
        if (!this.provider || !this.signer) {
            return null;
        }

        try {
            const address = await this.signer.getAddress();
            const network = await this.provider.getNetwork();
            const chainId = Number(network.chainId);

            return {
                address,
                chainId,
                isConnected: true,
            };
        } catch (error) {
            return null;
        }
    }
}

// Export singleton instance
export const walletManager = new WalletManager();
