import { ConstructorArgument, ValidationResult, ValidationError } from './types';

/**
 * ABI fragment type for constructor
 */
export interface ABIConstructor {
    type: 'constructor';
    inputs: ABIInput[];
    stateMutability?: string;
}

/**
 * ABI input parameter
 */
export interface ABIInput {
    name: string;
    type: string;
    internalType?: string;
    components?: ABIInput[];
}

/**
 * Extracts the constructor from an ABI
 * Returns null if no constructor is found
 */
export function extractConstructor(abi: any[]): ABIConstructor | null {
    if (!Array.isArray(abi)) {
        return null;
    }

    const constructor = abi.find(item => item.type === 'constructor');
    return constructor || null;
}

/**
 * Extracts constructor arguments from an ABI
 * Returns an array of ConstructorArgument with name, type, and empty value
 */
export function extractConstructorArguments(abi: any[]): ConstructorArgument[] {
    const constructor = extractConstructor(abi);

    if (!constructor || !constructor.inputs) {
        return [];
    }

    return constructor.inputs.map((input, index) => ({
        name: input.name || `arg${index}`,
        type: input.type,
        value: ''
    }));
}

/**
 * Validates constructor arguments against ABI types
 */
export function validateConstructorArguments(
    abi: any[],
    args: ConstructorArgument[]
): ValidationResult {
    const errors: ValidationError[] = [];
    const constructor = extractConstructor(abi);

    // If no constructor, args should be empty
    if (!constructor || !constructor.inputs || constructor.inputs.length === 0) {
        if (args.length > 0) {
            errors.push({
                field: 'arguments',
                message: 'Contract has no constructor but arguments were provided'
            });
        }
        return errors.length > 0 ? { valid: false, errors } : { valid: true };
    }

    // Check argument count
    if (args.length !== constructor.inputs.length) {
        errors.push({
            field: 'arguments',
            message: `Expected ${constructor.inputs.length} arguments but got ${args.length}`
        });
        return { valid: false, errors };
    }

    // Validate each argument
    args.forEach((arg, index) => {
        const expectedInput = constructor.inputs[index];
        const validationError = validateArgumentType(arg.value, expectedInput.type, index);

        if (validationError) {
            errors.push(validationError);
        }
    });

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true };
}

/**
 * Validates a single argument value against its expected type
 */
function validateArgumentType(
    value: string,
    expectedType: string,
    index: number
): ValidationError | null {
    // Empty value is invalid
    if (value.trim().length === 0) {
        return {
            field: `argument[${index}]`,
            message: `Argument ${index} (${expectedType}) cannot be empty`
        };
    }

    // Handle array types
    if (expectedType.endsWith('[]')) {
        return validateArrayType(value, expectedType, index);
    }

    // Handle basic types
    const baseType = expectedType.replace(/\d+$/, ''); // Remove size suffix

    switch (baseType) {
        case 'uint':
        case 'int':
            return validateIntegerType(value, expectedType, index);

        case 'address':
            return validateAddressType(value, index);

        case 'bool':
            return validateBoolType(value, index);

        case 'string':
            return validateStringType(value, index);

        case 'bytes':
            return validateBytesType(value, expectedType, index);

        default:
            // For unknown types, just check it's not empty
            return null;
    }
}

/**
 * Validates integer types (uint, int with optional size)
 */
function validateIntegerType(
    value: string,
    type: string,
    index: number
): ValidationError | null {
    const trimmed = value.trim();

    // Check if it's a valid number
    if (!/^-?\d+$/.test(trimmed)) {
        return {
            field: `argument[${index}]`,
            message: `Argument ${index} (${type}) must be a valid integer`
        };
    }

    const num = BigInt(trimmed);

    // Check sign for uint types
    if (type.startsWith('uint') && num < 0n) {
        return {
            field: `argument[${index}]`,
            message: `Argument ${index} (${type}) must be non-negative`
        };
    }

    // Extract bit size if specified
    const sizeMatch = type.match(/\d+$/);
    if (sizeMatch) {
        const bits = parseInt(sizeMatch[0]);
        const maxValue = type.startsWith('uint')
            ? (2n ** BigInt(bits)) - 1n
            : (2n ** BigInt(bits - 1)) - 1n;
        const minValue = type.startsWith('uint')
            ? 0n
            : -(2n ** BigInt(bits - 1));

        if (num > maxValue || num < minValue) {
            return {
                field: `argument[${index}]`,
                message: `Argument ${index} (${type}) is out of range`
            };
        }
    }

    return null;
}

