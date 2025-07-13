import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Coins, Shield, Users, Globe, Play, TrendingUp, Sparkles } from "lucide-react"
import Link from "next/link"
import Navigation from "@/components/navigation"

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

      {/* Features Section */}
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

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50 backdrop-blur-sm hover:bg-gradient-to-br hover:from-purple-900/20 hover:to-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10">
              <CardHeader className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-3">Instant Fair Royalties</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Get paid instantly when your music is streamed, with transparent blockchain transactions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50 backdrop-blur-sm hover:bg-gradient-to-br hover:from-blue-900/20 hover:to-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
              <CardHeader className="p-8 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-3">Unbreakable Security</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Your music and earnings are protected by advanced blockchain encryption and smart contracts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50 backdrop-blur-sm hover:bg-gradient-to-br hover:from-cyan-900/20 hover:to-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/10">
              <CardHeader className="p-8 text-center">
                <div className="bg-gradient-to-br from-cyan-500 to-green-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-3">Direct Fan Connection</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Build real relationships with fans through exclusive NFTs, direct tips, and content
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50 backdrop-blur-sm hover:bg-gradient-to-br hover:from-purple-900/20 hover:to-gray-800/80 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10">
              <CardHeader className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl mb-3">Mzansi Goes Global</CardTitle>
                <CardDescription className="text-gray-400 text-base leading-relaxed">
                  Share South African music with the world. From Amapiano to Maskandi, reach global audiences
                </CardDescription>
              </CardHeader>
            </Card>
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
                  <Play className="ml-2 h-5 w-5" />
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
