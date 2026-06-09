import { Coins, Database, Server, Waves } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    icon: Server,
    title: "Standalone server",
    description:
      "Express + TypeScript backend that owns auth, entitlements, uploads, playback, and storage policy.",
  },
  {
    icon: Coins,
    title: "Embedded Stellar auth",
    description:
      "Social login provisions the Stellar wallet, while the backend still owns the application session.",
  },
  {
    icon: Waves,
    title: "Streaming-first media",
    description:
      "Encrypted HLS in object storage with signed access beats shoving private media into permanent networks.",
  },
  {
    icon: Database,
    title: "Shared contract types",
    description:
      "Client and server speak through one shared package so the API shape does not drift.",
  },
] as const;

export const PlatformPillars = () => {
  return (
    <section className="py-12 sm:py-20">
      <PageContainer>
        <div className="mb-10 max-w-2xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
            Foundation
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            The app is being reorganized around the right boundaries.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-white/10 bg-white/5 text-white shadow-none"
            >
              <CardHeader className="space-y-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </span>
                <CardTitle className="text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-slate-300">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </section>
  );
};
