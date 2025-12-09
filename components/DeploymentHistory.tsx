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
        <div className="h-full flex flex-col bg-transparent" role="region" aria-labelledby="deployment-history-title">
            <div className="px-6 py-5 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <label
                            htmlFor="network-filter"
                            className="block text-xs font-medium text-gray-400 mb-2"
                        >
                            Filter by Network
                        </label>
                        <select
                            id="network-filter"
                            value={selectedNetworkFilter || 'all'}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="w-full max-w-xs px-4 py-2.5 text-sm bg-gray-800/80 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
                            aria-label="Filter deployments by network"
                        >
                            <option value="all">All Networks ({deploymentHistory.length})</option>
                            {networks.map((network) => {
                                const count = deploymentHistory.filter(d => d.networkId === network.id).length;
                                return (
                                    <option key={network.id} value={network.id}>
                                        {network.name} ({count})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    {deploymentHistory.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm font-medium rounded-xl transition-all border border-red-500/20 hover:border-red-500/30"
                            aria-label="Clear all deployment history"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {visibleDeployments.length === 0 ? (
                    <div className="flex items-center justify-center h-full p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-400 mb-2">No deployment history</p>
                            {selectedNetworkFilter && (
                                <p className="text-sm text-gray-500">Try selecting a different network filter</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {visibleDeployments.map((entry) => {
                            const isExpanded = selectedEntry === entry.id;

                            return (
                                <div key={entry.id} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 rounded-xl overflow-hidden backdrop-blur-sm hover:border-gray-600/50 transition-all duration-200">
                                    <div
                                        onClick={() => handleViewDetails(entry.id)}
                                        className="p-5 cursor-pointer"
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
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-white truncate">
                                                            {entry.projectName}
                                                        </h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded border border-blue-500/20">
                                                                {entry.networkName}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(entry.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="truncate">{entry.contractAddress}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleDeleteEntry(entry.id, e)}
                                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    aria-label={`Delete ${entry.projectName} deployment`}
                                                    title="Delete entry"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
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
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''
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
