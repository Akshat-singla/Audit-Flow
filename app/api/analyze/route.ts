import { NextRequest, NextResponse } from 'next/server';
import { SecurityAnalysis } from '@/lib/types';

interface AnalyzeRequest {
    contractCode: string;
}

interface AnalyzeResponse {
    success: boolean;
    analysis?: SecurityAnalysis;
    error?: string;
}

/**
 * Create a prompt for AI security analysis
 */
function createSecurityAnalysisPrompt(contractCode: string): string {
    return `You are a Solidity smart contract security expert. Analyze the following smart contract for security vulnerabilities and provide recommendations.

Contract Code:
\`\`\`solidity
${contractCode}
\`\`\`

Please provide your analysis in the following JSON format:
{
  "summary": "A brief summary of the overall security posture",
  "vulnerabilities": [
    {
      "severity": "high|medium|low",
      "title": "Vulnerability name",
      "description": "Detailed description of the vulnerability"
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}

Focus on common vulnerabilities such as:
- Reentrancy attacks
- Integer overflow/underflow
- Access control issues
- Unchecked external calls
- Gas optimization issues
- Logic errors

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Parse AI response into SecurityAnalysis format
 */
function parseAIResponse(response: string): SecurityAnalysis {
    try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate the structure
        if (!parsed.summary || !Array.isArray(parsed.vulnerabilities) || !Array.isArray(parsed.recommendations)) {
            throw new Error('Invalid response structure');
        }

        // Ensure vulnerabilities have correct structure
        const vulnerabilities = parsed.vulnerabilities.map((v: any) => ({
            severity: ['high', 'medium', 'low'].includes(v.severity) ? v.severity : 'medium',
            title: v.title || 'Unknown vulnerability',
            description: v.description || 'No description provided',
        }));

        return {
            summary: parsed.summary,
            vulnerabilities,
            recommendations: parsed.recommendations.filter((r: any) => typeof r === 'string'),
        };
    } catch (error) {
        // Return a default analysis if parsing fails
        return {
            summary: 'Unable to parse AI response. Please review the contract manually.',
            vulnerabilities: [],
            recommendations: ['Review the contract code manually for security issues'],
        };
    }
}

/**
 * Call Hugging Face Inference API (free tier)
 */
async function callHuggingFaceAPI(prompt: string): Promise<string> {
    const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
    const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

    if (!HF_API_TOKEN) {
        throw new Error('HUGGINGFACE_API_TOKEN environment variable is not set');
    }

    const response = await fetch(
        `https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 1000,
                    temperature: 0.7,
                    return_full_text: false,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
    }

    throw new Error('Unexpected response format from Hugging Face API');
}

/**
 * Call Ollama local API
 */
async function callOllamaAPI(prompt: string): Promise<string> {
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
    const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.response) {
        return data.response;
    }

    throw new Error('Unexpected response format from Ollama API');
}

/**
 * Perform AI-powered security analysis
 */
async function analyzeContract(contractCode: string): Promise<SecurityAnalysis> {
    const prompt = createSecurityAnalysisPrompt(contractCode);
    const AI_SERVICE = process.env.AI_SERVICE || 'ollama';

    let aiResponse: string;

    try {
        if (AI_SERVICE === 'huggingface') {
            aiResponse = await callHuggingFaceAPI(prompt);
        } else if (AI_SERVICE === 'ollama') {
            aiResponse = await callOllamaAPI(prompt);
        } else {
            throw new Error(`Unknown AI service: ${AI_SERVICE}`);
        }

        return parseAIResponse(aiResponse);
    } catch (error) {
        console.error('AI analysis error:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: AnalyzeRequest = await request.json();
        const { contractCode } = body;

        if (!contractCode || typeof contractCode !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Contract code is required and must be a string',
                },
                { status: 400 }
            );
        }

        // Perform security analysis with timeout
        const timeoutMs = 30000; // 30 seconds
        const analysisPromise = analyzeContract(contractCode);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI analysis timeout')), timeoutMs)
        );

        const analysis = await Promise.race([analysisPromise, timeoutPromise]);

        return NextResponse.json({
            success: true,
            analysis,
        });
    } catch (error) {
        console.error('Analysis error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
