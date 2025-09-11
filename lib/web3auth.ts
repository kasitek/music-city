import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || ""
const networkEnv = (process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK || "sapphire_devnet").toLowerCase()
const web3AuthNetwork =
  networkEnv === "sapphire_mainnet"
    ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET
    : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET

const evmChainId = process.env.NEXT_PUBLIC_EVM_CHAIN_ID || "0xaa36a7" // Sepolia by default
const evmRpc = process.env.NEXT_PUBLIC_EVM_RPC || "https://rpc.ankr.com/eth_sepolia"

let web3auth: Web3Auth | null = null

export const initWeb3Auth = async (): Promise<void> => {
  try {
    if (web3auth) return

    console.log("Starting Web3Auth initialization...")
    
    if (!clientId) {
      const hint = `Missing NEXT_PUBLIC_WEB3AUTH_CLIENT_ID. Create .env.local and set it to your Web3Auth Dashboard Client ID.`
      throw new Error(hint)
    }
    
    console.log("Web3Auth config:", { 
      clientId: clientId.slice(0, 10) + "...", 
      network: networkEnv,
      chainId: evmChainId 
    })
    
    const options: any = {
      clientId,
      web3AuthNetwork,
      uiConfig: {
        appName: "Music City",
        mode: "dark",
        logoLight: "https://web3auth.io/images/web3authlog.png",
        logoDark: "https://web3auth.io/images/web3authlogodark.png",
        defaultLanguage: "en",
        modalZIndex: "2147483647",
      },
    }

    // Provide a default EVM chain config when supported (newer modal versions)
    options.chainConfig = {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: evmChainId,
      rpcTarget: evmRpc,
    }

    try {
      console.log("Creating Web3Auth instance...")
      web3auth = new Web3Auth(options as any)
      console.log("Web3Auth instance created successfully")
    } catch (ctorErr: any) {
      const origin = typeof window !== "undefined" ? window.location.origin : "server"
      const ctx = { origin, network: networkEnv, chainId: evmChainId }
      console.error("Web3Auth constructor failed with context:", ctx)
      throw ctorErr
    }

    // Add timeout to prevent infinite hanging
    const initTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Web3Auth initialization timeout (30s)")), 30000)
    })

    const initPromise = (async () => {
      console.log("Initializing Web3Auth modal...")
      // For newer versions use initModal, for older use init
      const anyAuth = web3auth as any
      if (typeof anyAuth.initModal === "function") {
        await anyAuth.initModal()
      } else {
        await (web3auth as any).init()
      }
      console.log("Web3Auth initialization completed")
    })()

    await Promise.race([initPromise, initTimeout])
    
  } catch (error) {
    console.error("Error initializing Web3Auth:", error)
    // Reset web3auth on error so it can be retried
    web3auth = null
    throw error
  }
}

export const ensureWeb3Auth = async (): Promise<void> => {
  if (!web3auth) {
    await initWeb3Auth()
  }
}

export const connectWallet = async () => {
  try {
    await ensureWeb3Auth()
    if (!web3auth) throw new Error("Web3Auth not initialized")
    const web3authProvider = await web3auth.connect()
    return web3authProvider
  } catch (error) {
    console.error("Error connecting wallet:", error)
    throw error
  }
}

export const disconnectWallet = async () => {
  try {
    if (!web3auth) {
      throw new Error("Web3Auth not initialized")
    }
    await web3auth.logout()
  } catch (error) {
    console.error("Error disconnecting wallet:", error)
    throw error
  }
}

export const getUserInfo = async () => {
  try {
    if (!web3auth) {
      throw new Error("Web3Auth not initialized")
    }
    const user = await web3auth.getUserInfo()
    return user
  } catch (error) {
    console.error("Error getting user info:", error)
    throw error
  }
}

export const getAccounts = async (provider: IProvider) => {
  try {
    const ethProvider = provider as any
    const accounts = await ethProvider.request({ method: "eth_accounts" })
    return accounts
  } catch (error) {
    console.error("Error getting accounts:", error)
    throw error
  }
}

export const getBalance = async (provider: IProvider, address: string) => {
  try {
    const ethProvider = provider as any
    const balance = await ethProvider.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    })
    return parseInt(balance, 16) / Math.pow(10, 18) // Convert wei to ether
  } catch (error) {
    console.error("Error getting balance:", error)
    throw error
  }
}
