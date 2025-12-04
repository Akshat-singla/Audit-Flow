import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { storageManager } from './storageManager';
import type { Project, Network, DeploymentHistoryEntry } from './types';

// Mock localStorage for testing
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

// Setup localStorage mock
beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
});

// ==================== Generators ====================

const networkGenerator = (): fc.Arbitrary<Network> => {
    return fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        chainId: fc.integer({ min: 1, max: 1000000 }),
        rpcUrl: fc.webUrl(),
        explorerUrl: fc.webUrl(),
        currencySymbol: fc.string({ minLength: 1, maxLength: 10 }),
        isCustom: fc.boolean(),
    });
};

const projectGenerator = (): fc.Arbitrary<Project> => {
    return fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }),
        description: fc.string({ maxLength: 500 }),
        contractCode: fc.string({ maxLength: 5000 }),
        createdAt: fc.integer({ min: 0, max: Date.now() }),
        updatedAt: fc.integer({ min: 0, max: Date.now() }),
    });
};

const deploymentHistoryEntryGenerator = (): fc.Arbitrary<DeploymentHistoryEntry> => {
    // Create a JSON-safe object generator (no undefined values)
    const jsonSafeObject = fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null)
        )
    );

    return fc.record({
        id: fc.uuid(),
        projectId: fc.uuid(),
        projectName: fc.string({ minLength: 1, maxLength: 100 }),
        networkId: fc.uuid(),
        networkName: fc.string({ minLength: 1, maxLength: 50 }),
        contractAddress: fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => '0x' + s),
        transactionHash: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => '0x' + s),
        abi: fc.array(jsonSafeObject, { maxLength: 5 }),
        bytecode: fc.hexaString({ minLength: 10, maxLength: 1000 }).map(s => '0x' + s),
        timestamp: fc.integer({ min: 0, max: Date.now() }),
    });
};

// ==================== Property Tests ====================

