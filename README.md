# Smart Contract Deployer

A Next.js dApp for deploying Solidity smart contracts to EVM-compatible networks with optional AI-powered security analysis.

## Features

- 🔐 MetaMask wallet integration
- 📝 In-browser Solidity compilation
- 🤖 Optional AI security analysis
- 🌐 Multi-network support (Sepolia, Holesky, custom networks)
- 📊 Deployment history tracking
- 💾 Local storage persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- (Optional) Ollama for local AI analysis

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and configure (optional):

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Project Structure

```
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # Utility functions and managers
└── public/          # Static assets
```

### Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Blockchain**: ethers.js v6
- **Compiler**: solc-js
- **Testing**: Vitest + fast-check (property-based testing)

## License

MIT
