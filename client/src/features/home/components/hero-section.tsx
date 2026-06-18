import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-stage-bw.jpg"
          alt="Live performance on stage"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,4,12,0.92)_0%,rgba(3,4,12,0.72)_38%,rgba(3,4,12,0.3)_68%,rgba(3,4,12,0.7)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,4,12,0.3)_0%,rgba(3,4,12,0.15)_35%,rgba(3,4,12,0.95)_100%)]" />
      </div>

      <PageContainer>
        <div className="relative flex min-h-[calc(100svh-4rem)] items-end py-16 sm:py-20">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.45em] text-emerald-300">
                Music City
              </p>
              <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.5rem] lg:leading-[0.94]">
                Release music
                <span className="block text-white/70">like it matters.</span>
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                Private drops, public releases, and streaming that feels ready
                for real fans from the first play.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-emerald-400 px-7 text-slate-950 hover:bg-emerald-300"
              >
                <Link href="/auth">
                  Start releasing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/20 bg-white/5 px-7 text-white backdrop-blur-sm hover:bg-white/10"
              >
                <Link href="/discover">
                  <Play className="h-4 w-4 fill-current" />
                  Explore artists
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-sm uppercase tracking-[0.28em] text-white/65">
              <span>Private masters</span>
              <span>Premium listening rooms</span>
              <span>Streaming-ready delivery</span>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
