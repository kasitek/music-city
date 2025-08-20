"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { mockDB, type User } from "@/lib/mock-database"
import { isAuthenticated as icIsAuthenticated, loginInternetIdentity, loginNFID, logout as icLogout, getIdentity } from "@/lib/ic/auth"
import { setIdentity as setBackendIdentity } from "@/lib/ic/backend"
import { setStorageIdentity } from "@/lib/ic/storage"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (walletAddress: string, email?: string, name?: string) => Promise<User | null>
  loginWithII: () => Promise<void>
  loginWithNFID: () => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize database
    mockDB.initializeDatabase()

    // Check for existing authentication
    const checkAuth = () => {
      const walletConnected = localStorage.getItem("walletConnected")
      const onboardingComplete = localStorage.getItem("onboardingComplete")
      const walletAddress = localStorage.getItem("walletAddress")

      if (walletConnected && onboardingComplete && walletAddress) {
        // Try to get user from database
        const currentUser = mockDB.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        } else {
          // Fallback: try to find user by wallet address
          const foundUser = mockDB.getUserByWallet(walletAddress)
          if (foundUser) {
            setUser(foundUser)
            mockDB.setCurrentUser(foundUser)
          }
        }
      }

      // Initialize IC identity if already authenticated (II/NFID session)
      icIsAuthenticated().then((ok) => {
        if (ok) {
          const id = getIdentity()
          if (id) {
            setBackendIdentity(id)
            setStorageIdentity(id)
          }
        }
      }).catch(() => {/* ignore */})
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (walletAddress: string, email?: string, name?: string): Promise<User | null> => {
    try {
      // Check if user exists in database
      const user = mockDB.getUserByWallet(walletAddress)

      if (user) {
        // User exists, log them in
        setUser(user)
        mockDB.setCurrentUser(user)
        localStorage.setItem("walletConnected", "true")
        localStorage.setItem("walletAddress", walletAddress)
        localStorage.setItem("onboardingComplete", "true")
        if (email) localStorage.setItem("userEmail", email)
        if (name) localStorage.setItem("userName", name)
        return user
      }

      // User doesn't exist, they need to complete onboarding
      localStorage.setItem("walletConnected", "true")
      localStorage.setItem("walletAddress", walletAddress)
      if (email) localStorage.setItem("userEmail", email)
      if (name) localStorage.setItem("userName", name)
      return null
    } catch (error) {
      console.error("Login error:", error)
      return null
    }
  }

  const loginWithII = async () => {
    try {
      const identity = await loginInternetIdentity()
      setBackendIdentity(identity)
      setStorageIdentity(identity)
      // Persist a hint so UI can reflect logged-in state even without wallet
      localStorage.setItem("icIdentity", "true")
    } catch (e: any) {
      const msg = e?.message || String(e)
      if (msg.includes("User closed the modal")) {
        // Silent cancel: user dismissed the login modal. Allow retry without error noise.
        return
      }
      throw e
    }
  }

  const loginWithNFID = async () => {
    try {
      const identity = await loginNFID()
      setBackendIdentity(identity)
      setStorageIdentity(identity)
      localStorage.setItem("icIdentity", "true")
    } catch (e: any) {
      const msg = e?.message || String(e)
      if (msg.includes("User closed the modal")) {
        // Silent cancel
        return
      }
      throw e
    }
  }

  const logout = () => {
    setUser(null)
    mockDB.clearCurrentUser()
    // Clear IC identity session
    icLogout().catch(() => {/* ignore */})
    setBackendIdentity(undefined)
    setStorageIdentity(undefined)
    localStorage.removeItem("walletConnected")
    localStorage.removeItem("walletAddress")
    localStorage.removeItem("onboardingComplete")
    localStorage.removeItem("userId")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    localStorage.removeItem("icIdentity")
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = mockDB.updateUser(user.id, updates)
      if (updatedUser) {
        setUser(updatedUser)
        mockDB.setCurrentUser(updatedUser)
      }
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithII,
    loginWithNFID,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
