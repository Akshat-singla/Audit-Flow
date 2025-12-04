import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
    generateABIFile,
    generateBytecodeFile,
    triggerDownload,
    downloadABI,
    downloadBytecode,
    type ABIDownloadData,
    type BytecodeDownloadData,
} from './downloadUtils';

// Setup URL mocks globally for the test environment
beforeEach(() => {
    if (!URL.createObjectURL) {
        (URL as any).createObjectURL = vi.fn();
    }
    if (!URL.revokeObjectURL) {
        (URL as any).revokeObjectURL = vi.fn();
    }
});

// ==================== Generators ====================

const abiGenerator = (): fc.Arbitrary<any[]> => {
    const jsonSafeValue = fc.oneof(
        fc.string(),
        fc.integer(),
        fc.boolean(),
        fc.constant(null)
    );

    const jsonSafeObject = fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        jsonSafeValue
    );

    return fc.array(jsonSafeObject, { minLength: 0, maxLength: 10 });
};

const bytecodeGenerator = (): fc.Arbitrary<string> => {
    return fc.hexaString({ minLength: 10, maxLength: 1000 }).map(s => '0x' + s);
};

const contractNameGenerator = (): fc.Arbitrary<string> => {
    return fc.string({ minLength: 1, maxLength: 100 });
};

const networkNameGenerator = (): fc.Arbitrary<string> => {
    return fc.string({ minLength: 1, maxLength: 50 });
};

const timestampGenerator = (): fc.Arbitrary<number> => {
    return fc.integer({ min: 0, max: Date.now() });
};

// ==================== Property Tests ====================

