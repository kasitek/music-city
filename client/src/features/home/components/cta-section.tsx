import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";

export const CtaSection = () => {
  return (
    <section className="py-12 sm:py-20">
      <PageContainer>
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(58,227,168,0.14)_40%,rgba(3,4,12,0.92)_78%)] p-8 sm:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-emerald-300">
                Start the next drop
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                Give the release a better first impression.
              </h2>
              <p className="text-base leading-7 text-slate-300 sm:text-lg">
                Bring the masters, shape the access, and launch with something
                that feels closer to a real music moment than another upload
                form.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="rounded-full bg-emerald-400 px-7 text-slate-950 hover:bg-emerald-300"
                size="lg"
              >
                <Link href="/auth">
                  Open artist access
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/discover">Browse music</Link>
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};
