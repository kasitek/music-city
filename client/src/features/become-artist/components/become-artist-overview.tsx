import { MicVocal, ShieldCheck, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: MicVocal,
    title: "Claim your artist account",
    description: "One wallet identity, one server profile, one place to manage releases and rights.",
  },
  {
    icon: Upload,
    title: "Push masters to storage",
    description: "Original files stay private while the backend prepares encrypted streaming outputs.",
  },
  {
    icon: ShieldCheck,
    title: "Control access policy",
    description: "Use Stellar-backed entitlement checks for fan access, sales, subscriptions, and drops.",
  },
] as const;

export const BecomeArtistOverview = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map(({ icon: Icon, title, description }) => (
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
  );
};