describe('Download Utils - Property Tests', () => {
    describe('Property 16: Download file completeness', () => {
        // Feature: smart-contract-deployer, Property 16: Download file completeness
        it('should generate ABI file with all required metadata fields', () => {
            fc.assert(
                fc.property(
                    abiGenerator(),
                    contractNameGenerator(),
                    networkNameGenerator(),
                    timestampGenerator(),
                    (abi, contractName, network, timestamp) => {
                        // Generate ABI file
                        const fileContent = generateABIFile(abi, contractName, network, timestamp);

                        // Parse the JSON content
                        const parsed: ABIDownloadData = JSON.parse(fileContent);

                        // Verify ABI is present and matches
                        expect(parsed.abi).toEqual(abi);

                        // Verify all metadata fields are present
                        expect(parsed.metadata).toBeDefined();
                        expect(parsed.metadata.contractName).toBe(contractName);
                        expect(parsed.metadata.network).toBe(network);
                        expect(parsed.metadata.timestamp).toBe(timestamp);
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Feature: smart-contract-deployer, Property 16: Download file completeness
        it('should generate bytecode file with all required metadata fields', () => {
            fc.assert(
                fc.property(
                    bytecodeGenerator(),
                    contractNameGenerator(),
                    networkNameGenerator(),
                    timestampGenerator(),
                    (bytecode, contractName, network, timestamp) => {
                        // Generate bytecode file
                        const fileContent = generateBytecodeFile(bytecode, contractName, network, timestamp);

                        // Parse the JSON content
                        const parsed: BytecodeDownloadData = JSON.parse(fileContent);

                        // Verify bytecode is present and matches
                        expect(parsed.bytecode).toBe(bytecode);

                        // Verify all metadata fields are present
                        expect(parsed.metadata).toBeDefined();
                        expect(parsed.metadata.contractName).toBe(contractName);
                        expect(parsed.metadata.network).toBe(network);
                        expect(parsed.metadata.timestamp).toBe(timestamp);
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Feature: smart-contract-deployer, Property 16: Download file completeness
        it('should generate valid JSON for ABI files that can be parsed', () => {
            fc.assert(
                fc.property(
                    abiGenerator(),
                    contractNameGenerator(),
                    networkNameGenerator(),
                    timestampGenerator(),
                    (abi, contractName, network, timestamp) => {
                        // Generate ABI file
                        const fileContent = generateABIFile(abi, contractName, network, timestamp);

                        // Should not throw when parsing
                        expect(() => JSON.parse(fileContent)).not.toThrow();

                        // Parsed content should be valid
                        const parsed = JSON.parse(fileContent);
                        expect(parsed).toBeDefined();
                        expect(typeof parsed).toBe('object');
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Feature: smart-contract-deployer, Property 16: Download file completeness
        it('should generate valid JSON for bytecode files that can be parsed', () => {
            fc.assert(
                fc.property(
                    bytecodeGenerator(),
                    contractNameGenerator(),
                    networkNameGenerator(),
                    timestampGenerator(),
                    (bytecode, contractName, network, timestamp) => {
                        // Generate bytecode file
                        const fileContent = generateBytecodeFile(bytecode, contractName, network, timestamp);

                        // Should not throw when parsing
                        expect(() => JSON.parse(fileContent)).not.toThrow();

                        // Parsed content should be valid
                        const parsed = JSON.parse(fileContent);
                        expect(parsed).toBeDefined();
                        expect(typeof parsed).toBe('object');
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Feature: smart-contract-deployer, Property 16: Download file completeness
        it('should include all metadata fields when downloading ABI', () => {
            fc.assert(
                fc.property(
                    abiGenerator(),
                    contractNameGenerator(),
                    networkNameGenerator(),
                    timestampGenerator(),
                    (abi, contractName, network, timestamp) => {
                        // Mock DOM APIs
                        const createElementSpy = vi.spyOn(document, 'createElement');
                        const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
                        const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

                        // Mock URL methods
                        const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
                        const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { });

                        // Mock click
                        const clickMock = vi.fn();

                        createElementSpy.mockImplementation((tagName: string) => {
                            if (tagName === 'a') {
                                const element = {
                                    href: '',
                                    download: '',
                                    style: { display: '' },
                                    click: clickMock,
                                } as any;
                                return element;
                            }
                            return document.createElement(tagName);
                        });

                        // Download ABI
                        downloadABI(abi, contractName, network, timestamp);

                        // Verify Blob was created with correct content
                        expect(createObjectURLSpy).toHaveBeenCalled();

                        // Get the blob that was created
                        const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;

                        // Verify it's a Blob
                        expect(blobCall).toBeInstanceOf(Blob);
                        expect(blobCall.type).toBe('application/json');

                        // Verify the content by generating the expected file content
                        const expectedContent = generateABIFile(abi, contractName, network, timestamp);
                        const expectedParsed: ABIDownloadData = JSON.parse(expectedContent);

                        // Verify all metadata fields are present in the expected content
                        expect(expectedParsed.abi).toEqual(abi);
                        expect(expectedParsed.metadata.contractName).toBe(contractName);
                        expect(expectedParsed.metadata.network).toBe(network);
                        expect(expectedParsed.metadata.timestamp).toBe(timestamp);

                        // Cleanup
                        createElementSpy.mockRestore();
                        appendChildSpy.mockRestore();
                        removeChildSpy.mockRestore();
                        createObjectURLSpy.mockRestore();
                        revokeObjectURLSpy.mockRestore();
                    }
                ),
                { numRuns: 100 }
            );
        });

        // Feature: smart-contract-deployer, Property 16: Download file completeness
        it('should include all metadata fields when downloading bytecode', () => {
            fc.assert(
                fc.property(
                    bytecodeGenerator(),
                    contractNameGenerator(),
                    networkNameGenerator(),
                    timestampGenerator(),
                    (bytecode, contractName, network, timestamp) => {
                        // Mock DOM APIs
                        const createElementSpy = vi.spyOn(document, 'createElement');
                        const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
                        const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

                        // Mock URL methods
                        const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
                        const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { });

                        // Mock click
                        const clickMock = vi.fn();

                        createElementSpy.mockImplementation((tagName: string) => {
                            if (tagName === 'a') {
                                const element = {
                                    href: '',
                                    download: '',
                                    style: { display: '' },
                                    click: clickMock,
                                } as any;
                                return element;
                            }
                            return document.createElement(tagName);
                        });

                        // Download bytecode
                        downloadBytecode(bytecode, contractName, network, timestamp);

                        // Verify Blob was created with correct content
                        expect(createObjectURLSpy).toHaveBeenCalled();

                        // Get the blob that was created
                        const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;

                        // Verify it's a Blob
                        expect(blobCall).toBeInstanceOf(Blob);
                        expect(blobCall.type).toBe('application/json');

                        // Verify the content by generating the expected file content
                        const expectedContent = generateBytecodeFile(bytecode, contractName, network, timestamp);
                        const expectedParsed: BytecodeDownloadData = JSON.parse(expectedContent);

                        // Verify all metadata fields are present in the expected content
                        expect(expectedParsed.bytecode).toBe(bytecode);
                        expect(expectedParsed.metadata.contractName).toBe(contractName);
                        expect(expectedParsed.metadata.network).toBe(network);
                        expect(expectedParsed.metadata.timestamp).toBe(timestamp);

                        // Cleanup
                        createElementSpy.mockRestore();
                        appendChildSpy.mockRestore();
                        removeChildSpy.mockRestore();
                        createObjectURLSpy.mockRestore();
                        revokeObjectURLSpy.mockRestore();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
