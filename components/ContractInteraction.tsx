'use client';

import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useStore } from '@/lib/store';
import { toastManager } from '@/lib/toast';
import { announceToScreenReader } from '@/lib/accessibility';

interface ContractInteractionProps {
    contractAddress: string;
    abi: any[];
    networkId: string;
}

interface FunctionCall {
    name: string;
    inputs: any[];
    outputs: any[];
    stateMutability: string;
    type: string;
}

export default function ContractInteraction({ contractAddress, abi, networkId }: ContractInteractionProps) {
    const { wallet, networks } = useStore();
    const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
    const [functionInputs, setFunctionInputs] = useState<Record<string, string>>({});
    const [functionResults, setFunctionResults] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [ethValue, setEthValue] = useState<string>('0');

    const network = networks.find(n => n.id === networkId);

    // Parse ABI to get functions
    const functions = useMemo(() => {
        return abi
            .filter((item: any) => item.type === 'function')
            .map((item: any) => ({
                name: item.name,
                inputs: item.inputs || [],
                outputs: item.outputs || [],
                stateMutability: item.stateMutability || 'nonpayable',
                type: item.type
            }));
    }, [abi]);

    const readFunctions = functions.filter((f: FunctionCall) =>
        f.stateMutability === 'view' || f.stateMutability === 'pure'
    );

    const writeFunctions = functions.filter((f: FunctionCall) =>
        f.stateMutability !== 'view' && f.stateMutability !== 'pure'
    );

    const handleInputChange = useCallback((functionName: string, inputName: string, value: string) => {
        setFunctionInputs(prev => ({
            ...prev,
            [`${functionName}_${inputName}`]: value
        }));
    }, []);

    const getInputValue = useCallback((functionName: string, inputName: string) => {
        return functionInputs[`${functionName}_${inputName}`] || '';
    }, [functionInputs]);

    const parseInputValue = (value: string, type: string) => {
        try {
            if (type.startsWith('uint') || type.startsWith('int')) {
                return BigInt(value);
            } else if (type === 'bool') {
                return value.toLowerCase() === 'true';
            } else if (type.startsWith('bytes')) {
                return value;
            } else if (type === 'address') {
                return ethers.getAddress(value);
            } else if (type.endsWith('[]')) {
                return JSON.parse(value);
            }
            return value;
        } catch (error) {
            throw new Error(`Invalid input for type ${type}: ${value}`);
        }
    };

    const callReadFunction = useCallback(async (func: FunctionCall) => {
        if (!wallet.isConnected || !network) return;

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        setLoading(prev => ({ ...prev, [func.name]: true }));

        try {
            const contract = new ethers.Contract(
                contractAddress,
                abi,
                provider
            );

            const args = func.inputs.map((input: any) => {
                const value = getInputValue(func.name, input.name);
                return parseInputValue(value, input.type);
            });

            const result = await contract[func.name](...args);

            setFunctionResults(prev => ({
                ...prev,
                [func.name]: result
            }));

            announceToScreenReader(`Function ${func.name} called successfully`);
            toastManager.success(`Function ${func.name} executed`);
        } catch (error: any) {
            console.error('Read function error:', error);
            toastManager.error(`Failed to call ${func.name}: ${error.message}`);
            announceToScreenReader(`Failed to call function ${func.name}`);
        } finally {
            setLoading(prev => ({ ...prev, [func.name]: false }));
        }
    }, [wallet.isConnected, network, contractAddress, abi, getInputValue]);

    const callWriteFunction = useCallback(async (func: FunctionCall) => {
        if (!wallet.isConnected || !network) {
            toastManager.warning('Please connect your wallet');
            return;
        }

        setLoading(prev => ({ ...prev, [func.name]: true }));

        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();

            const contract = new ethers.Contract(
                contractAddress,
                abi,
                signer
            );

            const args = func.inputs.map((input: any) => {
                const value = getInputValue(func.name, input.name);
                return parseInputValue(value, input.type);
            });

            const options: any = {};
            if (func.stateMutability === 'payable' && ethValue !== '0') {
                options.value = ethers.parseEther(ethValue);
            }

            const tx = await contract[func.name](...args, options);
            toastManager.info(`Transaction submitted: ${tx.hash}`);

            const receipt = await tx.wait();

            if (receipt) {
                setFunctionResults(prev => ({
                    ...prev,
                    [func.name]: {
                        transactionHash: receipt.hash,
                        blockNumber: receipt.blockNumber,
                        gasUsed: receipt.gasUsed.toString()
                    }
                }));

                announceToScreenReader(`Transaction ${func.name} confirmed`);
                toastManager.success(`Transaction confirmed!`);
            }
        } catch (error: any) {
            console.error('Write function error:', error);
            toastManager.error(`Failed to execute ${func.name}: ${error.message}`);
            announceToScreenReader(`Failed to execute function ${func.name}`);
        } finally {
            setLoading(prev => ({ ...prev, [func.name]: false }));
        }
    }, [wallet.isConnected, network, contractAddress, abi, getInputValue, ethValue]);

    const formatResult = (result: any) => {
        if (result === null || result === undefined) return 'No result';

        if (typeof result === 'bigint') {
            return result.toString();
        }

        if (typeof result === 'object') {
            if (result.transactionHash) {
                return (
                    <div className="space-y-1">
                        <div><span className="font-medium">TX Hash:</span> {result.transactionHash}</div>
                        <div><span className="font-medium">Block:</span> {result.blockNumber}</div>
                        <div><span className="font-medium">Gas Used:</span> {result.gasUsed}</div>
                    </div>
                );
            }
            return JSON.stringify(result, null, 2);
        }

        return String(result);
    };

    const renderFunctionCard = (func: FunctionCall, isWrite: boolean) => {
        const isExpanded = selectedFunction === func.name;
        const isLoading = loading[func.name];
        const result = functionResults[func.name];

        return (
            <div key={func.name} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                    onClick={() => setSelectedFunction(isExpanded ? null : func.name)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                            {func.name}
                        </span>
                        {func.stateMutability === 'payable' && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                                payable
                            </span>
                        )}
                    </div>
                    <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isExpanded && (
                    <div className="p-4 space-y-3">
                        {func.inputs.length > 0 && (
                            <div className="space-y-2">
                                {func.inputs.map((input: any, idx: number) => (
                                    <div key={idx}>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {input.name || `param${idx}`} ({input.type})
                                        </label>
                                        <input
                                            type="text"
                                            value={getInputValue(func.name, input.name || `param${idx}`)}
                                            onChange={(e) => handleInputChange(func.name, input.name || `param${idx}`, e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                                            placeholder={`Enter ${input.type}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {isWrite && func.stateMutability === 'payable' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ETH Value
                                </label>
                                <input
                                    type="text"
                                    value={ethValue}
                                    onChange={(e) => setEthValue(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="0.0"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => isWrite ? callWriteFunction(func) : callReadFunction(func)}
                            disabled={isLoading}
                            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isWrite
                                ? 'bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-400'
                                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
                                } disabled:cursor-not-allowed`}
                        >
                            {isLoading ? 'Loading...' : isWrite ? 'Execute' : 'Call'}
                        </button>

                        {result && (
                            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Result:</div>
                                <div className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                                    {formatResult(result)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">Contract Address</div>
                <div className="text-sm font-mono text-blue-700 dark:text-blue-300 break-all">{contractAddress}</div>
            </div>

            {readFunctions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Read Functions
                    </h4>
                    <div className="space-y-2">
                        {readFunctions.map((func) => renderFunctionCard(func, false))}
                    </div>
                </div>
            )}

            {writeFunctions.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Write Functions
                    </h4>
                    <div className="space-y-2">
                        {writeFunctions.map((func) => renderFunctionCard(func, true))}
                    </div>
                </div>
            )}

            {functions.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No functions found in contract ABI
                </div>
            )}
        </div>
    );
}
