import { NextRequest, NextResponse } from 'next/server';
import solc from 'solc';

interface CompileRequest {
    contractCode: string;
    contractName?: string;
}

interface CompileResponse {
    success: boolean;
    abi?: any[];
    bytecode?: string;
    warnings?: string[];
    errors?: string[];
}

/**
 * Extract Solidity version from pragma statement
 */
function extractSolidityVersion(source: string): string | null {
    const pragmaRegex = /pragma\s+solidity\s+[\^~>=<]*\s*(\d+\.\d+\.\d+)/;
    const match = source.match(pragmaRegex);
    return match ? match[1] : null;
}

/**
 * Extract contract name from source code
 */
function extractContractName(source: string): string {
    const contractRegex = /contract\s+(\w+)/;
    const match = source.match(contractRegex);
    return match ? match[1] : 'Contract';
}

/**
 * Compile Solidity contract using solc-js
 */
function compileContract(source: string, contractName: string): CompileResponse {
    const input = {
        language: 'Solidity',
        sources: {
            'contract.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for errors
    if (output.errors) {
        const errors: string[] = [];
        const warnings: string[] = [];

        output.errors.forEach((error: any) => {
            if (error.severity === 'error') {
                errors.push(error.formattedMessage || error.message);
            } else if (error.severity === 'warning') {
                warnings.push(error.formattedMessage || error.message);
            }
        });

        // If there are errors, return failure
        if (errors.length > 0) {
            return {
                success: false,
                errors,
                warnings: warnings.length > 0 ? warnings : undefined,
            };
        }

        // If only warnings, continue with compilation
        const contract = output.contracts['contract.sol'][contractName];

        if (!contract) {
            return {
                success: false,
                errors: [`Contract "${contractName}" not found in compilation output`],
            };
        }

        return {
            success: true,
            abi: contract.abi,
            bytecode: contract.evm.bytecode.object,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }

    // No errors or warnings
    const contract = output.contracts['contract.sol'][contractName];

    if (!contract) {
        return {
            success: false,
            errors: [`Contract "${contractName}" not found in compilation output`],
        };
    }

    return {
        success: true,
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: CompileRequest = await request.json();
        const { contractCode, contractName } = body;

        if (!contractCode || typeof contractCode !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    errors: ['Contract code is required and must be a string'],
                },
                { status: 400 }
            );
        }

        // Extract contract name if not provided
        const finalContractName = contractName || extractContractName(contractCode);

        // Compile the contract
        const result = compileContract(contractCode, finalContractName);

        return NextResponse.json(result, {
            status: result.success ? 200 : 400,
        });
    } catch (error) {
        console.error('Compilation error:', error);
        return NextResponse.json(
            {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown compilation error'],
            },
            { status: 500 }
        );
    }
}
