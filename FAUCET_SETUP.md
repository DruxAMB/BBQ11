# Faucet API Setup Guide

This app includes a backend API that automatically funds user wallets with USDC on Base Sepolia testnet using the Coinbase Developer Platform (CDP) Faucets API.

## Prerequisites

1. A CDP account - [Sign up here](https://portal.cdp.coinbase.com/create-account)
2. CDP API credentials

## Setup Instructions

### 1. Create CDP API Keys

1. Go to [CDP Portal](https://portal.cdp.coinbase.com/projects/api-keys)
2. Create a new API key
3. Save your `API Key ID` and `API Key Secret`

### 2. Generate Wallet Secret

1. Navigate to [Server Wallets](https://portal.cdp.coinbase.com/products/server-wallets)
2. Generate a new Wallet Secret
3. Save this secret securely

### 3. Configure Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# CDP API Keys
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
CDP_WALLET_SECRET=your-wallet-secret

# Neynar API Key (if using posts feature)
NEXT_NEYNAR_API_KEY=your-neynar-api-key
```

### 4. Restart Development Server

After adding the environment variables, restart your development server:

```bash
pnpm dev
```

## Features

### Frontend Integration

The app includes two ways to fund your account with USDC:

1. **Fund Account Button** - Located in the navigation bar next to the Disconnect button
2. **Get USDC Link** - Available in the Send USDC dialog

Both buttons call the backend API endpoint to request USDC from the CDP Faucets API.

### API Endpoint

**POST `/api/faucet`**

Request body:
```json
{
  "address": "0x..."
}
```

Success response:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "explorerUrl": "https://sepolia.basescan.org/tx/0x...",
  "message": "USDC sent successfully to your wallet"
}
```

Error response:
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Rate Limits

The CDP Faucets API has rate limits:
- **USDC**: Limited claims per 24 hours per address
- If you hit the rate limit, you'll see an error message asking you to try again in 24 hours

## Balance Threshold

To prevent abuse and ensure fair distribution:
- Users can only request funds if their balance is **≤ 0.1 USDC**
- The "Fund Account" button will be disabled if balance exceeds this threshold
- The button text will change to "Sufficient Balance" when disabled
- This check is enforced on both frontend and backend for security

## Testing

Once configured, you can test the faucet by:

1. Connecting your wallet to the app
2. Clicking the "Fund Account" button
3. Waiting for the transaction to complete
4. Checking your wallet balance (should update automatically)
5. Viewing the transaction on [Base Sepolia Explorer](https://sepolia.basescan.org/)

## Troubleshooting

### "Server configuration error: CDP credentials not configured"

This means your environment variables are not properly set. Make sure:
- The `.env.local` file exists in the project root
- All three CDP variables are set
- You've restarted the development server

### "Rate limit reached"

You've made too many faucet requests in 24 hours. Wait and try again later.

### "Failed to fund account"

Check the browser console and server logs for detailed error messages. Common issues:
- Invalid API credentials
- Network connectivity issues
- Invalid wallet address

## Additional Resources

- [CDP Faucets Documentation](https://docs.cdp.coinbase.com/faucets/docs/welcome)
- [CDP Portal](https://portal.cdp.coinbase.com/)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
