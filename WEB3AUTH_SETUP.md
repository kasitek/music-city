# Music City - Web3Auth Integration

This project has been integrated with Web3Auth to provide seamless social login functionality for blockchain applications.

## 🚀 Features

- **Social Login**: Users can authenticate using Google, Facebook, Twitter, Discord, Apple, and more
- **Wallet Generation**: Automatic wallet creation for social login users
- **Secure Authentication**: Non-custodial key management powered by Web3Auth
- **Ethereum Support**: Built-in support for Ethereum blockchain interactions

## 🛠 Setup Instructions

### 1. Get Your Web3Auth Client ID

1. Visit [Web3Auth Dashboard](https://dashboard.web3auth.io)
2. Sign up or log in to your account
3. Create a new project
4. Copy your Client ID from the project settings

### 2. Environment Configuration

Update your `.env.local` file with your Web3Auth credentials:

```env
# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_actual_client_id_here

# For production, use SAPPHIRE_MAINNET
NEXT_PUBLIC_WEB3AUTH_NETWORK=SAPPHIRE_DEVNET
```

### 3. Web3Auth Dashboard Configuration

In your Web3Auth dashboard, configure the following:

- **Whitelist your domain**: Add `http://localhost:3001` for development
- **Redirect URL**: Set to your app's domain
- **Web3Auth Network**: Use `SAPPHIRE_DEVNET` for testing, `SAPPHIRE_MAINNET` for production

## 📦 Dependencies

The integration uses the following packages:

```json
{
  "@web3auth/modal": "^10.1.0",
  "@web3auth/base": "^10.0.6"
}
```

## 🔧 Usage

### Basic Authentication Flow

```typescript
import { initWeb3Auth, connectWallet, getUserInfo } from '@/lib/web3auth'

// Initialize Web3Auth (done automatically in the component)
await initWeb3Auth()

// Connect user wallet
const provider = await connectWallet()

// Get user information
const userInfo = await getUserInfo()
console.log(userInfo.email, userInfo.name)
```

### Component Integration

The `Web3Auth` component handles the entire authentication flow:

```tsx
<Web3Auth
  onConnect={(address, email, name) => {
    console.log('User connected:', { address, email, name })
  }}
  onDisconnect={() => {
    console.log('User disconnected')
  }}
  isConnected={isConnected}
  address={walletAddress}
/>
```

## 🔐 Security Features

- **Non-custodial**: Users maintain control of their private keys
- **Multi-factor Authentication**: Optional MFA for enhanced security
- **Encrypted Key Storage**: Keys are encrypted and distributed across multiple shares
- **Social Recovery**: Account recovery through social login providers

## 🌐 Supported Login Methods

- Google
- Facebook
- Twitter/X
- Discord
- Apple
- Email (Passwordless)
- Custom JWT

## 🚀 Deployment

For production deployment:

1. Update your Web3Auth dashboard with production domains
2. Change `WEB3AUTH_NETWORK` to `SAPPHIRE_MAINNET`
3. Ensure your client ID is properly configured
4. Test the integration thoroughly

## 📱 Mobile Support

Web3Auth provides seamless mobile support through:
- Mobile-optimized UI
- Deep linking capabilities
- Native app integration options

## 🔗 Useful Links

- [Web3Auth Documentation](https://web3auth.io/docs/)
- [Web3Auth Dashboard](https://dashboard.web3auth.io)
- [Web3Auth Examples](https://github.com/Web3Auth/web3auth-wagmi-connector/tree/main/examples)
- [Supported Chains](https://web3auth.io/docs/infrastructure/supported-chains)

## 🐛 Troubleshooting

### Common Issues

1. **Client ID not found**: Ensure your client ID is correctly set in `.env.local`
2. **Domain not whitelisted**: Add your domain to the Web3Auth dashboard
3. **Network mismatch**: Ensure the network setting matches your dashboard configuration

### Debug Mode

Enable debug mode in development:

```typescript
// In your Web3Auth configuration
uiConfig: {
  // ... other config
  logLevel: "debug"
}
```

## 📄 License

This project is licensed under the MIT License.
