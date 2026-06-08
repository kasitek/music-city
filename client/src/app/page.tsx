import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Music,
  Play,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Instant Royalties",
    description: "Get paid when your music is streamed. No waiting, no delays.",
    icon: Zap,
    tone: "green",
  },
  {
    title: "Protected Releases",
    description: "Private masters, encrypted streams, and wallet-gated access.",
    icon: Shield,
    tone: "light",
  },
  {
    title: "Direct Fan Power",
    description: "Build a catalog fans can support without middlemen.",
    icon: Music,
    tone: "green",
  },
  {
    title: "Global Reach",
    description: "From Pop to Amapiano, publish music without borders.",
    icon: Globe,
    tone: "light",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="relative -mt-16 min-h-screen overflow-hidden bg-[#050505] pt-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(29,185,84,0.18)_0%,rgba(18,18,18,0.88)_34%,#050505_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_34%)]" />

      <section className="relative px-4 pb-16 pt-32">
        <div className="container relative z-10 mx-auto text-center">
          <h1 className="mb-8 text-6xl font-black leading-tight text-white md:text-8xl">
            Fair Music for
            <br />
            <span className="text-[#1DB954]">The World</span>
          </h1>

          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-zinc-300 md:text-2xl">
            Where artists earn fair royalties instantly.
            <span className="font-medium text-white">
              {" "}
              No middlemen, just music.
            </span>
          </p>

          <div className="grid grid-cols-2 items-center justify-center gap-4 sm:flex sm:flex-row sm:gap-6">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-[#1DB954] px-6 py-4 text-lg font-bold text-black shadow-[0_18px_45px_rgba(29,185,84,0.22)] transition-all duration-300 hover:scale-105 hover:bg-[#1ed760]"
            >
              <Link href="/auth">
                <Play className="mr-2 h-5 w-5 fill-black text-black" />
                Start Creating
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border border-white/20 bg-white/5 px-6 py-4 text-lg text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/10"
            >
              <Link href="/discover">
                <TrendingUp className="mr-2 h-5 w-5" />
                Explore Music
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 flex items-center justify-center space-x-2">
              <Sparkles className="h-6 w-6 text-[#1DB954]" />
              <h2 className="text-4xl font-black text-white md:text-5xl">
                Revolutionizing Global Music
              </h2>
              <Sparkles className="h-6 w-6 text-[#1DB954]" />
            </div>
            <p className="mx-auto max-w-2xl text-xl text-zinc-400">
              Discover how artists worldwide control their catalog, payouts, and
              fan access.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {features.map(({ title, description, icon: Icon, tone }) => (
              <Card
                key={title}
                className="group border-white/10 bg-[#181818] text-white shadow-none transition-all duration-300 hover:border-[#1DB954]/60 hover:bg-[#242424]"
              >
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col items-start gap-5">
                    <div
                      className={
                        tone === "green"
                          ? "flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954] transition-transform duration-300 group-hover:scale-110"
                          : "flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 transition-transform duration-300 group-hover:scale-110"
                      }
                    >
                      <Icon className="h-6 w-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-bold text-white">
                        {title}
                      </h3>
                      <p className="leading-relaxed text-zinc-400">
                        {description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <Card className="border-white/10 bg-[#181818] text-white shadow-none">
            <CardContent className="p-8 text-center md:p-12">
              <h2 className="mb-4 text-3xl font-black md:text-4xl">
                Ready to Change the Game?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-zinc-400">
                Build releases, unlock fan access, and keep the heavy storage
                where it belongs.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#1DB954] px-8 py-4 text-lg font-bold text-black hover:bg-[#1ed760]"
              >
                <Link href="/auth">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="relative border-t border-white/10 px-4 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <img
              src="/images/logo_light.png"
              alt="Music City Logo"
              className="h-10 w-10 rounded-lg"
            />
            <span className="text-2xl font-bold text-white">Music City</span>
          </div>
          <p className="text-zinc-400">
            Empowering artists worldwide through blockchain technology
          </p>
        </div>
      </footer>
    </div>
  );
}
