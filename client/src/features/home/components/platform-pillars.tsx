import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";

const releaseModes = [
  "Open a private room before release day.",
  "Turn a drop public without changing the listening experience.",
  "Keep the catalog clean instead of buried in admin screens.",
] as const;

export const PlatformPillars = () => {
  return (
    <section className="py-12 sm:py-24">
      <PageContainer>
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
            <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src="/images/hero-stage-red.jpg"
                alt="Concert stage with dramatic red lighting"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,4,12,0.12)_0%,rgba(3,4,12,0.45)_48%,rgba(3,4,12,0.9)_100%)]" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="max-w-sm text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Built for the moment a release stops being a file and becomes a scene.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
                Release flow
              </p>
              <h2 className="max-w-xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                Keep the artist energy.
                <span className="block text-white/70">Lose the platform drag.</span>
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Music City is for artists who want their release experience to
                feel sharp, controlled, and fan-facing instead of buried inside
                tooling.
              </p>
            </div>

            <div className="space-y-4 border-y border-white/10 py-6">
              {releaseModes.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 text-base leading-7 text-slate-200"
                >
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  <p>{item}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Access
                </p>
                <p className="mt-3 text-xl font-medium text-white">
                  Social onboarding, wallet-backed ownership, and cleaner entry
                  for non-crypto users.
                </p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Delivery
                </p>
                <p className="mt-3 text-xl font-medium text-white">
                  Private storage for masters, smooth streaming for listeners,
                  and space to grow into premium drops.
                </p>
              </div>
            </div>

            <div>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/discover">
                  See what fans explore
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
