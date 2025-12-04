import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Analysis API - Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Set default environment variables
        process.env.AI_SERVICE = 'ollama';
        process.env.OLLAMA_URL = 'http://localhost:11434';
        process.env.OLLAMA_MODEL = 'llama2';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should return 400 when contract code is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Contract code is required');
    });

    test('should return 400 when contract code is not a string', async () => {
        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ contractCode: 123 }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Contract code is required');
    });

    test('should successfully analyze contract with Ollama', async () => {
        const sampleContract = `
            pragma solidity ^0.8.0;
            contract SimpleStorage {
                uint256 value;
                function setValue(uint256 _value) public {
                    value = _value;
                }
            }
        `;

        const mockAIResponse = {
            response: JSON.stringify({
                summary: 'This is a simple storage contract with basic functionality.',
                vulnerabilities: [
                    {
                        severity: 'low',
                        title: 'Missing access control',
                        description: 'The setValue function can be called by anyone.',
                    },
                ],
                recommendations: [
                    'Add access control to setValue function',
                    'Consider adding events for state changes',
                ],
            }),
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAIResponse,
        });

        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ contractCode: sampleContract }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analysis).toBeDefined();
        expect(data.analysis.summary).toBeDefined();
        expect(Array.isArray(data.analysis.vulnerabilities)).toBe(true);
        expect(Array.isArray(data.analysis.recommendations)).toBe(true);
    });

    test('should handle AI service unavailable error', async () => {
        const sampleContract = `
            pragma solidity ^0.8.0;
            contract Test {}
        `;

        mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ contractCode: sampleContract }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
    });

    test('should parse AI response correctly', async () => {
        const sampleContract = `
            pragma solidity ^0.8.0;
            contract Token {
                mapping(address => uint256) public balances;
            }
        `;

        const mockAIResponse = {
            response: `Here is the analysis: {
                "summary": "Token contract with basic balance tracking",
                "vulnerabilities": [
                    {
                        "severity": "high",
                        "title": "No transfer function",
                        "description": "Contract lacks transfer functionality"
                    }
                ],
                "recommendations": ["Add transfer function", "Add events"]
            }`,
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAIResponse,
        });

        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ contractCode: sampleContract }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analysis.summary).toBe('Token contract with basic balance tracking');
        expect(data.analysis.vulnerabilities).toHaveLength(1);
        expect(data.analysis.vulnerabilities[0].severity).toBe('high');
        expect(data.analysis.recommendations).toHaveLength(2);
    });

    test('should handle malformed AI response gracefully', async () => {
        const sampleContract = `
            pragma solidity ^0.8.0;
            contract Test {}
        `;

        const mockAIResponse = {
            response: 'This is not valid JSON at all',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAIResponse,
        });

        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ contractCode: sampleContract }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analysis).toBeDefined();
        // Should return default analysis when parsing fails
        expect(data.analysis.summary).toContain('Unable to parse');
        expect(Array.isArray(data.analysis.vulnerabilities)).toBe(true);
        expect(Array.isArray(data.analysis.recommendations)).toBe(true);
    });

    test('should work with Hugging Face API', async () => {
        process.env.AI_SERVICE = 'huggingface';
        process.env.HUGGINGFACE_API_TOKEN = 'test-token';
        process.env.HUGGINGFACE_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

        const sampleContract = `
            pragma solidity ^0.8.0;
            contract Test {}
        `;

        const mockAIResponse = [
            {
                generated_text: JSON.stringify({
                    summary: 'Simple test contract',
                    vulnerabilities: [],
                    recommendations: ['Add functionality'],
                }),
            },
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAIResponse,
        });

        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ contractCode: sampleContract }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.analysis).toBeDefined();
    });

    test('should handle Hugging Face API error', async () => {
        process.env.AI_SERVICE = 'huggingface';
        process.env.HUGGINGFACE_API_TOKEN = 'test-token';

        const sampleContract = `
            pragma solidity ^0.8.0;
            contract Test {}
        `;

        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 503,
            text: async () => 'Service unavailable',
        });

        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ contractCode: sampleContract }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Hugging Face API error');
    });

    test('should return error when HUGGINGFACE_API_TOKEN is missing', async () => {
        process.env.AI_SERVICE = 'huggingface';
        delete process.env.HUGGINGFACE_API_TOKEN;

        const sampleContract = `
            pragma solidity ^0.8.0;
            contract Test {}
        `;

        const request = new NextRequest('http://localhost:3000/api/analyze', {
            method: 'POST',
            body: JSON.stringify({ contractCode: sampleContract }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain('HUGGINGFACE_API_TOKEN');
    });
});
