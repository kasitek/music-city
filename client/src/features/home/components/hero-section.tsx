import Link from "next/link";
import { ArrowRight, Radio, ShieldCheck } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <PageContainer>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
              Stellar-native music commerce with a real backend boundary
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                Build the catalog, payout, and streaming rails properly.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Music City is being rebuilt around a standalone Node.js server,
                Stellar wallet authentication, and a storage stack designed for
                large media instead of blockchain gimmicks.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              >
                <Link href="/auth">
                  Connect and continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/discover">Browse the product shape</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-4 flex items-center gap-3 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-[0.2em]">
                  Storage
                </span>
              </div>
              <p className="text-sm leading-7 text-slate-300">
                Original masters stay private in object storage. Streaming
                renditions are encrypted HLS. Arweave is optional and archival,
                not the hot path.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-4 flex items-center gap-3 text-emerald-300">
                <Radio className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-[0.2em]">
                  Access
                </span>
              </div>
              <p className="text-sm leading-7 text-slate-300">
                Wallet sign-in happens through Stellar challenge flow. The
                server decides entitlement, issues short-lived playback access,
                and owns policy.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
