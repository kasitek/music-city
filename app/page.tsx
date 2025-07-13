import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, Coins, Shield, Users, Globe, Play, TrendingUp, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20" />

        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-200 border-purple-500/30 backdrop-blur-sm">
            🇿🇦 Powered by Lisk Blockchain
          </Badge>

          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent leading-tight">
            Fair Music for
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              South Africa
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Where artists earn fair royalties instantly.
            <span className="text-purple-300 font-medium"> No middlemen, just music.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-10 py-4 rounded-full shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:scale-105"
            >
              <Play className="mr-2 h-5 w-5" />
              <Link href="/auth">Start Creating</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-600/50 text-gray-200 hover:bg-gray-800/50 text-lg px-10 py-4 rounded-full bg-gray-900/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              <Link href="/discover">Explore Music</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Revolutionary Features Section */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <span className="text-purple-400 font-semibold tracking-wider uppercase text-sm">The Future is Here</span>
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Revolutionizing
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                African Music
              </span>
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
              Experience the next generation of music streaming where artists control their destiny
            </p>
          </div>

          {/* Feature Cards with Images */}
          <div className="space-y-16">
            {/* Fair Royalties */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-1 rounded-3xl backdrop-blur-sm">
                  <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 p-8 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl">
                        <Coins className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">Instant Fair Royalties</h3>
                        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      No more waiting months for payments. Get paid instantly when your music is streamed, with
                      transparent blockchain transactions showing exactly where every cent goes.
                    </p>
                    <div className="flex items-center text-purple-400 font-semibold">
                      <span>Learn more about instant payments</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-3xl blur-xl"></div>
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Instant payments visualization"
                    width={600}
                    height={400}
                    className="relative rounded-3xl shadow-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Blockchain Security */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-3xl blur-xl"></div>
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Blockchain security"
                    width={600}
                    height={400}
                    className="relative rounded-3xl shadow-2xl"
                  />
                </div>
              </div>
              <div className="order-2">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 p-1 rounded-3xl backdrop-blur-sm">
                  <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 p-8 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">Unbreakable Security</h3>
                        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      Your music and earnings are protected by military-grade blockchain encryption. No middlemen, no
                      hidden fees, no stolen royalties - just pure, secure ownership.
                    </p>
                    <div className="flex items-center text-blue-400 font-semibold">
                      <span>Discover blockchain protection</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Fan Connection */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-cyan-500/20 to-green-600/20 p-1 rounded-3xl backdrop-blur-sm">
                  <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 p-8 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-gradient-to-br from-cyan-500 to-green-600 p-4 rounded-2xl">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">Direct Fan Power</h3>
                        <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-green-600 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      Build real relationships with your fans through exclusive NFTs, direct tips, and behind-the-scenes
                      content. No algorithms deciding who sees your music.
                    </p>
                    <div className="flex items-center text-cyan-400 font-semibold">
                      <span>Connect with your audience</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/30 to-green-600/30 rounded-3xl blur-xl"></div>
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Fan connection"
                    width={600}
                    height={400}
                    className="relative rounded-3xl shadow-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Global Reach */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl blur-xl"></div>
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Global reach"
                    width={600}
                    height={400}
                    className="relative rounded-3xl shadow-2xl"
                  />
                </div>
              </div>
              <div className="order-2">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 p-1 rounded-3xl backdrop-blur-sm">
                  <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 p-8 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl">
                        <Globe className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">Mzansi Goes Global</h3>
                        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      Share the soul of South African music with the world. From Amapiano to Maskandi, reach listeners
                      across continents without borders or restrictions.
                    </p>
                    <div className="flex items-center text-purple-400 font-semibold">
                      <span>Expand your reach worldwide</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-gray-900/50 to-purple-900/30 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              The Numbers Speak
            </h3>
            <p className="text-gray-400 text-lg">Real impact, real artists, real change</p>
          </div>
          <div className="grid md:grid-cols-4 gap-12 text-center">
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300">
                10K+
              </div>
              <div className="text-gray-400 text-lg font-medium">Active Artists</div>
              <div className="text-gray-500 text-sm mt-2">Creating daily</div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300">
                1M+
              </div>
              <div className="text-gray-400 text-lg font-medium">Songs Streamed</div>
              <div className="text-gray-500 text-sm mt-2">This month</div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300">
                R2M+
              </div>
              <div className="text-gray-400 text-lg font-medium">Paid to Artists</div>
              <div className="text-gray-500 text-sm mt-2">Instantly</div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300">
                50+
              </div>
              <div className="text-gray-400 text-lg font-medium">Countries</div>
              <div className="text-gray-500 text-sm mt-2">Worldwide reach</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-1 rounded-3xl backdrop-blur-sm max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 p-12 rounded-3xl">
              <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready to Change the Game?
              </h3>
              <p className="text-gray-300 text-xl mb-8 max-w-2xl mx-auto">
                Join thousands of South African artists who are already earning fair royalties and building direct fan
                relationships.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-12 py-4 rounded-full shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:scale-105"
              >
                <Link href="/auth" className="flex items-center">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-16 px-4 bg-gradient-to-r from-gray-950 to-gray-900">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-xl">
                <Music className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                Music City
              </span>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <div className="text-lg font-medium mb-1">© 2024 Music City</div>
              <div className="text-sm">Empowering South African artists through blockchain technology</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
