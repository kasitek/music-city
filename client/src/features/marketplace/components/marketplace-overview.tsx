import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  {
    title: "Release access",
    description: "Sell unlocks and subscriptions without turning the buyer experience into an NFT scavenger hunt.",
  },
  {
    title: "Royalty rails",
    description: "Soroban and Stellar state should drive ownership, payout rules, and fan access conditions.",
  },
  {
    title: "Collector drops",
    description: "Permanent assets belong in archival lanes, not in the streaming hot path.",
  },
] as const;

export const MarketplaceOverview = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="border-white/10 bg-white/5 text-white shadow-none"
        >
          <CardHeader>
            <CardTitle className="text-xl">{card.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-300">
            {card.description}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
