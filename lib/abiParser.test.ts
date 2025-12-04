import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    extractConstructor,
    extractConstructorArguments,
    validateConstructorArguments,
    convertArgumentValues,
    ABIConstructor,
    ABIInput
} from './abiParser';
import { ConstructorArgument } from './types';

// Generators for property-based testing

/**
 * Generates valid Solidity type strings
 */
const solidityTypeArb = fc.oneof(
    fc.constant('uint256'),
    fc.constant('uint128'),
    fc.constant('uint8'),
    fc.constant('int256'),
    fc.constant('address'),
    fc.constant('bool'),
    fc.constant('string'),
    fc.constant('bytes32'),
    fc.constant('bytes')
);

/**
 * Generates ABI input parameters
 */
const abiInputArb: fc.Arbitrary<ABIInput> = fc.record({
    name: fc.oneof(fc.string({ minLength: 1, maxLength: 20 }), fc.constant('')),
    type: solidityTypeArb,
    internalType: fc.option(fc.string(), { nil: undefined })
});

/**
 * Generates ABI constructor with inputs
 */
const abiConstructorArb: fc.Arbitrary<ABIConstructor> = fc.record({
    type: fc.constant('constructor' as const),
    inputs: fc.array(abiInputArb, { minLength: 0, maxLength: 10 }),
    stateMutability: fc.option(fc.constant('nonpayable'), { nil: undefined })
});

/**
 * Generates a complete ABI array with optional constructor
 */
const abiWithConstructorArb = fc.tuple(
    abiConstructorArb,
    fc.array(fc.record({
        type: fc.constantFrom('function', 'event', 'fallback'),
        name: fc.string()
    }))
).map(([constructor, otherItems]) => {
    return [constructor, ...otherItems];
});

/**
 * Generates an ABI without constructor
 */
const abiWithoutConstructorArb = fc.array(fc.record({
    type: fc.constantFrom('function', 'event', 'fallback'),
    name: fc.string()
}), { minLength: 0, maxLength: 5 });

/**
 * Generates valid values for given types
 */
function generateValidValue(type: string): fc.Arbitrary<string> {
    const baseType = type.replace(/\d+$/, '');

    switch (baseType) {
        case 'uint':
            return fc.bigUintN(256).map(n => n.toString());
        case 'int':
            return fc.bigIntN(256).map(n => n.toString());
        case 'address':
            return fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => '0x' + s);
        case 'bool':
            return fc.boolean().map(b => b.toString());
        case 'string':
            return fc.string({ minLength: 1 });
        case 'bytes':
            if (type === 'bytes') {
                return fc.hexaString({ minLength: 0, maxLength: 64 }).map(s => '0x' + s);
            } else {
                // Fixed size bytes
                const sizeMatch = type.match(/^bytes(\d+)$/);
                if (sizeMatch) {
                    const size = parseInt(sizeMatch[1]);
                    return fc.hexaString({ minLength: size * 2, maxLength: size * 2 }).map(s => '0x' + s);
                }
            }
            return fc.hexaString({ minLength: 0, maxLength: 64 }).map(s => '0x' + s);
        default:
            return fc.string({ minLength: 1 });
    }
}

/**
 * Generates constructor arguments matching an ABI
 */
function constructorArgumentsArb(abi: any[]): fc.Arbitrary<ConstructorArgument[]> {
    const constructor = extractConstructor(abi);

    if (!constructor || !constructor.inputs || constructor.inputs.length === 0) {
        return fc.constant([]);
    }

    const argArbs = constructor.inputs.map((input, index) =>
        generateValidValue(input.type).map(value => ({
            name: input.name || `arg${index}`,
            type: input.type,
            value
        }))
    );

    return fc.tuple(...argArbs);
}

// Property-based tests

