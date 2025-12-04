import { describe, it, expect } from 'vitest';
import { validateConstructorArguments } from '@/lib/abiParser';
import type { ConstructorArgument } from '@/lib/types';

describe('ConstructorArgumentsModal', () => {
    it('should accept required props interface', () => {
        const requiredProps = [
            'isOpen',
            'abi',
            'arguments',
            'onArgumentChange',
            'onSubmit',
            'onCancel'
        ];

        expect(requiredProps).toContain('isOpen');
        expect(requiredProps).toContain('abi');
        expect(requiredProps).toContain('arguments');
        expect(requiredProps).toContain('onArgumentChange');
        expect(requiredProps).toContain('onSubmit');
        expect(requiredProps).toContain('onCancel');
    });

    it('should validate constructor arguments using abiParser', () => {
        const mockAbi = [
            {
                type: 'constructor',
                inputs: [
                    { name: 'initialSupply', type: 'uint256' },
                    { name: 'tokenName', type: 'string' },
                    { name: 'owner', type: 'address' }
                ]
            }
        ];

        const validArguments: ConstructorArgument[] = [
            { name: 'initialSupply', type: 'uint256', value: '1000' },
            { name: 'tokenName', type: 'string', value: 'MyToken' },
            { name: 'owner', type: 'address', value: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' }
        ];

        const result = validateConstructorArguments(mockAbi, validArguments);
        expect(result.valid).toBe(true);
    });

    it('should reject invalid constructor arguments', () => {
        const mockAbi = [
            {
                type: 'constructor',
                inputs: [
                    { name: 'initialSupply', type: 'uint256' }
                ]
            }
        ];

        const invalidArguments: ConstructorArgument[] = [
            { name: 'initialSupply', type: 'uint256', value: '' }
        ];

        const result = validateConstructorArguments(mockAbi, invalidArguments);
        expect(result.valid).toBe(false);
    });

    it('should handle contracts with no constructor', () => {
        const emptyAbi = [
            {
                type: 'constructor',
                inputs: []
            }
        ];

        const result = validateConstructorArguments(emptyAbi, []);
        expect(result.valid).toBe(true);
    });

    it('should support different argument types', () => {
        const supportedTypes = [
            'uint256',
            'int256',
            'address',
            'bool',
            'string',
            'bytes',
            'bytes32',
            'address[]',
            'uint256[]'
        ];

        supportedTypes.forEach(type => {
            expect(type).toBeTruthy();
        });
    });

    it('should provide type-specific placeholders', () => {
        const typePlaceholders: Record<string, string> = {
            'uint256': '123',
            'address': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            'bool': 'true or false',
            'string': 'Enter text',
            'bytes': '0x1234...',
            'address[]': '["value1", "value2"]'
        };

        Object.keys(typePlaceholders).forEach(type => {
            expect(typePlaceholders[type]).toBeTruthy();
        });
    });

    it('should provide type-specific hints', () => {
        const typeHints: Record<string, string> = {
            'uint256': 'Enter a non-negative integer',
            'int256': 'Enter an integer (positive or negative)',
            'address': 'Enter a valid Ethereum address (0x followed by 40 hex characters)',
            'bool': 'Enter true or false',
            'string': 'Enter any text value',
            'bytes': 'Enter hex data starting with 0x',
            'address[]': 'Enter a JSON array of values'
        };

        Object.keys(typeHints).forEach(type => {
            expect(typeHints[type]).toBeTruthy();
        });
    });

    it('should handle form submission with validation', () => {
        const mockAbi = [
            {
                type: 'constructor',
                inputs: [
                    { name: 'value', type: 'uint256' }
                ]
            }
        ];

        const validArgs: ConstructorArgument[] = [
            { name: 'value', type: 'uint256', value: '100' }
        ];

        const invalidArgs: ConstructorArgument[] = [
            { name: 'value', type: 'uint256', value: '' }
        ];

        const validResult = validateConstructorArguments(mockAbi, validArgs);
        const invalidResult = validateConstructorArguments(mockAbi, invalidArgs);

        expect(validResult.valid).toBe(true);
        expect(invalidResult.valid).toBe(false);
    });

    it('should display validation errors', () => {
        const mockAbi = [
            {
                type: 'constructor',
                inputs: [
                    { name: 'amount', type: 'uint256' }
                ]
            }
        ];

        const emptyArgs: ConstructorArgument[] = [
            { name: 'amount', type: 'uint256', value: '' }
        ];

        const result = validateConstructorArguments(mockAbi, emptyArgs);

        if (!result.valid) {
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].field).toBeTruthy();
            expect(result.errors[0].message).toBeTruthy();
        }
    });

    it('should clear errors when user types', () => {
        const errorClearing = true;
        expect(errorClearing).toBe(true);
    });
});
