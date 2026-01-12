# Matrix Stake - World App Mini App

## Overview

Matrix Stake is a decentralized staking mini application designed to run within the World App ecosystem. It provides users with a visually distinctive Matrix-themed interface for staking WORLD tokens and earning rewards. The application features a 1-day lock period for staked tokens, real-time reward calculation, and human verification through World ID.

Key capabilities:
- Token staking and unstaking with time-locked withdrawals
- Automatic reward calculation and claiming
- World ID integration for human verification
- Transaction history tracking
- Live contract data display

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **Next.js 16** with App Router architecture
- React Server Components enabled (`rsc: true` in components.json)
- TypeScript for type safety throughout the codebase

### UI Component Strategy
- **shadcn/ui** components with New York style variant
- Tailwind CSS v4 with custom CSS variables for theming
- Custom Matrix-themed color palette using OKLCH color space (matrix-green, matrix-cyan, matrix-orange)
- Radix UI primitives for accessible, unstyled component foundations

### Blockchain Integration
- **viem** library for Ethereum interactions (not ethers.js or web3.js)
- **World Chain** as the target blockchain network
- Smart contract interactions via typed ABIs stored in `/lib/contracts/`
- Two contracts: Staking Contract and ERC20 Token Contract

### State Management
- React hooks for local component state
- Custom `useStaking` hook centralizes all blockchain state and operations
- No external state management library (Redux, Zustand, etc.)

### World App Integration
- **@worldcoin/minikit-js** SDK for World App embedding
- MiniKitProvider wraps the application at the root level
- World ID verification for human authentication
- Wallet connection handled through MiniKit APIs

### Project Structure
```
app/           - Next.js App Router pages and layouts
components/    - React components (feature-specific and UI primitives)
components/ui/ - shadcn/ui component library
hooks/         - Custom React hooks
lib/           - Utilities and contract configurations
lib/contracts/ - Smart contract ABIs and addresses
```

## External Dependencies

### Blockchain Services
- **World Chain RPC**: Default HTTP transport via viem for blockchain reads
- **Staking Contract**: `0xd4292d1c53d6e025156c6ef0dd3d7645eb85dfe3`
- **Token Contract**: `0xd2f234926d10549a7232446cc1ff2e3a2fa57581`

### World App Platform
- World Developer Portal for app registration
- World ID verification service for human authentication
- MiniKit SDK for wallet integration and transaction signing

### Analytics and Monitoring
- **@vercel/analytics** for usage tracking
- Toast notifications via Radix Toast primitives

### Required Environment Configuration
- World App ID (from World Developer Portal)
- Action ID for World ID verification ("stake-verification")