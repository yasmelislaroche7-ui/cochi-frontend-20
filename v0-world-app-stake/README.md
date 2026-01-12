# Matrix Stake - World App Mini App

A professional staking mini app for World App with Matrix-themed interface.

## Features

- **Matrix Rain Animation** - Iconic falling characters background
- **Stake & Unstake** - Full staking functionality with 1-day lock period
- **Real-time Rewards** - Automatic reward calculation and claiming
- **World ID Integration** - Human verification using World ID
- **Transaction History** - Track all your staking activities
- **Contract Info** - View live contract data and addresses
- **Responsive Design** - Works seamlessly on mobile and desktop

## Smart Contracts

- **Staking Contract**: `0xd4292d1c53d6e025156c6ef0dd3d7645eb85dfe3`
- **Token Contract**: `0xd2f234926d10549a7232446cc1ff2e3a2fa57581`

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Configure your World App ID
4. Install dependencies: `npm install`
5. Run development server: `npm run dev`

## Deployment Checklist

### Required for Production:

- [ ] Register app on World Developer Portal
- [ ] Get App ID and add to environment variables
- [ ] Configure World ID action for verification
- [ ] Set up proper RPC endpoints
- [ ] Enable HTTPS for production
- [ ] Add app icons (192x192 and 512x512)
- [ ] Add screenshots for app store
- [ ] Test on actual World App
- [ ] Configure CSP headers for security
- [ ] Set up error tracking (Sentry)
- [ ] Add analytics tracking
- [ ] Test all transactions on testnet first
- [ ] Audit smart contracts
- [ ] Set up monitoring for contract events

### World App Configuration:

1. Go to https://developer.worldcoin.org/
2. Create new mini app
3. Configure:
   - App name: "Matrix Stake"
   - Description: "Stake tokens and earn rewards"
   - Category: Finance/DeFi
   - URL: Your deployment URL
   - Permissions: Wallet access, transactions
4. Add World ID action:
   - Action: "stake-verification"
   - Verification level: Orb
5. Get App ID and update `.env.local`

### Security Considerations:

- Contract addresses are immutable and verified
- All transactions go through MiniKit
- World ID verification for additional security
- Rate limiting on transactions
- Input validation on all forms
- CSP headers configured

## Tech Stack

- **Next.js 16** - React framework
- **MiniKit** - World App SDK
- **Viem** - Ethereum interaction
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components

## License

MIT
