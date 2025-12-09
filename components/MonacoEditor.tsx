'use client';

import { memo } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

interface MonacoEditorProps {
    value: string;
    onChange: (code: string) => void;
    readOnly: boolean;
    language?: 'solidity';
}

function MonacoEditor({
    value,
    onChange,
    readOnly,
}: MonacoEditorProps) {
    const handleEditorDidMount: OnMount = (editor, monaco) => {

        const languages = monaco.languages.getLanguages();
        if (!languages.find((lang: { id: string }) => lang.id === 'solidity')) {
            monaco.languages.register({ id: 'solidity' });
        }


        monaco.languages.setMonarchTokensProvider('solidity', {
            keywords: [
                'abstract', 'after', 'alias', 'apply', 'auto', 'case', 'catch', 'copyof',
                'default', 'define', 'final', 'immutable', 'implements', 'in', 'inline',
                'let', 'macro', 'match', 'mutable', 'null', 'of', 'override', 'partial',
                'promise', 'reference', 'relocatable', 'sealed', 'sizeof', 'static',
                'supports', 'switch', 'try', 'typedef', 'typeof', 'unchecked',
                'contract', 'library', 'interface', 'function', 'modifier', 'event', 'struct',
                'enum', 'constructor', 'fallback', 'receive', 'is', 'pragma', 'import',
                'using', 'for', 'return', 'returns', 'if', 'else', 'while', 'do', 'break',
                'continue', 'throw', 'emit', 'new', 'delete', 'assembly', 'memory', 'storage',
                'calldata', 'public', 'private', 'internal', 'external', 'pure', 'view',
                'payable', 'constant', 'anonymous', 'indexed', 'virtual', 'mapping',
                'require', 'assert', 'revert', 'this', 'super', 'true', 'false'
            ],
            typeKeywords: [
                'address', 'bool', 'string', 'bytes', 'byte', 'int', 'uint', 'fixed', 'ufixed',
                'int8', 'int16', 'int24', 'int32', 'int40', 'int48', 'int56', 'int64',
                'int72', 'int80', 'int88', 'int96', 'int104', 'int112', 'int120', 'int128',
                'int136', 'int144', 'int152', 'int160', 'int168', 'int176', 'int184', 'int192',
                'int200', 'int208', 'int216', 'int224', 'int232', 'int240', 'int248', 'int256',
                'uint8', 'uint16', 'uint24', 'uint32', 'uint40', 'uint48', 'uint56', 'uint64',
                'uint72', 'uint80', 'uint88', 'uint96', 'uint104', 'uint112', 'uint120', 'uint128',
                'uint136', 'uint144', 'uint152', 'uint160', 'uint168', 'uint176', 'uint184', 'uint192',
                'uint200', 'uint208', 'uint216', 'uint224', 'uint232', 'uint240', 'uint248', 'uint256',
                'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5', 'bytes6', 'bytes7', 'bytes8',
                'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
                'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22', 'bytes23', 'bytes24',
                'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29', 'bytes30', 'bytes31', 'bytes32'
            ],
            operators: [
                '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
                '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
                '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
                '%=', '<<=', '>>=', '>>>='
            ],
            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            tokenizer: {
                root: [
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            '@typeKeywords': 'type',
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                    [/[A-Z][\w\$]*/, 'type.identifier'],
                    { include: '@whitespace' },
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>](?!@symbols)/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                    [/\d+/, 'number'],
                    [/[;,.]/, 'delimiter'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'],
                    [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }]
                ],
                string: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],
                string_single: [
                    [/[^\\']+/, 'string'],
                    [/\\./, 'string.escape.invalid'],
                    [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],
                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\/\/.*$/, 'comment']
                ],
                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\/\*/, 'comment', '@push'],
                    [/\*\//, 'comment', '@pop'],
                    [/[\/*]/, 'comment']
                ]
            }
        });

        // Configure autocomplete
        monaco.languages.registerCompletionItemProvider('solidity', {
            provideCompletionItems: (model: Monaco.editor.ITextModel, position: Monaco.Position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const suggestions: Monaco.languages.CompletionItem[] = [
                    {
                        label: 'contract',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'contract ${1:ContractName} {\n\t$0\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Create a new contract',
                        range
                    },
                    {
                        label: 'function',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'function ${1:functionName}(${2:params}) ${3:public} ${4:returns (${5:type})} {\n\t$0\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Create a new function',
                        range
                    },
                    {
                        label: 'constructor',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'constructor(${1:params}) {\n\t$0\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Create a constructor',
                        range
                    },
                    {
                        label: 'modifier',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'modifier ${1:modifierName}(${2:params}) {\n\t${3:require(condition, "error message");}\n\t_;\n}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Create a modifier',
                        range
                    },
                    {
                        label: 'event',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'event ${1:EventName}(${2:params});',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Create an event',
                        range
                    },
                    {
                        label: 'mapping',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'mapping(${1:address} => ${2:uint256}) ${3:public} ${4:balances};',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Create a mapping',
                        range
                    },
                    {
                        label: 'require',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'require(${1:condition}, "${2:error message}");',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Add a require statement',
                        range
                    },
                    {
                        label: 'emit',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: 'emit ${1:EventName}(${2:params});',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Emit an event',
                        range
                    }
                ];

                return { suggestions };
            }
        });

        // Set editor theme
        monaco.editor.defineTheme('solidity-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: 'C586C0' },
                { token: 'type', foreground: '4EC9B0' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'comment', foreground: '6A9955' }
            ],
            colors: {
                'editor.background': '#1E1E1E'
            }
        });

        monaco.editor.setTheme('solidity-dark');
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            onChange(value);
        }
    };

    return (
        <Editor
            height="100%"
            defaultLanguage="solidity"
            language="solidity"
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
                readOnly,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                matchBrackets: 'always',
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                autoIndent: 'full',
            }}
        />
    );
}

export default memo(MonacoEditor);
