'use client';

import { useStore } from '@/lib/store';
import { walletManager } from '@/lib/walletManager';
import { announceToScreenReader } from '@/lib/accessibility';
import { useState, memo } from 'react';

function WalletConnect() {
    const { wallet, setWalletState, disconnectWallet } = useStore();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const walletState = await walletManager.connect();
            setWalletState(walletState);
            announceToScreenReader(`Wallet connected: ${walletState.address}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(errorMessage);
            announceToScreenReader(`Wallet connection failed: ${errorMessage}`);
            console.error('Wallet connection error:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        walletManager.disconnect();
        disconnectWallet();
        setError(null);
        announceToScreenReader('Wallet disconnected');
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (wallet.isConnected && wallet.address) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg" role="status" aria-label={`Wallet connected: ${wallet.address}`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {formatAddress(wallet.address)}
                    </span>
                </div>
                <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Disconnect wallet"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={isConnecting ? 'Connecting wallet' : 'Connect wallet'}
            >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && (
                <p className="text-xs text-red-600 dark:text-red-400 max-w-xs text-right" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

export default memo(WalletConnect);
