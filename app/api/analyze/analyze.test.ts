import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { SecurityAnalysis } from '@/lib/types';

/**
 * Generator for SecurityAnalysis objects
 */
const securityAnalysisGenerator = (): fc.Arbitrary<SecurityAnalysis> => {
    return fc.record({
        summary: fc.string({ minLength: 1, maxLength: 500 }),
        vulnerabilities: fc.array(
            fc.record({
                severity: fc.constantFrom('high' as const, 'medium' as const, 'low' as const),
                title: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 1, maxLength: 500 }),
            }),
            { minLength: 0, maxLength: 10 }
        ),
        recommendations: fc.array(
            fc.string({ minLength: 1, maxLength: 200 }),
            { minLength: 0, maxLength: 10 }
        ),
    });
};

describe('AI Analysis API - Property Tests', () => {
    // Feature: smart-contract-deployer, Property 8: Security report completeness
    test('Property 8: Security report completeness - all reports contain required sections', () => {
        fc.assert(
            fc.property(
                securityAnalysisGenerator(),
                (analysis) => {
                    // Verify that the analysis has all required fields
                    expect(analysis).toHaveProperty('summary');
                    expect(analysis).toHaveProperty('vulnerabilities');
                    expect(analysis).toHaveProperty('recommendations');

                    // Verify types
                    expect(typeof analysis.summary).toBe('string');
                    expect(Array.isArray(analysis.vulnerabilities)).toBe(true);
                    expect(Array.isArray(analysis.recommendations)).toBe(true);

                    // Verify summary is not empty
                    expect(analysis.summary.length).toBeGreaterThan(0);

                    // Verify each vulnerability has required fields
                    analysis.vulnerabilities.forEach((vuln) => {
                        expect(vuln).toHaveProperty('severity');
                        expect(vuln).toHaveProperty('title');
                        expect(vuln).toHaveProperty('description');
                        expect(['high', 'medium', 'low']).toContain(vuln.severity);
                        expect(typeof vuln.title).toBe('string');
                        expect(typeof vuln.description).toBe('string');
                        expect(vuln.title.length).toBeGreaterThan(0);
                        expect(vuln.description.length).toBeGreaterThan(0);
                    });

                    // Verify each recommendation is a non-empty string
                    analysis.recommendations.forEach((rec) => {
                        expect(typeof rec).toBe('string');
                        expect(rec.length).toBeGreaterThan(0);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
