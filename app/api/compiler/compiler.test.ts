import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Helper to create a mock NextRequest
function createMockRequest(body: any): NextRequest {
    return {
        json: async () => body,
    } as NextRequest;
}

// Helper to parse response
async function parseResponse(response: Response) {
    const text = await response.text();
    return JSON.parse(text);
}

describe('Compiler API - Property Tests', () => {
    // Feature: smart-contract-deployer, Property 9: Compilation success produces artifacts
    // Validates: Requirements 5.3
    it('Property 9: successful compilation produces both ABI and bytecode', async () => {
        // Valid simple contract that should always compile
        const validContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 public value;
    
    constructor(uint256 _value) {
        value = _value;
    }
    
    function setValue(uint256 _value) public {
        value = _value;
    }
}
`;

        const request = createMockRequest({
            contractCode: validContract,
            contractName: 'SimpleStorage',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(result.success).toBe(true);
        expect(result.abi).toBeDefined();
        expect(Array.isArray(result.abi)).toBe(true);
        expect(result.abi!.length).toBeGreaterThan(0);
        expect(result.bytecode).toBeDefined();
        expect(typeof result.bytecode).toBe('string');
        expect(result.bytecode!.length).toBeGreaterThan(0);
    }, 10000);

    // Feature: smart-contract-deployer, Property 10: Compilation errors halt workflow
    // Validates: Requirements 5.4
    it('Property 10: compilation errors result in failure without artifacts', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom(
                    // Missing semicolon
                    `pragma solidity ^0.8.0; contract Test { uint x }`,
                    // Invalid syntax
                    `pragma solidity ^0.8.0; contract Test { function }`,
                    // Undefined variable
                    `pragma solidity ^0.8.0; contract Test { function f() public { x = 1; } }`,
                    // Type mismatch
                    `pragma solidity ^0.8.0; contract Test { function f() public returns (uint) { return "string"; } }`,
                    // Missing contract keyword
                    `pragma solidity ^0.8.0; Test { uint x; }`
                ),
                async (invalidContract) => {
                    const request = createMockRequest({
                        contractCode: invalidContract,
                        contractName: 'Test',
                    });

                    const response = await POST(request);
                    const result = await parseResponse(response);

                    // Should fail
                    expect(result.success).toBe(false);
                    // Should have errors
                    expect(result.errors).toBeDefined();
                    expect(Array.isArray(result.errors)).toBe(true);
                    expect(result.errors!.length).toBeGreaterThan(0);
                    // Should NOT have artifacts
                    expect(result.abi).toBeUndefined();
                    expect(result.bytecode).toBeUndefined();
                }
            ),
            { numRuns: 5 } // Run with each error case
        );
    }, 30000);

    // Feature: smart-contract-deployer, Property 11: Compilation warnings allow continuation
    // Validates: Requirements 5.5
    it('Property 11: compilation warnings still produce artifacts and allow continuation', async () => {
        // Contract with warnings but no errors (unused variable)
        const contractWithWarnings = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WarningTest {
    function test() public pure returns (uint) {
        uint unusedVar = 42;
        return 100;
    }
}
`;

        const request = createMockRequest({
            contractCode: contractWithWarnings,
            contractName: 'WarningTest',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        // Should succeed despite warnings
        expect(result.success).toBe(true);
        // Should have artifacts
        expect(result.abi).toBeDefined();
        expect(Array.isArray(result.abi)).toBe(true);
        expect(result.abi!.length).toBeGreaterThan(0);
        expect(result.bytecode).toBeDefined();
        expect(typeof result.bytecode).toBe('string');
        expect(result.bytecode!.length).toBeGreaterThan(0);
        // Should have warnings
        expect(result.warnings).toBeDefined();
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(result.warnings!.length).toBeGreaterThan(0);
    }, 10000);
});


describe('Compiler API - Unit Tests', () => {
    // Test with valid Solidity contracts
    it('should compile a valid simple contract', async () => {
        const validContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count;
    
    function increment() public {
        count += 1;
    }
}
`;

        const request = createMockRequest({
            contractCode: validContract,
            contractName: 'Counter',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(result.success).toBe(true);
        expect(result.abi).toBeDefined();
        expect(result.bytecode).toBeDefined();
        expect(result.errors).toBeUndefined();
    });

    it('should compile a contract with constructor', async () => {
        const contractWithConstructor = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Token {
    string public name;
    uint256 public totalSupply;
    
    constructor(string memory _name, uint256 _supply) {
        name = _name;
        totalSupply = _supply;
    }
}
`;

        const request = createMockRequest({
            contractCode: contractWithConstructor,
            contractName: 'Token',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(result.success).toBe(true);
        expect(result.abi).toBeDefined();
        expect(result.bytecode).toBeDefined();

        // Check that constructor is in ABI
        const constructorAbi = result.abi!.find((item: any) => item.type === 'constructor');
        expect(constructorAbi).toBeDefined();
        expect(constructorAbi.inputs).toHaveLength(2);
    });

    // Test with syntax errors
    it('should return errors for contract with syntax errors', async () => {
        const invalidContract = `
pragma solidity ^0.8.0;

contract Invalid {
    uint256 public value
    // Missing semicolon above
}
`;

        const request = createMockRequest({
            contractCode: invalidContract,
            contractName: 'Invalid',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
        expect(result.abi).toBeUndefined();
        expect(result.bytecode).toBeUndefined();
    });

    it('should return errors for undefined variables', async () => {
        const invalidContract = `
pragma solidity ^0.8.0;

contract Invalid {
    function test() public {
        undefinedVariable = 42;
    }
}
`;

        const request = createMockRequest({
            contractCode: invalidContract,
            contractName: 'Invalid',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
    });

    // Test with contracts producing warnings
    it('should compile contract with warnings and include warning messages', async () => {
        const contractWithWarnings = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WithWarnings {
    function unusedParam(uint256 x) public pure returns (uint256) {
        return 42;
    }
}
`;

        const request = createMockRequest({
            contractCode: contractWithWarnings,
            contractName: 'WithWarnings',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(result.success).toBe(true);
        expect(result.abi).toBeDefined();
        expect(result.bytecode).toBeDefined();
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);
    });

    // Test pragma version detection
    it('should handle contracts with different pragma versions', async () => {
        const contracts = [
            {
                code: `pragma solidity ^0.8.0; contract Test { uint public x; }`,
                name: 'Test',
            },
            {
                code: `pragma solidity >=0.8.0 <0.9.0; contract Test2 { uint public x; }`,
                name: 'Test2',
            },
            {
                code: `pragma solidity ^0.8.20; contract Test3 { uint public x; }`,
                name: 'Test3',
            },
        ];

        for (const { code, name } of contracts) {
            const request = createMockRequest({
                contractCode: code,
                contractName: name,
            });

            const response = await POST(request);
            const result = await parseResponse(response);

            expect(result.success).toBe(true);
            expect(result.abi).toBeDefined();
            expect(result.bytecode).toBeDefined();
        }
    });

    it('should auto-detect contract name when not provided', async () => {
        const contract = `
pragma solidity ^0.8.0;

contract AutoDetected {
    uint256 public value;
}
`;

        const request = createMockRequest({
            contractCode: contract,
            // No contractName provided
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(result.success).toBe(true);
        expect(result.abi).toBeDefined();
        expect(result.bytecode).toBeDefined();
    });

    // Test error handling
    it('should return 400 for missing contract code', async () => {
        const request = createMockRequest({
            contractName: 'Test',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
    });

    it('should return 400 for invalid contract code type', async () => {
        const request = createMockRequest({
            contractCode: 123, // Should be string
            contractName: 'Test',
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(response.status).toBe(400);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
    });

    it('should handle contract not found in compilation output', async () => {
        const contract = `
pragma solidity ^0.8.0;

contract ActualName {
    uint256 public value;
}
`;

        const request = createMockRequest({
            contractCode: contract,
            contractName: 'WrongName', // Wrong contract name
        });

        const response = await POST(request);
        const result = await parseResponse(response);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors![0]).toContain('not found');
    });
});
