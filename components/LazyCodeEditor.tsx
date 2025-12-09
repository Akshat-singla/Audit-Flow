'use client';

import { lazy, Suspense, memo } from 'react';
import LoadingSpinner from './LoadingSpinner';

const MonacoEditor = lazy(() => import('./MonacoEditor'));

interface LazyCodeEditorProps {
    value: string;
    onChange: (code: string) => void;
    readOnly: boolean;
    language?: 'solidity';
}

function LazyCodeEditor(props: LazyCodeEditorProps) {
    return (
        <Suspense
            fallback={
                <div className="h-full flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                        <LoadingSpinner />
                        <p className="text-gray-400 text-sm mt-2">Loading code editor...</p>
                    </div>
                </div>
            }
        >
            <MonacoEditor {...props} />
        </Suspense>
    );
}

export default memo(LazyCodeEditor);
