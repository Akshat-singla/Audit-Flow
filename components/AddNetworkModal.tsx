'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { validateNetwork } from '@/lib/validation';
import { useFocusTrap, announceToScreenReader } from '@/lib/accessibility';
import type { Network, ValidationError } from '@/lib/types';

interface AddNetworkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddNetworkModal({ isOpen, onClose }: AddNetworkModalProps) {
    const { addNetwork } = useStore();
    const modalRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        chainId: '',
        rpcUrl: '',
        explorerUrl: '',
        currencySymbol: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useFocusTrap(isOpen, modalRef);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleCancel();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const chainIdNum = parseInt(formData.chainId, 10);

        const networkData: Partial<Network> = {
            name: formData.name.trim(),
            chainId: isNaN(chainIdNum) ? undefined : chainIdNum,
            rpcUrl: formData.rpcUrl.trim(),
            explorerUrl: formData.explorerUrl.trim(),
            currencySymbol: formData.currencySymbol.trim(),
        };

        const validationResult = validateNetwork(networkData);

        if (!validationResult.valid) {
            const errorMap: Record<string, string> = {};
            validationResult.errors.forEach((error: ValidationError) => {
                errorMap[error.field] = error.message;
            });
            setErrors(errorMap);
            setIsSubmitting(false);
            return;
        }

        try {
            addNetwork({
                name: networkData.name!,
                chainId: networkData.chainId!,
                rpcUrl: networkData.rpcUrl!,
                explorerUrl: networkData.explorerUrl!,
                currencySymbol: networkData.currencySymbol!,
            });

            announceToScreenReader(`Network ${networkData.name} added successfully`);

            setFormData({
                name: '',
                chainId: '',
                rpcUrl: '',
                explorerUrl: '',
                currencySymbol: '',
            });
            setErrors({});
            setIsSubmitting(false);
            onClose();
        } catch (error) {
            console.error('Failed to add network:', error);
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                setErrors({ name: error.message });
            } else {
                setErrors({ name: 'Failed to add network. Please try again.' });
            }
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: '',
            chainId: '',
            rpcUrl: '',
            explorerUrl: '',
            currencySymbol: '',
        });
        setErrors({});
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="add-network-title">
            <div ref={modalRef} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                <h2 id="add-network-title" className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Add Custom Network
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="chain-id"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Chain ID
                        </label>
                        <input
                            id="chain-id"
                            type="number"
                            value={formData.chainId}
                            onChange={(e) => handleInputChange('chainId', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${errors.chainId
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder="e.g., 11155111"
                            aria-invalid={!!errors.chainId}
                            aria-describedby={errors.chainId ? 'chainId-error' : undefined}
                        />
                        {errors.chainId && (
                            <p id="chainId-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.chainId}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="explorer-url"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            Explorer URL
                        </label>
                        <input
                            id="explorer-url"
                            type="url"
                            value={formData.explorerUrl}
                            onChange={(e) => handleInputChange('explorerUrl', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${errors.explorerUrl
                                ? 'border-red-500 dark:border-red-500'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder="https://..."
                            aria-invalid={!!errors.explorerUrl}
                            aria-describedby={errors.explorerUrl ? 'explorerUrl-error' : undefined}
                        />
                        {errors.explorerUrl && (
                            <p id="explorerUrl-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.explorerUrl}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={isSubmitting}
                            aria-label="Cancel adding network"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            disabled={isSubmitting}
                            aria-label={isSubmitting ? 'Adding network' : 'Add network'}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Network'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
