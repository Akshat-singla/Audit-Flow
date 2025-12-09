'use client';

import { useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { useStore } from '@/lib/store';
import ToastContainer from '@/components/ToastContainer';

export default function ProfilePage() {
    const { deploymentHistory, wallet } = useStore();

    // Filter deployments with audit reports
    const auditsWithReports = useMemo(() => {
        return deploymentHistory.filter(d => d.auditReport);
    }, [deploymentHistory]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalAudits = auditsWithReports.length;

        let totalScore = 0;
        auditsWithReports.forEach(audit => {
            if (audit.auditReport) {
                const vulns = audit.auditReport.vulnerabilities;
                const highCount = vulns.filter(v => v.severity === 'high').length;
                const mediumCount = vulns.filter(v => v.severity === 'medium').length;
                const lowCount = vulns.filter(v => v.severity === 'low').length;


                let score = 5.0;
                score -= highCount * 1.0;
                score -= mediumCount * 0.5;
                score -= lowCount * 0.2;
                score = Math.max(0, score);

                totalScore += score;
            }
        });

        const averageRating = totalAudits > 0 ? (totalScore / totalAudits).toFixed(1) : '0.0';

        // Chain distribution
        const chainDistribution: Record<string, number> = {};
        auditsWithReports.forEach(audit => {
            chainDistribution[audit.networkName] = (chainDistribution[audit.networkName] || 0) + 1;
        });

        return {
            totalAudits,
            averageRating,
            chainDistribution,
        };
    }, [auditsWithReports]);

    // Get recent audits (last 5)
    const recentAudits = useMemo(() => {
        return [...auditsWithReports]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
    }, [auditsWithReports]);

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'low':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getAuditStatusColor = (vulnerabilities: any[]) => {
        const hasHigh = vulnerabilities.some(v => v.severity === 'high');
        const hasMedium = vulnerabilities.some(v => v.severity === 'medium');

        if (hasHigh) return 'text-red-400';
        if (hasMedium) return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-950">
            <ToastContainer />
            <Navigation />

            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-sm text-blue-400 font-medium">Auditor Dashboard</h1>
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Auditor Profile</h2>
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-mono text-sm">
                                {wallet.address || '0x0000000000000000000000000000000000000000'}
                            </span>
                            {wallet.address && (
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(wallet.address!);
                                    }}
                                    className="ml-2 text-blue-400 hover:text-blue-300"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Overall Statistics */}
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-white">Overall Statistics</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                        <div className="text-4xl font-bold text-white mb-1">
                                            {stats.totalAudits}
                                        </div>
                                        <div className="text-sm text-blue-400">Total Audits</div>
                                    </div>

                                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-4xl font-bold text-white">
                                                {stats.averageRating}
                                            </span>
                                            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm text-blue-400">Average Rating</div>
                                    </div>
                                </div>
                            </div>

                            {/* Chain Distribution */}
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-white">Chain Distribution</h3>
                                </div>

                                {Object.keys(stats.chainDistribution).length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p className="text-sm">No chain data available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(stats.chainDistribution).map(([chain, count]) => (
                                            <div key={chain} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <span className="text-gray-300">{chain}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-gray-800 rounded-full w-32">
                                                        <div
                                                            className="h-2 bg-blue-500 rounded-full"
                                                            style={{
                                                                width: `${(count / stats.totalAudits) * 100}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-gray-400 text-sm w-8 text-right">{count}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Recent Audits */}
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <h3 className="text-lg font-semibold text-white">Recent Audits</h3>
                            </div>

                            {recentAudits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                                    <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-lg font-medium mb-2">No audits found</p>
                                    <p className="text-sm text-gray-600">Start auditing contracts to see them here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentAudits.map((audit) => (
                                        <div
                                            key={audit.id}
                                            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h4 className="text-white font-medium mb-1">
                                                        {audit.projectName}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 font-mono truncate">
                                                        {audit.contractAddress}
                                                    </p>
                                                </div>
                                                {audit.auditReport && (
                                                    <div className={`text-2xl font-bold ${getAuditStatusColor(audit.auditReport.vulnerabilities)}`}>
                                                        {audit.auditReport.vulnerabilities.length === 0 ? '✓' : '!'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs text-gray-500">{audit.networkName}</span>
                                                <span className="text-gray-700">•</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(audit.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {audit.auditReport && audit.auditReport.vulnerabilities.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {audit.auditReport.vulnerabilities.map((vuln, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityBadge(vuln.severity)}`}
                                                        >
                                                            {vuln.severity.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {audit.auditReport && audit.auditReport.vulnerabilities.length === 0 && (
                                                <div className="text-xs text-green-400">
                                                    No vulnerabilities found
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