describe('Storage Manager - Property Tests', () => {
    describe('Property 1: Network persistence round-trip', () => {
        // Feature: smart-contract-deployer, Property 1: Network persistence round-trip
        it('should persist and retrieve networks with all fields intact', () => {
            fc.assert(
                fc.property(networkGenerator(), (network) => {
                    // Save network
                    storageManager.saveNetwork(network);

                    // Retrieve networks
                    const retrieved = storageManager.getNetworks().find(n => n.id === network.id);

                    // Verify all fields match
                    expect(retrieved).toEqual(network);
                }),
                { numRuns: 100 }
            );
        });

        // Feature: smart-contract-deployer, Property 1: Network persistence round-trip
        it('should persist multiple networks and retrieve all with fields intact', () => {
            fc.assert(
                fc.property(fc.array(networkGenerator(), { minLength: 1, maxLength: 10 }), (networks) => {
                    // Clear storage first
                    localStorageMock.clear();

                    // Save all networks
                    networks.forEach(network => storageManager.saveNetwork(network));

                    // Retrieve all networks
                    const retrieved = storageManager.getNetworks();

                    // Verify count matches
                    expect(retrieved.length).toBe(networks.length);

                    // Verify each network is present with all fields intact
                    networks.forEach(network => {
                        const found = retrieved.find(n => n.id === network.id);
                        expect(found).toEqual(network);
                    });
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 6: Project persistence round-trip', () => {
        // Feature: smart-contract-deployer, Property 6: Project persistence round-trip
        it('should persist and retrieve projects with all fields intact', () => {
            fc.assert(
                fc.property(projectGenerator(), (project) => {
                    // Save project
                    storageManager.saveProject(project);

                    // Retrieve project
                    const retrieved = storageManager.getProjects().find(p => p.id === project.id);

                    // Verify all fields match
                    expect(retrieved).toEqual(project);
                }),
                { numRuns: 100 }
            );
        });

        // Feature: smart-contract-deployer, Property 6: Project persistence round-trip
        it('should persist multiple projects and retrieve all with fields intact', () => {
            fc.assert(
                fc.property(fc.array(projectGenerator(), { minLength: 1, maxLength: 10 }), (projects) => {
                    // Clear storage first
                    localStorageMock.clear();

                    // Save all projects
                    projects.forEach(project => storageManager.saveProject(project));

                    // Retrieve all projects
                    const retrieved = storageManager.getProjects();

                    // Verify count matches
                    expect(retrieved.length).toBe(projects.length);

                    // Verify each project is present with all fields intact
                    projects.forEach(project => {
                        const found = retrieved.find(p => p.id === project.id);
                        expect(found).toEqual(project);
                    });
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 23: Application state restoration', () => {
        // Feature: smart-contract-deployer, Property 23: Application state restoration
        it('should restore all networks, projects, and deployment history after reload', () => {
            fc.assert(
                fc.property(
                    fc.array(networkGenerator(), { minLength: 1, maxLength: 5 }),
                    fc.array(projectGenerator(), { minLength: 1, maxLength: 5 }),
                    fc.array(deploymentHistoryEntryGenerator(), { minLength: 1, maxLength: 5 }),
                    (networks, projects, deployments) => {
                        // Clear storage first
                        localStorageMock.clear();

                        // Save all data
                        networks.forEach(network => storageManager.saveNetwork(network));
                        projects.forEach(project => storageManager.saveProject(project));
                        deployments.forEach(deployment => storageManager.saveDeployment(deployment));

                        // Simulate reload by retrieving all data
                        const retrievedNetworks = storageManager.getNetworks();
                        const retrievedProjects = storageManager.getProjects();
                        const retrievedDeployments = storageManager.getDeploymentHistory();

                        // Verify all data is restored
                        expect(retrievedNetworks.length).toBe(networks.length);
                        expect(retrievedProjects.length).toBe(projects.length);
                        expect(retrievedDeployments.length).toBe(deployments.length);

                        // Verify each item is present with all fields intact
                        networks.forEach(network => {
                            const found = retrievedNetworks.find(n => n.id === network.id);
                            expect(found).toEqual(network);
                        });

                        projects.forEach(project => {
                            const found = retrievedProjects.find(p => p.id === project.id);
                            expect(found).toEqual(project);
                        });

                        deployments.forEach(deployment => {
                            const found = retrievedDeployments.find(d => d.id === deployment.id);
                            expect(found).toEqual(deployment);
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

describe('Property 7: Project deletion completeness', () => {
    // Feature: smart-contract-deployer, Property 7: Project deletion completeness
    it('should delete project and all associated deployment history', () => {
        fc.assert(
            fc.property(
                projectGenerator(),
                fc.array(deploymentHistoryEntryGenerator(), { minLength: 1, maxLength: 10 }),
                (project, deployments) => {
                    // Clear storage first
                    localStorageMock.clear();

                    // Save project
                    storageManager.saveProject(project);

                    // Create deployments associated with this project
                    const projectDeployments = deployments.map(d => ({
                        ...d,
                        projectId: project.id,
                        projectName: project.name,
                    }));

                    // Save all deployments
                    projectDeployments.forEach(deployment => storageManager.saveDeployment(deployment));

                    // Verify project and deployments exist
                    expect(storageManager.getProject(project.id)).toEqual(project);
                    expect(storageManager.getDeploymentHistory().length).toBe(projectDeployments.length);

                    // Delete project
                    storageManager.deleteProject(project.id);

                    // Verify project is deleted
                    expect(storageManager.getProject(project.id)).toBeNull();

                    // Verify all associated deployments are deleted
                    const remainingDeployments = storageManager.getDeploymentHistory();
                    const projectDeploymentsRemaining = remainingDeployments.filter(
                        d => d.projectId === project.id
                    );
                    expect(projectDeploymentsRemaining.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: smart-contract-deployer, Property 7: Project deletion completeness
    it('should only delete specified project and its deployments, not others', () => {
        fc.assert(
            fc.property(
                fc.array(projectGenerator(), { minLength: 2, maxLength: 5 }),
                fc.array(deploymentHistoryEntryGenerator(), { minLength: 2, maxLength: 10 }),
                (projects, deployments) => {
                    // Clear storage first
                    localStorageMock.clear();

                    // Save all projects
                    projects.forEach(project => storageManager.saveProject(project));

                    // Distribute deployments across projects
                    const projectDeployments = deployments.map((d, index) => ({
                        ...d,
                        projectId: projects[index % projects.length].id,
                        projectName: projects[index % projects.length].name,
                    }));

                    // Save all deployments
                    projectDeployments.forEach(deployment => storageManager.saveDeployment(deployment));

                    // Delete first project
                    const projectToDelete = projects[0];
                    storageManager.deleteProject(projectToDelete.id);

                    // Verify deleted project is gone
                    expect(storageManager.getProject(projectToDelete.id)).toBeNull();

                    // Verify other projects still exist
                    projects.slice(1).forEach(project => {
                        expect(storageManager.getProject(project.id)).toEqual(project);
                    });

                    // Verify only deployments for deleted project are gone
                    const remainingDeployments = storageManager.getDeploymentHistory();
                    remainingDeployments.forEach(deployment => {
                        expect(deployment.projectId).not.toBe(projectToDelete.id);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 20: History entry deletion', () => {
    // Feature: smart-contract-deployer, Property 20: History entry deletion
    it('should delete single deployment history entry', () => {
        fc.assert(
            fc.property(
                fc.array(deploymentHistoryEntryGenerator(), { minLength: 1, maxLength: 10 }),
                (deployments) => {
                    // Clear storage first
                    localStorageMock.clear();

                    // Save all deployments
                    deployments.forEach(deployment => storageManager.saveDeployment(deployment));

                    // Verify all deployments exist
                    expect(storageManager.getDeploymentHistory().length).toBe(deployments.length);

                    // Delete first deployment
                    const deploymentToDelete = deployments[0];
                    storageManager.deleteDeployment(deploymentToDelete.id);

                    // Verify deployment is deleted
                    expect(storageManager.getDeployment(deploymentToDelete.id)).toBeNull();

                    // Verify other deployments still exist
                    const remainingDeployments = storageManager.getDeploymentHistory();
                    expect(remainingDeployments.length).toBe(deployments.length - 1);

                    // Verify deleted deployment is not in the list
                    const deletedDeployment = remainingDeployments.find(d => d.id === deploymentToDelete.id);
                    expect(deletedDeployment).toBeUndefined();
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: smart-contract-deployer, Property 20: History entry deletion
    it('should only delete specified deployment, not others', () => {
        fc.assert(
            fc.property(
                fc.array(deploymentHistoryEntryGenerator(), { minLength: 2, maxLength: 10 }),
                (deployments) => {
                    // Clear storage first
                    localStorageMock.clear();

                    // Save all deployments
                    deployments.forEach(deployment => storageManager.saveDeployment(deployment));

                    // Delete first deployment
                    const deploymentToDelete = deployments[0];
                    storageManager.deleteDeployment(deploymentToDelete.id);

                    // Verify other deployments still exist with all fields intact
                    deployments.slice(1).forEach(deployment => {
                        const found = storageManager.getDeployment(deployment.id);
                        expect(found).toEqual(deployment);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Property 24: Selective history clearing', () => {
    // Feature: smart-contract-deployer, Property 24: Selective history clearing
    it('should clear all deployment history while preserving networks and projects', () => {
        fc.assert(
            fc.property(
                fc.array(networkGenerator(), { minLength: 1, maxLength: 5 }),
                fc.array(projectGenerator(), { minLength: 1, maxLength: 5 }),
                fc.array(deploymentHistoryEntryGenerator(), { minLength: 1, maxLength: 10 }),
                (networks, projects, deployments) => {
                    // Clear storage first
                    localStorageMock.clear();

                    // Save all data
                    networks.forEach(network => storageManager.saveNetwork(network));
                    projects.forEach(project => storageManager.saveProject(project));
                    deployments.forEach(deployment => storageManager.saveDeployment(deployment));

                    // Verify all data exists
                    expect(storageManager.getNetworks().length).toBe(networks.length);
                    expect(storageManager.getProjects().length).toBe(projects.length);
                    expect(storageManager.getDeploymentHistory().length).toBe(deployments.length);

                    // Clear all deployment history
                    storageManager.clearAllDeployments();

                    // Verify deployment history is empty
                    expect(storageManager.getDeploymentHistory().length).toBe(0);

                    // Verify networks are preserved
                    const retrievedNetworks = storageManager.getNetworks();
                    expect(retrievedNetworks.length).toBe(networks.length);
                    networks.forEach(network => {
                        const found = retrievedNetworks.find(n => n.id === network.id);
                        expect(found).toEqual(network);
                    });

                    // Verify projects are preserved
                    const retrievedProjects = storageManager.getProjects();
                    expect(retrievedProjects.length).toBe(projects.length);
                    projects.forEach(project => {
                        const found = retrievedProjects.find(p => p.id === project.id);
                        expect(found).toEqual(project);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
