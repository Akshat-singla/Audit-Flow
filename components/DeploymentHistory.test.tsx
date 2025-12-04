import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { storageManager } from '@/lib/storageManager';
import type { DeploymentHistoryEntry, Network } from '@/lib/types';

const networkIdGen = () => fc.oneof(
    fc.constant('sepolia'),
    fc.constant('holesky'),
    fc.uuid()
);

const deploymentEntryGen = (): fc.Arbitrary<DeploymentHistoryEntry> =>
    fc.record({
        id: fc.uuid(),
        projectId: fc.uuid(),
        projectName: fc.string({ minLength: 1, maxLength: 50 }),
        networkId: networkIdGen(),
        networkName: fc.oneof(
            fc.constant('Sepolia'),
            fc.constant('Holesky'),
            fc.string({ minLength: 1, maxLength: 30 })
        ),
        contractAddress: fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => '0x' + s),
        transactionHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => '0x' + s),
        abi: fc.array(fc.record({
            name: fc.string(),
            type: fc.string(),
            inputs: fc.option(fc.array(fc.record({
                name: fc.string(),
                type: fc.string(),
            })), { nil: null }),
        })),
        bytecode: fc.hexaString({ minLength: 10, maxLength: 1000 }).map(s => '0x' + s),
        timestamp: fc.integer({ min: 1600000000000, max: Date.now() }),
    });

describe('DeploymentHistory Property Tests', () => {
    beforeEach(() => {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    it('Property 17: For any successful deployment, a history entry should be saved to local storage containing all required fields', () => {
        fc.assert(
            fc.property(deploymentEntryGen(), (entry) => {
                storageManager.saveDeployment(entry);

                const retrieved = storageManager.getDeployment(entry.id);

                expect(retrieved).not.toBeNull();
                expect(retrieved?.id).toBe(entry.id);
                expect(retrieved?.projectId).toBe(entry.projectId);
                expect(retrieved?.projectName).toBe(entry.projectName);
                expect(retrieved?.networkId).toBe(entry.networkId);
                expect(retrieved?.networkName).toBe(entry.networkName);
                expect(retrieved?.contractAddress).toBe(entry.contractAddress);
                expect(retrieved?.transactionHash).toBe(entry.transactionHash);
                expect(retrieved?.abi).toEqual(entry.abi);
                expect(retrieved?.bytecode).toBe(entry.bytecode);
                expect(retrieved?.timestamp).toBe(entry.timestamp);
            }),
            { numRuns: 100 }
        );
    });

    it('Property 18: For any set of saved deployment history entries, viewing the history should display all entries with their complete information', () => {
        fc.assert(
            fc.property(
                fc.array(deploymentEntryGen(), { minLength: 1, maxLength: 20 }),
                (entries) => {
                    entries.forEach(entry => storageManager.saveDeployment(entry));

                    const history = storageManager.getDeploymentHistory();

                    expect(history.length).toBeGreaterThanOrEqual(entries.length);

                    entries.forEach(entry => {
                        const found = history.find(h => h.id === entry.id);
                        expect(found).toBeDefined();
                        expect(found?.projectName).toBe(entry.projectName);
                        expect(found?.networkName).toBe(entry.networkName);
                        expect(found?.contractAddress).toBe(entry.contractAddress);
                        expect(found?.transactionHash).toBe(entry.transactionHash);
                        expect(found?.abi).toEqual(entry.abi);
                        expect(found?.bytecode).toBe(entry.bytecode);
                        expect(found?.timestamp).toBe(entry.timestamp);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 19: For any network filter selection, the displayed deployment history should contain only entries where the deployment network matches the selected filter', () => {
        fc.assert(
            fc.property(
                fc.array(deploymentEntryGen(), { minLength: 5, maxLength: 30 }),
                networkIdGen(),
                (entries, filterNetworkId) => {
                    entries.forEach(entry => storageManager.saveDeployment(entry));

                    const allHistory = storageManager.getDeploymentHistory();

                    const filteredHistory = allHistory.filter(
                        entry => entry.networkId === filterNetworkId
                    );

                    filteredHistory.forEach(entry => {
                        expect(entry.networkId).toBe(filterNetworkId);
                    });

                    const entriesWithDifferentNetwork = allHistory.filter(
                        entry => entry.networkId !== filterNetworkId
                    );
                    entriesWithDifferentNetwork.forEach(entry => {
                        expect(filteredHistory.find(h => h.id === entry.id)).toBeUndefined();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