/**
 * Validates address type
 */
function validateAddressType(value: string, index: number): ValidationError | null {
    const trimmed = value.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        return {
            field: `argument[${index}]`,
            message: `Argument ${index} (address) must be a valid Ethereum address (0x followed by 40 hex characters)`
        };
    }

    return null;
}

/**
 * Validates bool type
 */
function validateBoolType(value: string, index: number): ValidationError | null {
    const trimmed = value.trim().toLowerCase();

    if (trimmed !== 'true' && trimmed !== 'false') {
        return {
            field: `argument[${index}]`,
            message: `Argument ${index} (bool) must be 'true' or 'false'`
        };
    }

    return null;
}

/**
 * Validates string type
 */
function validateStringType(value: string, index: number): ValidationError | null {
    // Strings are always valid as long as they're not empty (checked earlier)
    return null;
}

/**
 * Validates bytes type
 */
function validateBytesType(
    value: string,
    type: string,
    index: number
): ValidationError | null {
    const trimmed = value.trim();

    if (!/^0x[a-fA-F0-9]*$/.test(trimmed)) {
        return {
            field: `argument[${index}]`,
            message: `Argument ${index} (${type}) must be a valid hex string starting with 0x`
        };
    }

    // For fixed-size bytes (bytes1, bytes32, etc.), check length
    const sizeMatch = type.match(/^bytes(\d+)$/);
    if (sizeMatch) {
        const expectedBytes = parseInt(sizeMatch[1]);
        const actualBytes = (trimmed.length - 2) / 2; // Remove 0x and divide by 2

        if (actualBytes !== expectedBytes) {
            return {
                field: `argument[${index}]`,
                message: `Argument ${index} (${type}) must be exactly ${expectedBytes} bytes (${expectedBytes * 2} hex characters)`
            };
        }
    }

    return null;
}

/**
 * Validates array type
 */
function validateArrayType(
    value: string,
    type: string,
    index: number
): ValidationError | null {
    const trimmed = value.trim();

    // Try to parse as JSON array
    try {
        const parsed = JSON.parse(trimmed);

        if (!Array.isArray(parsed)) {
            return {
                field: `argument[${index}]`,
                message: `Argument ${index} (${type}) must be a valid JSON array`
            };
        }

        // Get the element type
        const elementType = type.slice(0, -2); // Remove []

        // Validate each element
        for (let i = 0; i < parsed.length; i++) {
            const elementValue = typeof parsed[i] === 'string'
                ? parsed[i]
                : JSON.stringify(parsed[i]);

            const elementError = validateArgumentType(elementValue, elementType, i);
            if (elementError) {
                return {
                    field: `argument[${index}]`,
                    message: `Argument ${index} (${type}): element ${i} is invalid - ${elementError.message}`
                };
            }
        }

        return null;
    } catch (e) {
        return {
            field: `argument[${index}]`,
            message: `Argument ${index} (${type}) must be a valid JSON array`
        };
    }
}

/**
 * Converts user input values to appropriate types for contract deployment
 */
export function convertArgumentValues(args: ConstructorArgument[]): any[] {
    return args.map(arg => {
        const trimmed = arg.value.trim();
        const type = arg.type;

        // Handle arrays
        if (type.endsWith('[]')) {
            try {
                return JSON.parse(trimmed);
            } catch {
                return trimmed;
            }
        }

        // Handle basic types
        const baseType = type.replace(/\d+$/, '');

        switch (baseType) {
            case 'uint':
            case 'int':
                return trimmed;

            case 'address':
                return trimmed;

            case 'bool':
                return trimmed.toLowerCase() === 'true';

            case 'string':
                return trimmed;

            case 'bytes':
                return trimmed;

            default:
                return trimmed;
        }
    });
}
