import Link from "next/link";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";

export const CtaSection = () => {
  return (
    <section className="py-12 sm:py-20">
      <PageContainer>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/15 via-slate-900 to-slate-950 p-8 sm:p-12">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Start your first release
            </h2>
            <p className="text-base leading-7 text-slate-300">
              Create a track, upload your music, and get your catalog ready for listeners.
            </p>
            <Button
              asChild
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