describe('ABI Parser - Property Tests', () => {
    // Feature: smart-contract-deployer, Property 12: Constructor argument extraction
    it('Property 12: For any compiled contract ABI with a constructor, parsing should extract the correct number of arguments with their types and names', () => {
        fc.assert(
            fc.property(abiWithConstructorArb, (abi) => {
                const extractedArgs = extractConstructorArguments(abi);
                const constructor = extractConstructor(abi);

                // Should extract correct number of arguments
                expect(extractedArgs.length).toBe(constructor!.inputs.length);

                // Each argument should have correct type and name
                extractedArgs.forEach((arg, index) => {
                    const expectedInput = constructor!.inputs[index];
                    expect(arg.type).toBe(expectedInput.type);

                    // Name should match or be auto-generated
                    if (expectedInput.name) {
                        expect(arg.name).toBe(expectedInput.name);
                    } else {
                        expect(arg.name).toBe(`arg${index}`);
                    }

                    // Value should be empty initially
                    expect(arg.value).toBe('');
                });
            }),
            { numRuns: 100 }
        );
    });

    it('Property 12: For any ABI without a constructor, extraction should return empty array', () => {
        fc.assert(
            fc.property(abiWithoutConstructorArb, (abi) => {
                const extractedArgs = extractConstructorArguments(abi);
                expect(extractedArgs.length).toBe(0);
            }),
            { numRuns: 100 }
        );
    });

    // Feature: smart-contract-deployer, Property 13: Constructor argument validation
    it('Property 13: For any set of constructor arguments matching the ABI types, validation should succeed', () => {
        fc.assert(
            fc.property(abiWithConstructorArb, (abi) => {
                const args = extractConstructorArguments(abi);

                // Generate valid values for each argument
                const filledArgs = args.map(arg => ({
                    ...arg,
                    value: generateValidValueSync(arg.type)
                }));

                const result = validateConstructorArguments(abi, filledArgs);

                if (filledArgs.length > 0) {
                    expect(result.valid).toBe(true);
                } else {
                    // Empty args for empty constructor should be valid
                    expect(result.valid).toBe(true);
                }
            }),
            { numRuns: 100 }
        );
    });

    it('Property 13: For any ABI with constructor, providing wrong number of arguments should fail validation', () => {
        fc.assert(
            fc.property(
                abiWithConstructorArb.filter(abi => {
                    const constructor = extractConstructor(abi);
                    return !!(constructor && constructor.inputs && constructor.inputs.length > 0);
                }),
                fc.integer({ min: 0, max: 20 }),
                (abi, wrongCount) => {
                    const constructor = extractConstructor(abi);
                    const correctCount = constructor!.inputs.length;

                    // Skip if wrongCount happens to be correct
                    if (wrongCount === correctCount) {
                        return true;
                    }

                    // Create wrong number of arguments
                    const wrongArgs: ConstructorArgument[] = Array(wrongCount).fill(null).map((_, i) => ({
                        name: `arg${i}`,
                        type: 'uint256',
                        value: '123'
                    }));

                    const result = validateConstructorArguments(abi, wrongArgs);
                    expect(result.valid).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13: For any constructor arguments, empty values should fail validation', () => {
        fc.assert(
            fc.property(
                abiWithConstructorArb.filter(abi => {
                    const constructor = extractConstructor(abi);
                    return !!(constructor && constructor.inputs && constructor.inputs.length > 0);
                }),
                (abi) => {
                    const args = extractConstructorArguments(abi);

                    // Leave values empty (they're already empty from extraction)
                    const result = validateConstructorArguments(abi, args);

                    // Should fail because values are empty
                    expect(result.valid).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Helper function to generate valid values synchronously
function generateValidValueSync(type: string): string {
    const baseType = type.replace(/\d+$/, '');

    switch (baseType) {
        case 'uint': {
            // Extract bit size if specified
            const sizeMatch = type.match(/\d+$/);
            if (sizeMatch) {
                const bits = parseInt(sizeMatch[0]);
                // Use a safe value that fits in any uint size
                const safeValue = Math.min(100, Math.pow(2, bits) - 1);
                return safeValue.toString();
            }
            return '12345';
        }
        case 'int': {
            // Extract bit size if specified
            const sizeMatch = type.match(/\d+$/);
            if (sizeMatch) {
                const bits = parseInt(sizeMatch[0]);
                // Use a safe negative value that fits
                const safeValue = -Math.min(100, Math.pow(2, bits - 1) - 1);
                return safeValue.toString();
            }
            return '-12345';
        }
        case 'address':
            return '0x' + '1'.repeat(40);
        case 'bool':
            return 'true';
        case 'string':
            return 'test string';
        case 'bytes':
            if (type === 'bytes') {
                return '0x1234';
            } else {
                const sizeMatch = type.match(/^bytes(\d+)$/);
                if (sizeMatch) {
                    const size = parseInt(sizeMatch[1]);
                    return '0x' + '1'.repeat(size * 2);
                }
            }
            return '0x1234';
        default:
            return 'test';
    }
}

// Unit tests

describe('ABI Parser - Unit Tests', () => {
    describe('extractConstructor', () => {
        it('should extract constructor from ABI with constructor', () => {
            const abi = [
                { type: 'function', name: 'transfer' },
                { type: 'constructor', inputs: [{ name: 'initialSupply', type: 'uint256' }] },
                { type: 'event', name: 'Transfer' }
            ];

            const constructor = extractConstructor(abi);
            expect(constructor).not.toBeNull();
            expect(constructor?.type).toBe('constructor');
            expect(constructor?.inputs.length).toBe(1);
        });

        it('should return null for ABI without constructor', () => {
            const abi = [
                { type: 'function', name: 'transfer' },
                { type: 'event', name: 'Transfer' }
            ];

            const constructor = extractConstructor(abi);
            expect(constructor).toBeNull();
        });

        it('should return null for empty ABI', () => {
            const constructor = extractConstructor([]);
            expect(constructor).toBeNull();
        });

        it('should return null for invalid input', () => {
            const constructor = extractConstructor(null as any);
            expect(constructor).toBeNull();
        });
    });

    describe('extractConstructorArguments', () => {
        it('should extract arguments with various types', () => {
            const abi = [
                {
                    type: 'constructor',
                    inputs: [
                        { name: 'owner', type: 'address' },
                        { name: 'supply', type: 'uint256' },
                        { name: 'name', type: 'string' },
                        { name: 'active', type: 'bool' }
                    ]
                }
            ];

            const args = extractConstructorArguments(abi);
            expect(args.length).toBe(4);
            expect(args[0]).toEqual({ name: 'owner', type: 'address', value: '' });
            expect(args[1]).toEqual({ name: 'supply', type: 'uint256', value: '' });
            expect(args[2]).toEqual({ name: 'name', type: 'string', value: '' });
            expect(args[3]).toEqual({ name: 'active', type: 'bool', value: '' });
        });

        it('should handle constructor with no arguments', () => {
            const abi = [
                { type: 'constructor', inputs: [] }
            ];

            const args = extractConstructorArguments(abi);
            expect(args.length).toBe(0);
        });

        it('should generate names for unnamed parameters', () => {
            const abi = [
                {
                    type: 'constructor',
                    inputs: [
                        { name: '', type: 'uint256' },
                        { name: '', type: 'address' }
                    ]
                }
            ];

            const args = extractConstructorArguments(abi);
            expect(args[0].name).toBe('arg0');
            expect(args[1].name).toBe('arg1');
        });

        it('should return empty array for ABI without constructor', () => {
            const abi = [
                { type: 'function', name: 'transfer' }
            ];

            const args = extractConstructorArguments(abi);
            expect(args.length).toBe(0);
        });
    });

    describe('validateConstructorArguments', () => {
        it('should validate uint256 arguments', () => {
            const abi = [
                { type: 'constructor', inputs: [{ name: 'value', type: 'uint256' }] }
            ];

            const validArgs = [{ name: 'value', type: 'uint256', value: '12345' }];
            const result = validateConstructorArguments(abi, validArgs);
            expect(result.valid).toBe(true);

            const negativeArgs = [{ name: 'value', type: 'uint256', value: '-123' }];
            const negativeResult = validateConstructorArguments(abi, negativeArgs);
            expect(negativeResult.valid).toBe(false);

            const invalidArgs = [{ name: 'value', type: 'uint256', value: 'abc' }];
            const invalidResult = validateConstructorArguments(abi, invalidArgs);
            expect(invalidResult.valid).toBe(false);
        });

        it('should validate address arguments', () => {
            const abi = [
                { type: 'constructor', inputs: [{ name: 'owner', type: 'address' }] }
            ];

            const validArgs = [{ name: 'owner', type: 'address', value: '0x' + '1'.repeat(40) }];
            const result = validateConstructorArguments(abi, validArgs);
            expect(result.valid).toBe(true);

            const invalidArgs = [{ name: 'owner', type: 'address', value: '0x123' }];
            const invalidResult = validateConstructorArguments(abi, invalidArgs);
            expect(invalidResult.valid).toBe(false);
        });

        it('should validate bool arguments', () => {
            const abi = [
                { type: 'constructor', inputs: [{ name: 'active', type: 'bool' }] }
            ];

            const trueArgs = [{ name: 'active', type: 'bool', value: 'true' }];
            const trueResult = validateConstructorArguments(abi, trueArgs);
            expect(trueResult.valid).toBe(true);

            const falseArgs = [{ name: 'active', type: 'bool', value: 'false' }];
            const falseResult = validateConstructorArguments(abi, falseArgs);
            expect(falseResult.valid).toBe(true);

            const invalidArgs = [{ name: 'active', type: 'bool', value: '1' }];
            const invalidResult = validateConstructorArguments(abi, invalidArgs);
            expect(invalidResult.valid).toBe(false);
        });

        it('should validate string arguments', () => {
            const abi = [
                { type: 'constructor', inputs: [{ name: 'name', type: 'string' }] }
            ];

            const validArgs = [{ name: 'name', type: 'string', value: 'MyToken' }];
            const result = validateConstructorArguments(abi, validArgs);
            expect(result.valid).toBe(true);

            const emptyArgs = [{ name: 'name', type: 'string', value: '' }];
            const emptyResult = validateConstructorArguments(abi, emptyArgs);
            expect(emptyResult.valid).toBe(false);
        });

        it('should validate bytes32 arguments', () => {
            const abi = [
                { type: 'constructor', inputs: [{ name: 'hash', type: 'bytes32' }] }
            ];

            const validArgs = [{ name: 'hash', type: 'bytes32', value: '0x' + '1'.repeat(64) }];
            const result = validateConstructorArguments(abi, validArgs);
            expect(result.valid).toBe(true);

            const wrongSizeArgs = [{ name: 'hash', type: 'bytes32', value: '0x1234' }];
            const wrongSizeResult = validateConstructorArguments(abi, wrongSizeArgs);
            expect(wrongSizeResult.valid).toBe(false);
        });

        it('should validate dynamic bytes arguments', () => {
            const abi = [
                { type: 'constructor', inputs: [{ name: 'data', type: 'bytes' }] }
            ];

            const validArgs = [{ name: 'data', type: 'bytes', value: '0x1234abcd' }];
            const result = validateConstructorArguments(abi, validArgs);
            expect(result.valid).toBe(true);

            const invalidArgs = [{ name: 'data', type: 'bytes', value: 'notHex' }];
            const invalidResult = validateConstructorArguments(abi, invalidArgs);
            expect(invalidResult.valid).toBe(false);
        });

        it('should reject empty values', () => {
            const abi = [
                { type: 'constructor', inputs: [{ name: 'value', type: 'uint256' }] }
            ];

            const emptyArgs = [{ name: 'value', type: 'uint256', value: '' }];
            const result = validateConstructorArguments(abi, emptyArgs);
            expect(result.valid).toBe(false);
        });

        it('should reject wrong number of arguments', () => {
            const abi = [
                {
                    type: 'constructor',
                    inputs: [
                        { name: 'a', type: 'uint256' },
                        { name: 'b', type: 'uint256' }
                    ]
                }
            ];

            const tooFewArgs = [{ name: 'a', type: 'uint256', value: '123' }];
            const tooFewResult = validateConstructorArguments(abi, tooFewArgs);
            expect(tooFewResult.valid).toBe(false);

            const tooManyArgs = [
                { name: 'a', type: 'uint256', value: '123' },
                { name: 'b', type: 'uint256', value: '456' },
                { name: 'c', type: 'uint256', value: '789' }
            ];
            const tooManyResult = validateConstructorArguments(abi, tooManyArgs);
            expect(tooManyResult.valid).toBe(false);
        });

        it('should accept empty args for no constructor', () => {
            const abi = [
                { type: 'function', name: 'transfer' }
            ];

            const result = validateConstructorArguments(abi, []);
            expect(result.valid).toBe(true);
        });

        it('should reject args when no constructor exists', () => {
            const abi = [
                { type: 'function', name: 'transfer' }
            ];

            const args = [{ name: 'value', type: 'uint256', value: '123' }];
            const result = validateConstructorArguments(abi, args);
            expect(result.valid).toBe(false);
        });
    });

    describe('convertArgumentValues', () => {
        it('should convert bool values', () => {
            const args = [
                { name: 'active', type: 'bool', value: 'true' },
                { name: 'inactive', type: 'bool', value: 'false' }
            ];

            const converted = convertArgumentValues(args);
            expect(converted[0]).toBe(true);
            expect(converted[1]).toBe(false);
        });

        it('should keep numeric strings as strings', () => {
            const args = [
                { name: 'value', type: 'uint256', value: '12345' }
            ];

            const converted = convertArgumentValues(args);
            expect(converted[0]).toBe('12345');
        });

        it('should keep address values as strings', () => {
            const args = [
                { name: 'owner', type: 'address', value: '0x' + '1'.repeat(40) }
            ];

            const converted = convertArgumentValues(args);
            expect(converted[0]).toBe('0x' + '1'.repeat(40));
        });

        it('should keep string values as strings', () => {
            const args = [
                { name: 'name', type: 'string', value: 'MyToken' }
            ];

            const converted = convertArgumentValues(args);
            expect(converted[0]).toBe('MyToken');
        });

        it('should parse array values', () => {
            const args = [
                { name: 'values', type: 'uint256[]', value: '[1, 2, 3]' }
            ];

            const converted = convertArgumentValues(args);
            expect(converted[0]).toEqual([1, 2, 3]);
        });
    });
});
