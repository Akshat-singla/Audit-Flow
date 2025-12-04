// Download utilities for ABI and bytecode files

export interface DownloadMetadata {
    contractName: string;
    network: string;
    timestamp: number;
}

export interface ABIDownloadData {
    abi: any[];
    metadata: DownloadMetadata;
}

export interface BytecodeDownloadData {
    bytecode: string;
    metadata: DownloadMetadata;
}

/**
 * Generate JSON file content from ABI with metadata
 */
export function generateABIFile(
    abi: any[],
    contractName: string,
    network: string,
    timestamp: number = Date.now()
): string {
    const data: ABIDownloadData = {
        abi,
        metadata: {
            contractName,
            network,
            timestamp,
        },
    };
    return JSON.stringify(data, null, 2);
}

/**
 * Generate JSON file content from bytecode with metadata
 */
export function generateBytecodeFile(
    bytecode: string,
    contractName: string,
    network: string,
    timestamp: number = Date.now()
): string {
    const data: BytecodeDownloadData = {
        bytecode,
        metadata: {
            contractName,
            network,
            timestamp,
        },
    };
    return JSON.stringify(data, null, 2);
}

/**
 * Trigger browser download of a file
 */
export function triggerDownload(
    content: string,
    filename: string,
    mimeType: string = 'application/json'
): void {
    // Create a blob from the content
    const blob = new Blob([content], { type: mimeType });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Release the blob URL
    URL.revokeObjectURL(url);
}

/**
 * Download ABI as JSON file
 */
export function downloadABI(
    abi: any[],
    contractName: string,
    network: string,
    timestamp: number = Date.now()
): void {
    const content = generateABIFile(abi, contractName, network, timestamp);
    const filename = `${contractName}_${network}_abi.json`;
    triggerDownload(content, filename);
}

/**
 * Download bytecode as JSON file
 */
export function downloadBytecode(
    bytecode: string,
    contractName: string,
    network: string,
    timestamp: number = Date.now()
): void {
    const content = generateBytecodeFile(bytecode, contractName, network, timestamp);
    const filename = `${contractName}_${network}_bytecode.json`;
    triggerDownload(content, filename);
}
