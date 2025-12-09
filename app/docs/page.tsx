'use client';

import { useState, useCallback, useRef } from 'react';
import Navigation from '@/components/Navigation';
import MonacoEditor from '@/components/MonacoEditor';
import { toastManager } from '@/lib/toast';
import ToastContainer from '@/components/ToastContainer';

const DEFAULT_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//Write Your Smart Contract Here

`;

interface FunctionDoc {
    name: string;
    visibility: string;
    stateMutability?: string;
    description: string;
    parameters: { name: string; type: string; description: string }[];
    returns?: { type: string; description: string }[];
}

interface EventDoc {
    name: string;
    description: string;
    parameters: { name: string; type: string; indexed: boolean; description: string }[];
}

interface ContractDoc {
    name: string;
    description: string;
    version?: string;
    license?: string;
    functions: FunctionDoc[];
    events: EventDoc[];
}

export default function DocsPage() {
    const [contractCode, setContractCode] = useState(DEFAULT_CONTRACT);
    const [documentation, setDocumentation] = useState<ContractDoc | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const docRef = useRef<HTMLDivElement>(null);

    const parseContract = useCallback((code: string): ContractDoc | null => {
        try {
            // Extract contract name
            const contractMatch = code.match(/contract\s+(\w+)/);
            const contractName = contractMatch ? contractMatch[1] : 'Unknown';

            // Extract license
            const licenseMatch = code.match(/SPDX-License-Identifier:\s*(.+)/);
            const license = licenseMatch ? licenseMatch[1].trim() : undefined;

            // Extract version
            const versionMatch = code.match(/pragma\s+solidity\s+(.+);/);
            const version = versionMatch ? versionMatch[1].trim() : undefined;

            // Parse functions
            const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*(public|private|internal|external)?\s*(view|pure|payable)?\s*(?:returns\s*\(([^)]+)\))?/g;
            const functions: FunctionDoc[] = [];
            let match;

            while ((match = functionRegex.exec(code)) !== null) {
                const [, name, params, visibility = 'public', stateMutability, returns] = match;

                const parameters = params
                    .split(',')
                    .map(p => p.trim())
                    .filter(p => p)
                    .map(p => {
                        const parts = p.split(/\s+/);
                        return {
                            name: parts[parts.length - 1],
                            type: parts.slice(0, -1).join(' '),
                            description: `The ${parts[parts.length - 1]} parameter`,
                        };
                    });

                const returnValues = returns
                    ? returns.split(',').map(r => {
                        const parts = r.trim().split(/\s+/);
                        return {
                            type: parts[0],
                            description: `Returns ${parts[0]} value`,
                        };
                    })
                    : undefined;

                functions.push({
                    name,
                    visibility,
                    stateMutability,
                    description: `${name.charAt(0).toUpperCase() + name.slice(1)} function`,
                    parameters,
                    returns: returnValues,
                });
            }

            // Parse events
            const eventRegex = /event\s+(\w+)\s*\(([^)]+)\)/g;
            const events: EventDoc[] = [];

            while ((match = eventRegex.exec(code)) !== null) {
                const [, name, params] = match;

                const parameters = params
                    .split(',')
                    .map(p => p.trim())
                    .filter(p => p)
                    .map(p => {
                        const indexed = p.includes('indexed');
                        const cleanParam = p.replace('indexed', '').trim();
                        const parts = cleanParam.split(/\s+/);
                        return {
                            name: parts[parts.length - 1],
                            type: parts.slice(0, -1).join(' '),
                            indexed,
                            description: `The ${parts[parts.length - 1]} value`,
                        };
                    });

                events.push({
                    name,
                    description: `Emitted when ${name} occurs`,
                    parameters,
                });
            }

            return {
                name: contractName,
                description: `A smart contract that provides ${contractName} functionality`,
                version,
                license,
                functions,
                events,
            };
        } catch (error) {
            console.error('Parse error:', error);
            return null;
        }
    }, []);

    const handleGenerate = useCallback(() => {
        if (!contractCode.trim()) {
            toastManager.warning('Please enter contract code');
            return;
        }

        setIsGenerating(true);

        // Simulate processing time
        setTimeout(() => {
            const doc = parseContract(contractCode);
            if (doc) {
                setDocumentation(doc);
                toastManager.success('Documentation generated successfully');
            } else {
                toastManager.error('Failed to parse contract');
            }
            setIsGenerating(false);
        }, 500);
    }, [contractCode, parseContract]);

    const handleCopyJSON = useCallback(() => {
        if (!documentation) return;

        const json = JSON.stringify(documentation, null, 2);
        navigator.clipboard.writeText(json);
        toastManager.success('JSON copied to clipboard');
    }, [documentation]);

    const handleDownloadMD = useCallback(() => {
        if (!documentation) return;

        let markdown = `# ${documentation.name}\n\n`;
        markdown += `${documentation.description}\n\n`;

        if (documentation.version) {
            markdown += `**Version:** ${documentation.version}\n\n`;
        }

        if (documentation.license) {
            markdown += `**License:** ${documentation.license}\n\n`;
        }

        if (documentation.functions.length > 0) {
            markdown += `## Functions\n\n`;
            documentation.functions.forEach(func => {
                markdown += `### ${func.name}\n\n`;
                markdown += `\`${func.visibility}${func.stateMutability ? ' ' + func.stateMutability : ''}\`\n\n`;
                markdown += `${func.description}\n\n`;

                if (func.parameters.length > 0) {
                    markdown += `**Parameters:**\n\n`;
                    func.parameters.forEach(param => {
                        markdown += `- \`${param.name}\` (${param.type}) - ${param.description}\n`;
                    });
                    markdown += `\n`;
                }

                if (func.returns && func.returns.length > 0) {
                    markdown += `**Returns:**\n\n`;
                    func.returns.forEach(ret => {
                        markdown += `- ${ret.type} - ${ret.description}\n`;
                    });
                    markdown += `\n`;
                }
            });
        }

        if (documentation.events.length > 0) {
            markdown += `## Events\n\n`;
            documentation.events.forEach(event => {
                markdown += `### ${event.name}\n\n`;
                markdown += `${event.description}\n\n`;

                if (event.parameters.length > 0) {
                    markdown += `**Parameters:**\n\n`;
                    event.parameters.forEach(param => {
                        markdown += `- \`${param.name}\` (${param.type})${param.indexed ? ' indexed' : ''} - ${param.description}\n`;
                    });
                    markdown += `\n`;
                }
            });
        }

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentation.name}-docs.md`;
        a.click();
        URL.revokeObjectURL(url);

        toastManager.success('Markdown downloaded');
    }, [documentation]);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            <ToastContainer />
            <Navigation />

            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel - Contract Input */}
                <div className="w-1/2 flex flex-col border-r border-gray-800/50">
                    <div className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-white">Contract Input</h2>
                                    <p className="text-xs text-gray-500">Paste your Solidity code</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <MonacoEditor
                            value={contractCode}
                            onChange={setContractCode}
                            language="solidity"
                            readOnly={false}
                        />
                    </div>

                    <div className="border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:shadow-none"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {isGenerating ? 'Generating Documentation...' : 'Generate Documentation'}
                        </button>
                    </div>
                </div>

                {/* Right Panel - Documentation */}
                <div className="flex-1 flex flex-col bg-gray-900/30 backdrop-blur-sm overflow-hidden">
                    <div className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-white">Documentation</h2>
                                    <p className="text-xs text-gray-500">Generated contract docs</p>
                                </div>
                            </div>
                            {documentation && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopyJSON}
                                        className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-blue-400 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 border border-gray-700 hover:border-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy JSON
                                    </button>
                                    <button
                                        onClick={handleDownloadMD}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-green-500/20"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download MD
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {!documentation && !isGenerating && (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-lg font-medium mb-2">No Documentation Generated</p>
                                    <p className="text-sm">Enter your contract code and click "Generate Documentation"</p>
                                </div>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                    <p className="text-lg font-medium text-white">Generating Documentation...</p>
                                </div>
                            </div>
                        )}

                        {documentation && (
                            <div ref={docRef} className="space-y-8">
                                {/* Header */}
                                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                                {documentation.name}
                                            </h1>
                                            <p className="text-gray-400 text-lg leading-relaxed">{documentation.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-700/50">
                                        {documentation.version && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-lg border border-blue-500/20">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                {documentation.version}
                                            </div>
                                        )}
                                        {documentation.license && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 text-gray-300 text-sm font-medium rounded-lg border border-gray-700">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                {documentation.license}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Functions */}
                                {documentation.functions.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white">Functions</h2>
                                                <p className="text-sm text-gray-500">{documentation.functions.length} function{documentation.functions.length !== 1 ? 's' : ''} available</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {documentation.functions.map((func, idx) => (
                                                <div key={idx} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-200">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-xl font-bold text-blue-400 font-mono">{func.name}()</h3>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-lg border border-blue-500/20">
                                                                {func.visibility}
                                                            </span>
                                                            {func.stateMutability && (
                                                                <span className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs font-semibold rounded-lg border border-gray-600">
                                                                    {func.stateMutability}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-400 mb-4 leading-relaxed">{func.description}</p>

                                                    {func.parameters.length > 0 && (
                                                        <div className="mb-4 bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                                                            <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                </svg>
                                                                Parameters
                                                            </p>
                                                            <div className="space-y-2">
                                                                {func.parameters.map((param, pidx) => (
                                                                    <div key={pidx} className="flex items-start gap-3 text-sm">
                                                                        <span className="font-mono text-blue-400 font-semibold min-w-[100px]">{param.name}</span>
                                                                        <span className="text-gray-500 font-mono">({param.type})</span>
                                                                        <span className="text-gray-400 flex-1">— {param.description}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {func.returns && func.returns.length > 0 && (
                                                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                                                            <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                                Returns
                                                            </p>
                                                            <div className="space-y-2">
                                                                {func.returns.map((ret, ridx) => (
                                                                    <div key={ridx} className="flex items-start gap-3 text-sm">
                                                                        <span className="font-mono text-green-400 font-semibold">{ret.type}</span>
                                                                        <span className="text-gray-400 flex-1">— {ret.description}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Events */}
                                {documentation.events.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white">Events</h2>
                                                <p className="text-sm text-gray-500">{documentation.events.length} event{documentation.events.length !== 1 ? 's' : ''} defined</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {documentation.events.map((event, idx) => (
                                                <div key={idx} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-200">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                                                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-amber-400 font-mono">{event.name}</h3>
                                                    </div>
                                                    <p className="text-gray-400 mb-4 leading-relaxed">{event.description}</p>

                                                    {event.parameters.length > 0 && (
                                                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                                                            <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                </svg>
                                                                Parameters
                                                            </p>
                                                            <div className="space-y-2">
                                                                {event.parameters.map((param, pidx) => (
                                                                    <div key={pidx} className="flex items-start gap-3 text-sm">
                                                                        <span className="font-mono text-amber-400 font-semibold min-w-[100px]">{param.name}</span>
                                                                        <span className="text-gray-500 font-mono">({param.type})</span>
                                                                        {param.indexed && (
                                                                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded border border-amber-500/20">
                                                                                indexed
                                                                            </span>
                                                                        )}
                                                                        <span className="text-gray-400 flex-1">— {param.description}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
