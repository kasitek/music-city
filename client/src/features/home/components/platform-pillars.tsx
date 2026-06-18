import { Coins, Database, Server, Waves } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    icon: Server,
    title: "Artist control",
    description:
      "Manage your catalog, releases, and access from one place.",
  },
  {
    icon: Coins,
    title: "Simple login",
    description:
      "Use email or social login to get started quickly.",
  },
  {
    icon: Waves,
    title: "Streaming-ready uploads",
    description:
      "Upload original files and prepare them for smooth playback.",
  },
  {
    icon: Database,
    title: "Fan access",
    description:
      "Release music your way, from private drops to broader listening access.",
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
            Built for modern music releases
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
