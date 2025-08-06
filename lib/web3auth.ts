import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "BPrCo3pN9HwlKMczwQ0zVL7Jt4LG3kC8FljGGKlT7VW5SN4QM1VgZ6rN0Ll8xzOKo6Q8QjAk5dOc0QzV3QJ0n1"

let web3auth: Web3Auth | null = null

export const initWeb3Auth = async (): Promise<void> => {
  try {
    if (web3auth) return

    web3auth = new Web3Auth({
      clientId,
      web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
      uiConfig: {
        appName: "Music City",
        mode: "dark",
        logoLight: "https://web3auth.io/images/web3authlog.png",
        logoDark: "https://web3auth.io/images/web3authlogodark.png",
        defaultLanguage: "en",
        modalZIndex: "2147483647",
      },
    })

    await web3auth.init()
  } catch (error) {
    console.error("Error initializing Web3Auth:", error)
    throw error
  }
}

export const connectWallet = async () => {
  try {
    if (!web3auth) {
      throw new Error("Web3Auth not initialized")
    }
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
