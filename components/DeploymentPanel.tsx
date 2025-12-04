'use client';

import { useState, useEffect, useRef } from 'react';
import { downloadABI, downloadBytecode } from '@/lib/downloadUtils';
import { useFocusTrap, announceToScreenReader } from '@/lib/accessibility';

interface DeploymentPanelProps {
    isOpen: boolean;
    contractAddress: string;
    transactionHash: string;
    networkName: string;
    explorerUrl: string;
    timestamp: number;
    abi: any[];
    bytecode: string;
    contractName: string;
    onClose: () => void;
}

export default function DeploymentPanel({
    isOpen,
    contractAddress,
    transactionHash,
    networkName,
    explorerUrl,
    timestamp,
    abi,
    bytecode,
    contractName,
    onClose,
}: DeploymentPanelProps) {
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [copiedTxHash, setCopiedTxHash] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useFocusTrap(isOpen, modalRef);

    useEffect(() => {
        if (isOpen) {
            announceToScreenReader(`Deployment successful! Contract deployed to ${networkName}`);
        }
    }, [isOpen, networkName]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(contractAddress);
            setCopiedAddress(true);
            announceToScreenReader('Contract address copied to clipboard');
            setTimeout(() => setCopiedAddress(false), 2000);
        } catch (error) {
            console.error('Failed to copy address:', error);
            announceToScreenReader('Failed to copy address');
        }
    };

    const handleCopyTxHash = async () => {
        try {
            await navigator.clipboard.writeText(transactionHash);
            setCopiedTxHash(true);
            announceToScreenReader('Transaction hash copied to clipboard');
            setTimeout(() => setCopiedTxHash(false), 2000);
        } catch (error) {
            console.error('Failed to copy transaction hash:', error);
            announceToScreenReader('Failed to copy transaction hash');
        }
    };

    const handleDownloadABI = () => {
        try {
            downloadABI(abi, contractName, networkName, timestamp);
            announceToScreenReader('ABI file downloaded');
        } catch (error) {
            console.error('Failed to download ABI:', error);
            announceToScreenReader('Failed to download ABI');
            alert('Failed to download ABI. Please try again.');
        }
    };

    const handleDownloadBytecode = () => {
        try {
            downloadBytecode(bytecode, contractName, networkName, timestamp);
            announceToScreenReader('Bytecode file downloaded');
        } catch (error) {
            console.error('Failed to download bytecode:', error);
            announceToScreenReader('Failed to download bytecode');
            alert('Failed to download bytecode. Please try again.');
        }
    };

    const formattedDate = new Date(timestamp).toLocaleString();
    const explorerLink = `${explorerUrl}/tx/${transactionHash}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" role="dialog" aria-modal="true" aria-labelledby="deployment-success-title">
            <div ref={modalRef} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 id="deployment-success-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Deployment Successful!
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {contractName} deployed to {networkName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Close deployment panel"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Contract Address
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                                {contractAddress}
                            </div>
                            <button
                                onClick={handleCopyAddress}
                                className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label={copiedAddress ? 'Contract address copied' : 'Copy contract address'}
                            >
                                {copiedAddress ? (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Transaction Hash
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                                {transactionHash}
                            </div>
                            <button
                                onClick={handleCopyTxHash}
                                className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label={copiedTxHash ? 'Transaction hash copied' : 'Copy transaction hash'}
                            >
                                {copiedTxHash ? (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {explorerUrl && (
                            <a
                                href={explorerLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                View on Block Explorer
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
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                            </a>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Deployment Time
                        </label>
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                            {formattedDate}
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Download Contract Artifacts
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadABI}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Download ABI file"
                        >
                            <svg
                                className="w-5 h-5"
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
                            Download ABI
                        </button>
                        <button
                            onClick={handleDownloadBytecode}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Download bytecode file"
                        >
                            <svg
                                className="w-5 h-5"
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
                            Download Bytecode
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label="Close deployment panel"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
