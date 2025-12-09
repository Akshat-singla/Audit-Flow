'use client';

import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import DeploymentHistory from '@/components/DeploymentHistory';
import ToastContainer from '@/components/ToastContainer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useStore } from '@/lib/store';
import { toastManager } from '@/lib/toast';

export default function HistoryPage() {
    const { loadNetworks, loadDeploymentHistory } = useStore();

    useEffect(() => {
        try {
            loadNetworks();
            loadDeploymentHistory();
        } catch (error) {
            console.error('Failed to load data:', error);
            toastManager.error('Failed to load deployment history. Please refresh the page.');
        }
    }, [loadNetworks, loadDeploymentHistory]);

    const { deploymentHistory, networks } = useStore();

    return (
        <ErrorBoundary>
            <ToastContainer />
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                <Navigation />

                <main className="flex-1 overflow-hidden p-8">
                    <div className="h-full max-w-7xl mx-auto">
                        <div className="h-full bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden shadow-2xl">
                            <DeploymentHistory />
                        </div>
                    </div>
                </main>
            </div>
        </ErrorBoundary>
    );
}
