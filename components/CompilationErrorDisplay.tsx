'use client';

interface CompilationErrorDisplayProps {
    errors: string[];
    warnings?: string[];
    onRetry?: () => void;
    onClose?: () => void;
}


export default function CompilationErrorDisplay({
    errors,
    warnings,
    onRetry,
    onClose,
}: CompilationErrorDisplayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <svg
                            className="w-6 h-6 text-red-600 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Compilation Failed
                        </h2>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Errors */}
                    {errors.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                                Errors ({errors.length})
                            </h3>
                            <div className="space-y-3">
                                {errors.map((error, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                                    >
                                        <pre className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap font-mono">
                                            {error}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {warnings && warnings.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-3">
                                Warnings ({warnings.length})
                            </h3>
                            <div className="space-y-3">
                                {warnings.map((warning, index) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                                    >
                                        <pre className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap font-mono">
                                            {warning}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Help Text */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            How to fix:
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                            <li>Review the error messages above for specific issues</li>
                            <li>Check your Solidity syntax and version compatibility</li>
                            <li>Ensure all required imports and dependencies are included</li>
                            <li>Fix the errors in your contract code and try again</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    )}
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Edit Contract & Retry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
