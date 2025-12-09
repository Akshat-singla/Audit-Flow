'use client';

import { useState, useCallback, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { useStore } from '@/lib/store';
import { toastManager } from '@/lib/toast';
import ToastContainer from '@/components/ToastContainer';
import type { DeploymentHistoryEntry } from '@/lib/types';

export default function AuditPage() {
    const { deploymentHistory } = useStore();
    const [selectedDeployment, setSelectedDeployment] = useState<DeploymentHistoryEntry | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    // Filter deployments that have audit reports
    const deploymentsWithAudits = deploymentHistory.filter(d => d.auditReport);

    const handleDownloadPDF = useCallback(async () => {
        if (!selectedDeployment?.auditReport || !reportRef.current) {
            toastManager.warning('No audit report to download');
            return;
        }

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = reportRef.current;
            const opt = {
                margin: 1,
                filename: `audit-report-${selectedDeployment.projectName}-${Date.now()}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
            };

            await html2pdf().set(opt).from(element).save();
            toastManager.success('PDF downloaded successfully');
        } catch (error) {
            console.error('PDF generation error:', error);
            toastManager.error('Failed to generate PDF');
        }
    }, [selectedDeployment]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'medium':
                return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            case 'low':
                return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            default:
                return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
        }
    };

    const getSeverityBadgeColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
            case 'medium':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
            case 'low':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
            default:
                return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
            <ToastContainer />
            <Navigation />

            <main className="flex-1 flex overflow-hidden">
                <aside className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Audited Contracts
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {deploymentsWithAudits.length} contract{deploymentsWithAudits.length !== 1 ? 's' : ''} with audit reports
                        </p>
                    </div>

                    {deploymentsWithAudits.length === 0 ? (
                        <div className="p-6 text-center">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <p className="text-sm text-gray-600 dark:text-gray-400">No audit reports yet</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Deploy a contract with AI Analysis enabled to generate audit reports
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                            {deploymentsWithAudits.map((deployment) => (
                                <button
                                    key={deployment.id}
                                    onClick={() => setSelectedDeployment(deployment)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedDeployment?.id === deployment.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : ''}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-gray-900 dark:text-white">{deployment.projectName}</h3>
                                        {deployment.auditReport && (
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${deployment.auditReport.vulnerabilities.some(v => v.severity === 'high') ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : deployment.auditReport.vulnerabilities.some(v => v.severity === 'medium') ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
                                                {deployment.auditReport.vulnerabilities.length} issue{deployment.auditReport.vulnerabilities.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{deployment.networkName}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{deployment.contractAddress}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{new Date(deployment.timestamp).toLocaleDateString()}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Audit Report</h2>
                            {selectedDeployment?.auditReport && (
                                <button onClick={handleDownloadPDF} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download PDF
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {!selectedDeployment && (
                            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-lg font-medium">No Contract Selected</p>
                                    <p className="text-sm mt-2">Select a contract from the list to view its audit report</p>
                                </div>
                            </div>
                        )}

                        {selectedDeployment && !selectedDeployment.auditReport && (
                            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-lg font-medium">No Audit Report Available</p>
                                    <p className="text-sm mt-2">This contract was deployed without AI analysis</p>
                                </div>
                            </div>
                        )}

                        {selectedDeployment?.auditReport && (
                            <div ref={reportRef} className="space-y-6">
                                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Smart Contract Security Audit</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span>Contract: {selectedDeployment.projectName}</span>
                                        <span>•</span>
                                        <span>Network: {selectedDeployment.networkName}</span>
                                        <span>•</span>
                                        <span>{new Date(selectedDeployment.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-2">{selectedDeployment.contractAddress}</p>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Summary</h4>
                                    <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{selectedDeployment.auditReport.summary}</p>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Vulnerabilities Found ({selectedDeployment.auditReport.vulnerabilities.length})
                                    </h4>
                                    {selectedDeployment.auditReport.vulnerabilities.length === 0 ? (
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                            <p className="text-green-800 dark:text-green-200">No vulnerabilities detected. Great job!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedDeployment.auditReport.vulnerabilities.map((vuln, index) => (
                                                <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(vuln.severity)}`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h5 className="font-semibold text-lg">{vuln.title}</h5>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getSeverityBadgeColor(vuln.severity)}`}>
                                                            {vuln.severity}
                                                        </span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap">{vuln.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <ul className="space-y-2">
                                            {selectedDeployment.auditReport.recommendations.map((rec, index) => (
                                                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <span>{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-500 dark:text-gray-400">
                                    <p>This audit report was generated using AI-powered analysis. While comprehensive, it should not replace professional security audits for production contracts.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
