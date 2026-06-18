import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { CtaSection } from "@/features/home/components/cta-section";
import { HeroSection } from "@/features/home/components/hero-section";
import { PlatformPillars } from "@/features/home/components/platform-pillars";

export default function LandingPage() {
  return (
    <div className="relative -mt-16 min-h-screen overflow-hidden bg-[#060816] pt-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(58,227,168,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.08),transparent_25%),linear-gradient(180deg,#07101f_0%,#040611_55%,#03040c_100%)]" />

      <HeroSection />
      <PlatformPillars />
      <CtaSection />

      <footer className="relative border-t border-white/10 py-10">
        <PageContainer>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
                Music City
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                A release platform for artists who want modern streaming,
                cleaner payouts, and ownership that does not disappear behind
                the platform.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href="/auth">
                Start your release
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
}
