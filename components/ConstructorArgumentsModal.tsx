'use client';

import { useState, useEffect, useRef } from 'react';
import { validateConstructorArguments } from '@/lib/abiParser';
import { useFocusTrap, announceToScreenReader } from '@/lib/accessibility';
import type { ConstructorArgument, ValidationError } from '@/lib/types';

interface ConstructorArgumentsModalProps {
    isOpen: boolean;
    abi: any[];
    arguments: ConstructorArgument[];
    onArgumentChange: (index: number, value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    isDeploying?: boolean;
}

export default function ConstructorArgumentsModal({
    isOpen,
    abi,
    arguments: args,
    onArgumentChange,
    onSubmit,
    onCancel,
    isDeploying = false,
}: ConstructorArgumentsModalProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useFocusTrap(isOpen, modalRef);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isDeploying) {
                handleCancel();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, isDeploying]);

    const handleInputChange = (index: number, value: string) => {
        onArgumentChange(index, value);

        const fieldKey = `argument[${index}]`;
        if (errors[fieldKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldKey];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const validationResult = validateConstructorArguments(abi, args);

        if (!validationResult.valid) {
            const errorMap: Record<string, string> = {};
            validationResult.errors.forEach((error: ValidationError) => {
                errorMap[error.field] = error.message;
            });
            setErrors(errorMap);
            setIsSubmitting(false);
            return;
        }

        setErrors({});
        setIsSubmitting(false);
        announceToScreenReader('Deploying contract with constructor arguments');
        onSubmit();
    };

    const handleCancel = () => {
        setErrors({});
        setIsSubmitting(false);
        onCancel();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="constructor-args-title">
            <div ref={modalRef} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <h2 id="constructor-args-title" className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Constructor Arguments
                </h2>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    This contract requires constructor arguments. Please provide values for each parameter.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {args.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            No constructor arguments required
                        </p>
                    ) : (
                        args.map((arg, index) => {
                            const fieldKey = `argument[${index}]`;
                            const hasError = !!errors[fieldKey];

                            return (
                                <div key={index}>
                                    <label
                                        htmlFor={`arg-${index}`}
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                    >
                                        <span className="font-semibold">{arg.name || `Argument ${index}`}</span>
                                        <span className="ml-2 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                            ({arg.type})
                                        </span>
                                    </label>

                                    {!hasError && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {getTypeHint(arg.type)}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={isSubmitting || isDeploying}
                            aria-label="Cancel deployment"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={isSubmitting || isDeploying}
                            aria-label={isDeploying ? 'Deploying contract' : isSubmitting ? 'Validating arguments' : 'Deploy contract'}
                        >
                            {isDeploying ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Deploying...
                                </>
                            ) : isSubmitting ? (
                                'Validating...'
                            ) : (
                                'Deploy Contract'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function getPlaceholder(type: string): string {
    const baseType = type.replace(/\d+$/, '');

    if (type.endsWith('[]')) {
        return '["value1", "value2"]';
    }

    switch (baseType) {
        case 'uint':
        case 'int':
            return '123';
        case 'address':
            return '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
        case 'bool':
            return 'true or false';
        case 'string':
            return 'Enter text';
        case 'bytes':
            return '0x1234...';
        default:
            return `Enter ${type} value`;
    }
}

function getTypeHint(type: string): string {
    const baseType = type.replace(/\d+$/, '');

    if (type.endsWith('[]')) {
        return 'Enter a JSON array of values';
    }

    switch (baseType) {
        case 'uint':
            return 'Enter a non-negative integer';
        case 'int':
            return 'Enter an integer (positive or negative)';
        case 'address':
            return 'Enter a valid Ethereum address (0x followed by 40 hex characters)';
        case 'bool':
            return 'Enter true or false';
        case 'string':
            return 'Enter any text value';
        case 'bytes':
            return 'Enter hex data starting with 0x';
        default:
            return '';
    }
}
