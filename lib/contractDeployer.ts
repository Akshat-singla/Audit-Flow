import { ethers } from 'ethers';
import type { Network, DeploymentResult } from './types';

/**
 * Configuration for contract deployment
 */
export interface DeploymentConfig {
    abi: any[];
    bytecode: string;
    constructorArgs: any[];
    network: Network;
}

/**
 * Validates that the wallet is connected to the correct network
 * @param provider The ethers provider
 * @param network The target network
 * @throws Error if network validation fails
 */
export async function ensureNetwork(
    provider: ethers.BrowserProvider,
    network: Network
): Promise<void> {
    const currentNetwork = await provider.getNetwork();
    const currentChainId = Number(currentNetwork.chainId);

    if (currentChainId !== network.chainId) {
        throw new Error(
            `Network mismatch: wallet is connected to chain ${currentChainId} but deployment target is chain ${network.chainId}. Please switch networks in MetaMask.`
        );
    }
}

/**
 * Deploys a smart contract to the blockchain
 * @param config Deployment configuration including ABI, bytecode, constructor args, and network
 * @param signer The ethers signer to use for deployment
 * @returns DeploymentResult with contract address, transaction hash, and block number
 * @throws Error if deployment fails
 */
export async function deployContract(
    config: DeploymentConfig,
    signer: ethers.JsonRpcSigner
): Promise<DeploymentResult> {
    const { abi, bytecode, constructorArgs, network } = config;

    // Validate network before deployment
    const provider = signer.provider as ethers.BrowserProvider;
    await ensureNetwork(provider, network);

    try {
        // Create contract factory
        const factory = new ethers.ContractFactory(abi, bytecode, signer);

        // Deploy contract with constructor arguments
        const contract = await factory.deploy(...constructorArgs);

        // Wait for deployment transaction to be mined
        const deploymentReceipt = await contract.deploymentTransaction()?.wait();

        if (!deploymentReceipt) {
            throw new Error('Deployment transaction receipt not available');
        }

        // Extract contract address from the deployed contract
        const contractAddress = await contract.getAddress();

        return {
            contractAddress,
            transactionHash: deploymentReceipt.hash,
            blockNumber: deploymentReceipt.blockNumber,
        };
    } catch (error: any) {
        // Handle common deployment errors
        if (error.code === 'ACTION_REJECTED') {
            throw new Error('Transaction rejected by user');
        }
        if (error.code === 'INSUFFICIENT_FUNDS') {
            throw new Error('Insufficient funds for deployment');
        }
        if (error.code === 'NETWORK_ERROR') {
            throw new Error('Network error during deployment. Please check your connection.');
        }

        // Re-throw with original message if not a known error
        throw new Error(`Deployment failed: ${error.message || 'Unknown error'}`);
    }
}
