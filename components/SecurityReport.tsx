'use client';

import { useEffect, memo } from 'react';
import { announceToScreenReader } from '@/lib/accessibility';
import { SecurityAnalysis } from '@/lib/types';

interface SecurityReportProps {
    analysis: SecurityAnalysis;
    onFixIssues: () => void;
    onContinue: () => void;
}

function SecurityReport({ analysis, onFixIssues, onContinue }: SecurityReportProps) {

    useEffect(() => {
        const vulnCount = analysis.vulnerabilities.length;
        const highCount = analysis.vulnerabilities.filter(v => v.severity === 'high').length;

        if (vulnCount === 0) {
            announceToScreenReader('Security analysis complete. No vulnerabilities detected.');
        } else {
            announceToScreenReader(`Security analysis complete. Found ${vulnCount} vulnerabilities, including ${highCount} high severity issues.`);
        }
    }, [analysis]);

    const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
        switch (severity) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
            case 'low':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
        }
    };

    const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
        switch (severity) {
            case 'high':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'medium':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'low':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm" role="region" aria-labelledby="security-report-title">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h2 id="security-report-title" className="text-lg font-bold text-gray-900 dark:text-white">
                            Security Analysis Report
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            AI-powered contract security review
                        </p>
                    </div>
                </div>
            </div>


            <div className="px-6 py-4 space-y-6 max-h-[600px] overflow-y-auto">

                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Summary
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {analysis.summary}
                    </p>
                </div>


                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Vulnerabilities Found
                    </h3>
                    {analysis.vulnerabilities.length === 0 ? (
                        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-green-700 dark:text-green-400">
                                No vulnerabilities detected
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {analysis.vulnerabilities.map((vulnerability, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                                            {vulnerability.title}
                                        </h4>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${getSeverityColor(vulnerability.severity)}`}
                                        >
                                            {getSeverityIcon(vulnerability.severity)}
                                            {vulnerability.severity.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {vulnerability.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Recommendations
                    </h3>
                    {analysis.recommendations.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No specific recommendations at this time.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {analysis.recommendations.map((recommendation, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    <svg
                                        className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="flex-1">{recommendation}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>


            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                    onClick={onFixIssues}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Fix issues in contract"
                >
                    Fix Issues
                </button>
                <button
                    onClick={onContinue}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Continue to next step"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

export default memo(SecurityReport);
