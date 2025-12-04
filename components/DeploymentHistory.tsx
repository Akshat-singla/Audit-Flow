'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { downloadABI, downloadBytecode } from '@/lib/downloadUtils';
import { announceToScreenReader } from '@/lib/accessibility';
import { toastManager } from '@/lib/toast';

export default function DeploymentHistory() {
    const { deploymentHistory, networks, deleteDeployment, clearAllDeployments } = useStore();
    const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

    const sortedDeployments = useMemo(() => {
        const filtered = selectedNetworkFilter
            ? deploymentHistory.filter(entry => entry.networkId === selectedNetworkFilter)
            : deploymentHistory;

        return [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    }, [deploymentHistory, selectedNetworkFilter]);

    const [visibleCount, setVisibleCount] = useState(50);
    const visibleDeployments = useMemo(() => {
        return sortedDeployments.slice(0, visibleCount);
    }, [sortedDeployments, visibleCount]);

    const hasMoreItems = sortedDeployments.length > visibleCount;

    const loadMoreItems = useCallback(() => {
        setVisibleCount(prev => Math.min(prev + 50, sortedDeployments.length));
    }, [sortedDeployments.length]);

    const handleFilterChange = useCallback((networkId: string) => {
        setSelectedNetworkFilter(networkId === 'all' ? null : networkId);
        const network = networks.find(n => n.id === networkId);
        if (networkId === 'all') {
            announceToScreenReader('Showing all deployments');
        } else if (network) {
            announceToScreenReader(`Filtered to ${network.name} deployments`);
        }
    }, [networks]);

    const handleViewDetails = useCallback((entryId: string) => {
        setSelectedEntry(selectedEntry === entryId ? null : entryId);
    }, [selectedEntry]);

    const handleDeleteEntry = useCallback((entryId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (confirm('Are you sure you want to delete this deployment entry?')) {
            try {
                deleteDeployment(entryId);
                if (selectedEntry === entryId) {
                    setSelectedEntry(null);
                }
                announceToScreenReader('Deployment entry deleted');
                toastManager.success('Deployment entry deleted');
            } catch (error) {
                console.error('Failed to delete deployment:', error);
                announceToScreenReader('Failed to delete deployment entry');
                toastManager.error('Failed to delete deployment entry');
            }
        }
    }, [deleteDeployment, selectedEntry]);

    const handleClearAll = useCallback(() => {
        if (confirm('Are you sure you want to clear all deployment history? This action cannot be undone.')) {
            try {
                clearAllDeployments();
                setSelectedEntry(null);
                announceToScreenReader('All deployment history cleared');
                toastManager.success('All deployment history cleared');
            } catch (error) {
                console.error('Failed to clear deployment history:', error);
                announceToScreenReader('Failed to clear deployment history');
                toastManager.error('Failed to clear deployment history');
            }
        }
    }, [clearAllDeployments]);

    const handleDownloadABI = useCallback((entry: typeof deploymentHistory[0]) => {
        downloadABI(entry.abi, entry.projectName, entry.networkName, entry.timestamp);
        announceToScreenReader('ABI file downloaded');
    }, []);

    const handleDownloadBytecode = useCallback((entry: typeof deploymentHistory[0]) => {
        downloadBytecode(entry.bytecode, entry.projectName, entry.networkName, entry.timestamp);
        announceToScreenReader('Bytecode file downloaded');
    }, []);

    const handleCopyAddress = useCallback(async (address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            announceToScreenReader('Contract address copied to clipboard');
        } catch (error) {
            console.error('Failed to copy address:', error);
            announceToScreenReader('Failed to copy address');
        }
    }, []);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700" role="region" aria-labelledby="deployment-history-title">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="deployment-history-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Deployment History
                    </h2>
                    {deploymentHistory.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            aria-label="Clear all deployment history"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="network-filter"
                        className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Filter by Network
                    </label>
                    <select
                        id="network-filter"
                        value={selectedNetworkFilter || 'all'}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        aria-label="Filter deployments by network"
                    >
                        <option value="all">All Networks</option>
                        {networks.map((network) => (
                            <option key={network.id} value={network.id}>
                                {network.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {visibleDeployments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <p>No deployment history</p>
                        {selectedNetworkFilter && (
                            <p className="text-sm mt-2">Try selecting a different network filter</p>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {visibleDeployments.map((entry) => {
                            const isExpanded = selectedEntry === entry.id;

                            return (
                                <div key={entry.id} className="border-b border-gray-200 dark:border-gray-700">
                                    <div
                                        onClick={() => handleViewDetails(entry.id)}
                                        className="p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleViewDetails(entry.id);
                                            }
                                        }}
                                        aria-expanded={isExpanded}
                                        aria-label={`View details for ${entry.projectName} deployment`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {entry.projectName}
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                    {entry.networkName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleDeleteEntry(entry.id, e)}
                                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    aria-label={`Delete ${entry.projectName} deployment`}
                                                    title="Delete entry"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                                <svg
                                                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                                                        }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                            <div className="mb-3">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Contract Address
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-900 dark:text-gray-100 break-all">
                                                        {entry.contractAddress}
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopyAddress(entry.contractAddress)}
                                                        className="flex-shrink-0 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                        title="Copy address"
                                                        aria-label="Copy contract address"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Transaction Hash
                                                </label>
                                                <div className="px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-900 dark:text-gray-100 break-all">
                                                    {entry.transactionHash}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Download Artifacts
                                                </label>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDownloadABI(entry)}
                                                        className="flex-1 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                                                        aria-label="Download ABI"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            aria-hidden="true"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            />
                                                        </svg>
                                                        ABI
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadBytecode(entry)}
                                                        className="flex-1 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                                                        aria-label="Download Bytecode"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            aria-hidden="true"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            />
                                                        </svg>
                                                        Bytecode
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasMoreItems && (
                    <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={loadMoreItems}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            aria-label="Load more deployment entries"
                        >
                            Load More ({sortedDeployments.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
