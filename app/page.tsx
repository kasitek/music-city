import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Coins, Shield, Users, Zap, Globe } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-purple-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Music City
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/stream" className="text-gray-300 hover:text-white transition-colors">
              Discover
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              For Artists
            </Link>
            <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">
              NFT Marketplace
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-purple-600/20 text-purple-300 border-purple-600/30">
            Powered by Lisk Blockchain
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Fair Music for Africa
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            A decentralized music platform that ensures artists receive fair royalties directly through blockchain
            technology. Stream, create, and earn without intermediaries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
              <Link href="/auth">Start Creating</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-3 bg-transparent"
            >
              <Link href="/auth">Explore Music</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Music City?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Coins className="h-12 w-12 text-purple-500 mb-4" />
                <CardTitle className="text-white">Fair Royalties</CardTitle>
                <CardDescription className="text-gray-400">
                  Receive instant, transparent payments through smart contracts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-500 mb-4" />
                <CardTitle className="text-white">Blockchain Security</CardTitle>
                <CardDescription className="text-gray-400">
                  Your music and earnings are secured by Lisk blockchain technology
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Users className="h-12 w-12 text-cyan-500 mb-4" />
                <CardTitle className="text-white">Direct Fan Connection</CardTitle>
                <CardDescription className="text-gray-400">
                  Connect directly with fans through tips, NFTs, and exclusive content
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-500 mb-4" />
                <CardTitle className="text-white">Instant Payments</CardTitle>
                <CardDescription className="text-gray-400">
                  Get paid immediately when your music is streamed or purchased
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Music className="h-12 w-12 text-green-500 mb-4" />
                <CardTitle className="text-white">Full Ownership</CardTitle>
                <CardDescription className="text-gray-400">
                  Retain complete control and ownership of your musical creations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <Globe className="h-12 w-12 text-purple-500 mb-4" />
                <CardTitle className="text-white">Global Access</CardTitle>
                <CardDescription className="text-gray-400">
                  Reach audiences worldwide without regional restrictions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">10K+</div>
              <div className="text-gray-400">Active Artists</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">1M+</div>
              <div className="text-gray-400">Songs Streamed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">$2M+</div>
              <div className="text-gray-400">Paid to Artists</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">50+</div>
              <div className="text-gray-400">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Music className="h-6 w-6 text-purple-500" />
              <span className="text-xl font-bold">Music City</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 Music City. Empowering African artists through blockchain technology.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
