"use client"

import { Button } from "@/components/ui/button"
import { Music, Menu, X } from 'lucide-react'
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import ProfileModal from "@/components/profile-modal"

interface NavigationProps {
  currentPage?: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/images/logo_light.png" 
              alt="Music City Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Music City
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/discover" 
              className={`text-gray-300 hover:text-white transition-colors ${
                currentPage === 'discover' ? 'text-purple-400' : ''
              }`}
            >
              Discover
            </Link>
            <Link 
              href="/stream" 
              className={`text-gray-300 hover:text-white transition-colors ${
                currentPage === 'stream' ? 'text-purple-400' : ''
              }`}
            >
              Stream
            </Link>
            <Link 
              href="/artists" 
              className={`text-gray-300 hover:text-white transition-colors ${
                currentPage === 'artists' ? 'text-purple-400' : ''
              }`}
            >
              Artists
            </Link>
            <Link 
              href="/marketplace" 
              className={`text-gray-300 hover:text-white transition-colors ${
                currentPage === 'marketplace' ? 'text-purple-400' : ''
              }`}
            >
              Marketplace
            </Link>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-300">
                  <span className="font-medium">{user.mccBalance}</span> MCC
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImage || "/placeholder.svg"} alt={user.displayName} />
                        <AvatarFallback className="bg-purple-600 text-white">
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium text-white">{user.displayName}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.userType}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="text-gray-300 hover:text-white">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setProfileOpen(true)} className="text-gray-300 focus:text-white">
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/auth">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-300">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800 rounded-lg mt-2">
              <Link
                href="/discover"
                className={`block px-3 py-2 text-gray-300 hover:text-white transition-colors ${
                  currentPage === 'discover' ? 'text-purple-400' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Discover
              </Link>
              <Link
                href="/stream"
                className={`block px-3 py-2 text-gray-300 hover:text-white transition-colors ${
                  currentPage === 'stream' ? 'text-purple-400' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Stream
              </Link>
              <Link
                href="/artists"
                className={`block px-3 py-2 text-gray-300 hover:text-white transition-colors ${
                  currentPage === 'artists' ? 'text-purple-400' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Artists
              </Link>
              <Link
                href="/marketplace"
                className={`block px-3 py-2 text-gray-300 hover:text-white transition-colors ${
                  currentPage === 'marketplace' ? 'text-purple-400' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
              <div className="border-t border-gray-700 pt-2">
                {isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImage || "/placeholder.svg"} alt={user.displayName} />
                          <AvatarFallback className="bg-purple-600 text-white text-sm">
                            {user.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-white">{user.displayName}</div>
                          <div className="text-xs text-gray-400">{user.mccBalance} MCC</div>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Sign In</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modals */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </nav>
  )
}

// Named export for compatibility
export { Navigation }
