"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { mockDB, type User } from "@/lib/mock-database"

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

  const logout = () => {
    setUser(null)
    mockDB.clearCurrentUser()
    localStorage.removeItem("walletConnected")
    localStorage.removeItem("walletAddress")
    localStorage.removeItem("onboardingComplete")
    localStorage.removeItem("userId")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
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
