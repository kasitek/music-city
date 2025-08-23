"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { isAuthenticated as icIsAuthenticated, loginInternetIdentity, loginNFID, logout as icLogout, getIdentity } from "@/lib/ic/auth"
import { setIdentity as setBackendIdentity, getMyUser, registerUser } from "@/lib/ic/backend"
import { setStorageIdentity, setBucketPrincipal } from "@/lib/ic/storage"

// Define User type locally (removing dependency on mockDB)
export interface User {
  id: string
  walletAddress: string
  displayName: string
  email?: string
  userType: 'fan' | 'artist'
  bio?: string
  location?: string
  genres?: string[]
  profileImage?: string
  accountBalance: number
  totalEarnings: number
  joinedAt: string
}

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
    // Check for existing IC authentication and load real user data
    const checkAuth = async () => {
      try {
        const isIcAuthenticated = await icIsAuthenticated()
        if (isIcAuthenticated) {
          const identity = getIdentity()
          if (identity) {
            setBackendIdentity(identity)
            setStorageIdentity(identity)
            await setBucketPrincipal().catch(() => { /* ignore init errors */ })
            
            // Try to get user from IC backend
            try {
              const icUser = await getMyUser()
              if (icUser) {
                // Convert IC user format (per IDL) to local User format
                const isArtist = icUser.userType && typeof icUser.userType === 'object' && 'artist' in icUser.userType
                const user: User = {
                  id: identity.getPrincipal().toText(),
                  walletAddress: identity.getPrincipal().toText(),
                  displayName: icUser.displayName,
                  email: icUser.bio || '', // Using bio field for email temporarily
                  userType: isArtist ? 'artist' : 'fan',
                  bio: icUser.bio,
                  location: icUser.location,
                  genres: icUser.genres,
                  profileImage: icUser.profileImage,
                  accountBalance: Number(icUser.balance || 0),
                  totalEarnings: 0,
                  joinedAt: new Date(Number(icUser.joinedTimestamp || 0) / 1000000).toISOString()
                }
                setUser(user)
              }
            } catch (e) {
              console.log('No IC user found, user needs to register')
            }
          }
        }
      } catch (e) {
        console.log('IC authentication check failed, clearing stale auth:', e)
        // Clear any stale authentication state
        try {
          await icLogout()
          setBackendIdentity(undefined)
          setStorageIdentity(undefined)
          localStorage.removeItem("icIdentity")
          localStorage.removeItem("walletConnected")
          localStorage.removeItem("onboardingComplete")
        } catch (clearError) {
          console.warn('Failed to clear auth state:', clearError)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (walletAddress: string, email?: string, name?: string): Promise<User | null> => {
    try {
      // This function is mainly for Web3Auth flow
      // For IC auth, users should use loginWithII/loginWithNFID directly
      // Store temp data for onboarding if needed
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
      await setBucketPrincipal().catch(() => { /* ignore; user can retry uploads */ })
      
      // Try to get existing user
      try {
        const icUser = await getMyUser()
        if (icUser) {
          const isArtist = icUser.userType && typeof icUser.userType === 'object' && 'artist' in icUser.userType
          const user: User = {
            id: identity.getPrincipal().toText(),
            walletAddress: identity.getPrincipal().toText(),
            displayName: icUser.displayName,
            email: icUser.bio || '',
            userType: isArtist ? 'artist' : 'fan',
            bio: icUser.bio,
            location: icUser.location,
            genres: icUser.genres,
            profileImage: icUser.profileImage,
            accountBalance: Number(icUser.balance || 0),
            totalEarnings: 0,
            joinedAt: new Date(Number(icUser.joinedTimestamp || 0) / 1000000).toISOString()
          }
          setUser(user)
          localStorage.setItem("icIdentity", "true")
          localStorage.setItem("onboardingComplete", "true")
        } else {
          // No IC user found yet: defer registration to onboarding so the user can choose role (artist/fan)
          localStorage.setItem("icIdentity", "true")
          localStorage.setItem("onboardingComplete", "false")
        }
      } catch (e: any) {
        const msg = e?.message || String(e)
        if (msg.includes("User closed the modal")) {
          // Silent cancel: user dismissed the login modal. Allow retry without error noise.
          return
        }
        throw e
      }
    } catch (e: any) {
      const msg = e?.message || String(e)
      if (msg.includes("User closed the modal")) {
        // Silent cancel
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
      await setBucketPrincipal().catch(() => { /* ignore; user can retry uploads */ })
      
      // Try to get existing user
      try {
        const icUser = await getMyUser()
        if (icUser) {
          const isArtist = icUser.userType && typeof icUser.userType === 'object' && 'artist' in icUser.userType
          const user: User = {
            id: identity.getPrincipal().toText(),
            walletAddress: identity.getPrincipal().toText(),
            displayName: icUser.displayName,
            email: icUser.bio || '',
            userType: isArtist ? 'artist' : 'fan',
            bio: icUser.bio,
            location: icUser.location,
            genres: icUser.genres,
            profileImage: icUser.profileImage,
            accountBalance: Number(icUser.balance || 0),
            totalEarnings: 0,
            joinedAt: new Date(Number(icUser.joinedTimestamp || 0) / 1000000).toISOString()
          }
          setUser(user)
          localStorage.setItem("icIdentity", "true")
          localStorage.setItem("onboardingComplete", "true")
        } else {
          // No IC user found yet: defer registration to onboarding so the user can choose role (artist/fan)
          localStorage.setItem("icIdentity", "true")
          localStorage.setItem("onboardingComplete", "false")
        }
      } catch (e) {
        console.log('Failed to get IC user:', e)
      }
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
      // Update local state immediately for better UX
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      
      // TODO: Implement updateProfile call to IC backend
      // This would require adding updateProfile function call here
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
