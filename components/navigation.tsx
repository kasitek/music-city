"use client"

import { Button } from "@/components/ui/button"
import { Music, User, LogOut, Coins } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavigationProps {
  currentPage?: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const { user, isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Music className="h-8 w-8 text-purple-500" />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Music City
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/discover"
            className={`transition-colors ${
              currentPage === "discover" ? "text-purple-400 font-medium" : "text-gray-300 hover:text-white"
            }`}
          >
            Discover
          </Link>
          <Link
            href="/stream"
            className={`transition-colors ${
              currentPage === "stream" ? "text-purple-400 font-medium" : "text-gray-300 hover:text-white"
            }`}
          >
            Stream
          </Link>
          <Link
            href="/artists"
            className={`transition-colors ${
              currentPage === "artists" ? "text-purple-400 font-medium" : "text-gray-300 hover:text-white"
            }`}
          >
            Artists
          </Link>
          <Link
            href="/marketplace"
            className={`transition-colors ${
              currentPage === "marketplace" ? "text-purple-400 font-medium" : "text-gray-300 hover:text-white"
            }`}
          >
            NFT Marketplace
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              {/* MCC Token Balance */}
              <div className="flex items-center space-x-2 text-sm bg-gray-800 px-3 py-1 rounded-full">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-400">
                  {user.userType === "artist" ? Math.floor((user.totalEarnings || 0) * 10).toLocaleString() : "1,247"}{" "}
                  MCC
                </span>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden md:block text-white">{user.displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-white">{user.displayName}</p>
                    <p className="text-xs text-gray-400">{user.userType === "artist" ? "Artist" : "Fan"}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="text-gray-300 hover:text-white cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="text-gray-300 hover:text-white cursor-pointer">
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Link href="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
