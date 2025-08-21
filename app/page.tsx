"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Zap, Shield, Globe, Play, ArrowRight, Sparkles, TrendingUp, Upload, DollarSign, Coins, Award, Eye } from 'lucide-react'
import Link from "next/link"
import { Navigation } from "@/components/navigation"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-950/20" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
           <div className="container mx-auto text-center relative z-10">

          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent leading-tight">
            Fair Music for
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              The World
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
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <h2 className="text-4xl md:text-5xl font-bold">Revolutionizing Global Music</h2>
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The future is here. Discover how artists worldwide control their destiny.
            </p>
          </div>

          {/* Key Features - Matching the screenshot requirements */}
          <div className="space-y-8">
            {/* Artist Dashboard */}
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-purple-500/50 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-purple-300">Artist Dashboard</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      A platform where artists can upload their music, track earnings, and manage rights.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streaming Platform */}
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-green-500/50 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-green-300">Streaming Platform</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      For fans to stream music with a built-in payment system that rewards artists.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Royalties Management */}
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-blue-500/50 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-blue-300">Royalties Management</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      A transparent system for calculating and distributing royalties in real-time via smart contracts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Economy */}
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-yellow-500/50 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Coins className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-yellow-300">Token Economy</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      A native token to power the platform's economy, enabling artists to receive payments instantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NFT Integration */}
            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-pink-500/50 transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-pink-300">NFT Integration</h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Artists can mint and sell music as NFTs for exclusive content or rights management.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Impact */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border-purple-500/30 mt-12">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4 text-white">Platform Impact</h3>
                <p className="text-gray-300 text-lg leading-relaxed max-w-4xl mx-auto">
                  This approach would reshape how music distribution works, potentially solving issues like low payouts 
                  from traditional streaming services, lack of transparency in royalty distribution, and providing a more 
                  direct connection between artists and their audiences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border-purple-500/30">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Change the Game?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of artists worldwide who are already earning fair royalties on Music City.
              </p>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/images/logo_light.png" 
              alt="Music City Logo" 
              className="w-10 h-10 rounded-xl"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Music City
            </span>
          </div>
          <p className="text-gray-400">Empowering artists worldwide through blockchain technology</p>
        </div>
      </footer>
    </div>
  )
}
