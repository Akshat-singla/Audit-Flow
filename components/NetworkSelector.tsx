'use client';

import { useStore } from '@/lib/store';
import { useState, useEffect, useRef, memo } from 'react';
import { announceToScreenReader } from '@/lib/accessibility';
import AddNetworkModal from './AddNetworkModal';

function NetworkSelector() {
    const { networks, selectedNetworkId, selectNetwork } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedNetwork = networks.find(n => n.id === selectedNetworkId);

    const handleSelectNetwork = (networkId: string) => {
        const network = networks.find(n => n.id === networkId);
        selectNetwork(networkId);
        setIsOpen(false);
        if (network) {
            announceToScreenReader(`Network changed to ${network.name}`);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Select network. Current: ${selectedNetwork ? selectedNetwork.name : 'None'}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <span className="text-sm font-medium">
                    {selectedNetwork ? selectedNetwork.name : 'Select Network'}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20" role="menu" aria-label="Network selection menu">
                        <div className="py-1">
                            {networks.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    No networks available
                                </div>
                            ) : (
                                networks.map((network) => (
                                    <button
                                        key={network.id}
                                        onClick={() => handleSelectNetwork(network.id)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${selectedNetworkId === network.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                        role="menuitem"
                                        aria-current={selectedNetworkId === network.id ? 'true' : undefined}
                                    >
                                        <div className="font-medium">{network.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Chain ID: {network.chainId}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                                role="menuitem"
                                aria-label="Add custom network"
                            >
                                + Add Custom Network
                            </button>
                        </div>
                    </div>
                </>
            )}

            <AddNetworkModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}

export default memo(NetworkSelector);
