"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, Moon, Sun } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/ic/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMyUser } from "@/lib/ic/backend"
import { fromCandidUser } from "@/lib/mappers"
import Image from "next/image"
import ProfileModal from "@/components/profile-modal"

interface NavigationProps {
  currentPage?: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { principalId, sessionData, isAuthenticated, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isArtistRemote, setIsArtistRemote] = useState<boolean>(false)
  const isArtist = !!(sessionData && ((sessionData as any).isArtist === true || (sessionData.userType || '').toLowerCase() === 'artist')) || isArtistRemote
  const balance = sessionData?.mccBalance ?? 0
  const shortPrincipal = (addr?: string) => {
    if (!addr || addr.length < 10) return addr || 'User'
    return `${addr.slice(0,5)}...${addr.slice(-3)}`
  }
  const displayLabel = principalId ? (sessionData?.displayName || shortPrincipal(principalId)) : 'User'
  const displayInitial = (displayLabel?.charAt(0) || 'U').toUpperCase()

  // Avoid hydration mismatch by only rendering theme icon after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
    router.push('/')
  }

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        if (!isAuthenticated) { setIsArtistRemote(false); return }
        const opt = await getMyUser()
        if (!mounted) return
        const u = Array.isArray(opt) ? opt[0] : opt
        if (u) {
          const mapped = fromCandidUser(u as any)
          setIsArtistRemote((mapped.userType || '').toLowerCase() === 'artist')
        }
      } catch {
        if (mounted) setIsArtistRemote(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [isAuthenticated])

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
          {/* Removed duplicate Dashboard button near logo; Dashboard remains in nav sections for artists */}
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isArtist && (
              <Link 
                href="/dashboard" 
                className={`text-gray-300 hover:text-white transition-colors ${
                  currentPage === 'dashboard' ? 'text-purple-400' : ''
                }`}
              >
                Dashboard
              </Link>
            )}
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

          {/* Right Section: Theme toggle + Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="text-gray-300 hover:text-white"
              onClick={() => setTheme((resolvedTheme === 'dark' ? 'light' : 'dark'))}
            >
              {mounted ? (
                resolvedTheme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <span className="block h-5 w-5" />
              )}
            </Button>
            {isAuthenticated && principalId ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-300">
                  <span className="font-medium">{balance}</span> MCC
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={sessionData?.profileImage || "/placeholder.svg"} alt={displayLabel} />
                        <AvatarFallback className="bg-purple-600 text-white">
                          {displayInitial}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium text-white">{displayLabel}</p>
                      <p className="text-xs text-gray-400 capitalize">{sessionData?.userType}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    {isArtist && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="text-gray-300 hover:text-white">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
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
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/auth">Sign In</Link>
              </Button>
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
            <div className="px-2 pt-2 pb-3 space-y-2 bg-gray-800 rounded-lg mt-2">
              <div className="flex items-center justify-end px-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle theme"
                  className="text-gray-300 hover:text-white"
                  onClick={() => setTheme((resolvedTheme === 'dark' ? 'light' : 'dark'))}
                >
                  {mounted ? (
                    resolvedTheme === 'dark' ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )
                  ) : (
                    <span className="block h-5 w-5" />
                  )}
                </Button>
              </div>
              {isArtist && (
                <Link
                  href="/dashboard"
                  className={`block px-3 py-2 text-gray-300 hover:text-white transition-colors ${
                    currentPage === 'dashboard' ? 'text-purple-400' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
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
                {isAuthenticated && principalId ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={sessionData?.profileImage || "/placeholder.svg"} alt={displayLabel} />
                          <AvatarFallback className="bg-purple-600 text-white text-sm">
                            {displayInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-white">{displayLabel}</div>
                          <div className="text-xs text-gray-400">{balance} MCC</div>
                        </div>
                      </div>
                    </div>
                    {isArtist && (
                      <Link
                        href="/dashboard"
                        className="block px-3 py-2 text-gray-300 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href="/auth" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  </Button>
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
