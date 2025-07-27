# Swap.Garden Monorepo

A monorepo containing all components of the Swap.Garden protocol.

## 📁 Project Structure

```
swap.garden/
├── packages/
│   ├── frontend/          # Next.js frontend application
│   ├── contracts/         # Solidity smart contracts
│   ├── relayer/          # Transaction relayer service
│   └── resolver/         # Price resolver service
├── package.json          # Root workspace configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Yarn package manager
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd swap.garden
```

2. Install dependencies for all packages:
```bash
yarn install
```

### Development

Start all services in development mode:

```bash
# Frontend (Next.js)
yarn dev

# Relayer service
yarn dev:relayer

# Resolver service  
yarn dev:resolver

# Compile contracts
yarn compile:contracts
```

## 📦 Packages

### Frontend (`packages/frontend`)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **TypeScript**: Full type safety
- **Port**: 3000 (default)

```bash
cd packages/frontend
yarn dev
```

### Contracts (`packages/contracts`)
- **Framework**: Hardhat
- **Solidity**: 0.8.19
- **Dependencies**: OpenZeppelin contracts
- **Testing**: Hardhat toolbox

```bash
cd packages/contracts
yarn compile
yarn test
yarn deploy
```

### Relayer (`packages/relayer`)
- **Framework**: Express.js with TypeScript
- **Purpose**: Transaction relaying and meta-transactions
- **Port**: 3001 (default)

```bash
cd packages/relayer
yarn dev
```

### Resolver (`packages/resolver`)
- **Framework**: Express.js with TypeScript  
- **Purpose**: Price resolution and DEX aggregation
- **Port**: 3002 (default)

```bash
cd packages/resolver
yarn dev
```

## 🛠 Available Scripts

From the root directory:

- `yarn dev` - Start frontend development server
- `yarn build` - Build all packages
- `yarn test` - Run tests across all packages
- `yarn lint` - Lint all packages
- `yarn compile:contracts` - Compile smart contracts
- `yarn dev:relayer` - Start relayer service
- `yarn dev:resolver` - Start resolver service

## 🔧 Configuration

Each package has its own configuration files:

- **Frontend**: `next.config.ts`, `tailwind.config.js`, `tsconfig.json`
- **Contracts**: `hardhat.config.ts`, `tsconfig.json`
- **Relayer**: `tsconfig.json`, `.env` (see `.env.example`)
- **Resolver**: `tsconfig.json`, `.env` (see `.env.example`)

## 🚦 Getting Started

1. **Install Dependencies**: `yarn install`
2. **Start Frontend**: `yarn dev`
3. **Start Services**: `yarn dev:relayer` and `yarn dev:resolver` in separate terminals
4. **Deploy Contracts**: `cd packages/contracts && yarn deploy`

## 📋 Environment Variables

Create `.env` files in each package directory using the `.env.example` templates:

- `packages/contracts/.env` - RPC URLs, private keys for deployment
- `packages/relayer/.env` - Relayer configuration, network settings  
- `packages/resolver/.env` - API keys for price feeds, DEX integrations

## 🏗 Architecture

The monorepo follows a microservices architecture:

1. **Frontend** - User interface for swaps and portfolio management
2. **Contracts** - On-chain logic for swaps and governance
3. **Relayer** - Off-chain transaction relaying and meta-transactions
4. **Resolver** - Price discovery and optimal routing across DEXs

All services communicate via REST APIs and shared TypeScript types.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes in the appropriate package
3. Run tests: `yarn test`
4. Run linting: `yarn lint`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
