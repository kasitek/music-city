"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"


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
        
      } catch (e) {
        console.log('IC authentication check failed, clearing stale auth:', e)
        
        try {
        
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
      
      if (email) localStorage.setItem("userEmail", email)
      if (name) localStorage.setItem("userName", name)
      return null
    } catch (error) {
      console.error("Login error:", error)
      return null
    }
  }


  const logout = () => {
    setUser(null)
    // Clear IC identity session
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
      
      
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
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
