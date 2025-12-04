'use client';

import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback';

interface CodeEditorProps {
    value: string;
    onChange: (code: string) => void;
    readOnly: boolean;
    language?: 'solidity';
}

function CodeEditor({
    value,
    onChange,
    readOnly,
    language = 'solidity',
}: CodeEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [localValue, setLocalValue] = useState(value);

    const debouncedOnChange = useDebouncedCallback(onChange, 500);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        debouncedOnChange(newValue);
    }, [debouncedOnChange]);


    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && !readOnly) {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = localValue.substring(0, start) + '    ' + localValue.substring(end);

            setLocalValue(newValue);

            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }, 0);

            debouncedOnChange(newValue);
        }
    }, [localValue, readOnly, debouncedOnChange]);

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="flex-1 relative overflow-hidden">
                <textarea
                    ref={textareaRef}
                    value={localValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    readOnly={readOnly}
                    spellCheck={false}
                    className={`
                        w-full h-full p-4 
                        bg-gray-900 text-gray-100
                        font-mono text-sm leading-relaxed
                        resize-none outline-none
                        ${readOnly ? 'cursor-not-allowed opacity-75' : 'cursor-text'}
                    `}
                    placeholder={readOnly ? '' : '// Enter your Solidity contract code here...\n\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    // Your code\n}'}
                />
            </div>

        </div>
    );
}

export default memo(CodeEditor);
