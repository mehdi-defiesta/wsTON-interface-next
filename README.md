# WSTON Interface

A modern, user-friendly web interface for interacting with the Wrapped Staked TON (WSTON) token contract on Ethereum Sepolia testnet.

## Features

- 🔗 **Easy Wallet Connection** - Connect with MetaMask, WalletConnect, and other popular wallets
- 💰 **Deposit Functionality** - Deposit TON or WTON to receive WSTON tokens
- 📤 **Withdrawal System** - Request withdrawals and claim TON tokens after delay period
- 📊 **Real-time Staking Index** - View the current staking index and total stake
- 🎨 **Modern UI** - Clean, responsive design with smooth animations
- ⚡ **Real-time Updates** - Live balance updates and transaction status

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or another Ethereum wallet
- Sepolia testnet ETH for transactions

### Installation

1. Clone the repository:
```bash
cd ui
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and configure it:
```bash
cp .env.example .env.local
```

4. Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

5. Add your WalletConnect Project ID to `.env.local`:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

The interface is pre-configured for Sepolia testnet with the following contracts:

- **WSTON Proxy**: `0x4e1e3e6De6F9aE2C0D8a21626082Ef70dBa87e6D`
- **WTON Token**: `0x79e0d92670106c85e9067b56b8f674340dca0bbd`  
- **TON Token**: `0xa30fe40285b8f5c0457dbc3b7c8a280373c40044`

## Usage

### Connecting Your Wallet

1. Click the "Connect Wallet" button in the top right
2. Choose your preferred wallet (MetaMask, WalletConnect, etc.)
3. Make sure you're connected to Sepolia testnet

### Depositing Tokens

1. Choose between TON or WTON in the deposit form
2. Enter the amount you want to deposit
3. Click "Approve" if needed, then "Deposit"
4. Confirm the transaction in your wallet
5. Your WSTON balance will update automatically

### Requesting Withdrawals

1. Enter the WSTON amount you want to withdraw
2. Click "Request Withdrawal" 
3. Wait for the delay period (set by DepositManager)
4. Once ready, click "Claim TON" to receive your tokens

### Processing Withdrawal Requests

Anyone can help process pending withdrawal requests by clicking the "Process Requests" button. This helps other users claim their withdrawals faster.

## Smart Contract Integration

The interface interacts with:

- **L1WrappedStakedTON**: Main WSTON contract for deposits/withdrawals
- **ERC20 Tokens**: TON and WTON for approvals and balance checks
- **Sepolia Network**: Ethereum testnet for safe testing

## Key Functions

- `depositWTONAndGetWSTON()` - Deposit tokens to receive WSTON
- `requestWithdrawal()` - Request withdrawal with delay
- `claimWithdrawalTotal()` - Claim all ready withdrawals  
- `processWithdrawalRequest()` - Process pending requests
- `getStakingIndex()` - Get current staking rate

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **wagmi** - Ethereum interactions
- **RainbowKit** - Wallet connection
- **ethers.js** - Ethereum utilities

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Security Considerations

⚠️ **This is a testnet interface for development and testing purposes only.**

- Never use real funds on testnet contracts
- Always verify contract addresses before interacting
- Test thoroughly before any mainnet deployment
- Be aware of withdrawal delay periods

## Support

For issues or questions:

1. Check the browser console for error messages
2. Ensure you're on Sepolia testnet
3. Verify you have sufficient testnet ETH for gas
4. Make sure contract addresses are correct

## License

MIT License - see LICENSE file for details.