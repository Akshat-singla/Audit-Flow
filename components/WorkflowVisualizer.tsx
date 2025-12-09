'use client';

import React, { useEffect, useRef, memo } from 'react';
import { announceToScreenReader } from '@/lib/accessibility';
import type { WorkflowStep, WorkflowStepStatus } from '@/lib/types';

interface WorkflowVisualizerProps {
    steps?: WorkflowStep[];
    currentStepIndex: number;
}

// Default workflow steps to show when no workflow is active
const DEFAULT_STEPS: WorkflowStep[] = [
    { id: 'analyze', name: 'AI Security Analysis', status: 'pending' },
    { id: 'compile', name: 'Compile Contract', status: 'pending' },
    { id: 'review', name: 'Review & Configure', status: 'pending' },
    { id: 'deploy', name: 'Deploy to Network', status: 'pending' },
    { id: 'done', name: 'Deployment Complete', status: 'pending' },
];

const StepStatusIcon: React.FC<{ status: WorkflowStepStatus }> = memo(({ status }) => {
    switch (status) {
        case 'completed':
            return (
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        case 'in-progress':
            return (
                <div className="relative">
                    <div className="absolute inset-0 w-8 h-8 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                    <div className="relative w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/50">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                </div>
            );
        case 'failed':
            return (
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            );
        case 'skipped':
            return (
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </div>
            );
        case 'pending':
        default:
            return (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                </div>
            );
    }
});

StepStatusIcon.displayName = 'StepStatusIcon';

const getStepColorClasses = (status: WorkflowStepStatus): string => {
    switch (status) {
        case 'completed':
            return 'text-green-700 dark:text-green-400 font-semibold';
        case 'in-progress':
            return 'text-blue-700 dark:text-blue-400 font-semibold';
        case 'failed':
            return 'text-red-700 dark:text-red-400 font-semibold';
        case 'skipped':
            return 'text-gray-500 dark:text-gray-400';
        case 'pending':
        default:
            return 'text-gray-600 dark:text-gray-400';
    }
};

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = memo(({ steps, currentStepIndex }) => {
    const prevStepRef = useRef<WorkflowStep[]>([]);
    const displaySteps = steps || DEFAULT_STEPS;

    useEffect(() => {
        const prevSteps = prevStepRef.current;

        displaySteps.forEach((step, index) => {
            const prevStep = prevSteps[index];

            if (prevStep && prevStep.status !== step.status) {
                let message = '';

                switch (step.status) {
                    case 'in-progress':
                        message = `${step.name} in progress`;
                        break;
                    case 'completed':
                        message = `${step.name} completed`;
                        break;
                    case 'failed':
                        message = `${step.name} failed${step.errorMessage ? ': ' + step.errorMessage : ''}`;
                        break;
                    case 'skipped':
                        message = `${step.name} skipped`;
                        break;
                }

                if (message) {
                    announceToScreenReader(message, step.status === 'failed' ? 'assertive' : 'polite');
                }
            }
        });

        prevStepRef.current = displaySteps;
    }, [displaySteps]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" role="region" aria-labelledby="workflow-title" aria-live="polite">
            <h2 id="workflow-title" className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Deployment Workflow</h2>

            <div className="space-y-6">
                {displaySteps.map((step, index) => {
                    const isActive = index === currentStepIndex && step.status === 'in-progress';

                    return (
                        <div key={step.id} className="relative">
                            {index < displaySteps.length - 1 && (
                                <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-300 dark:bg-gray-600"></div>
                            )}

                            <div className={`flex items-start space-x-4 transition-all duration-300 ${isActive ? 'scale-105' : ''
                                }`}>
                                <div role="img" aria-label={`Step ${index + 1}: ${step.status}`}>
                                    <StepStatusIcon status={step.status} />
                                </div>

                                <div className="flex-1">
                                    <div className={`text-lg ${getStepColorClasses(step.status)} ${isActive ? 'animate-pulse' : ''
                                        }`}>
                                        {step.name}
                                    </div>

                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1" role="status">
                                        {step.status === 'pending' && 'Waiting...'}
                                        {step.status === 'in-progress' && 'In progress...'}
                                        {step.status === 'completed' && 'Completed'}
                                        {step.status === 'skipped' && 'Skipped'}
                                        {step.status === 'failed' && 'Failed'}
                                    </div>

                                    {step.status === 'failed' && step.errorMessage && (
                                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md" role="alert">
                                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">Error:</p>
                                            <p className="text-sm text-red-600 dark:text-red-300 mt-1 whitespace-pre-wrap">
                                                {step.errorMessage}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>
                        {displaySteps.filter(s => s.status === 'completed').length} / {displaySteps.length} steps
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${(displaySteps.filter(s => s.status === 'completed').length / displaySteps.length) * 100}%`,
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
});

WorkflowVisualizer.displayName = 'WorkflowVisualizer';

export default WorkflowVisualizer;
