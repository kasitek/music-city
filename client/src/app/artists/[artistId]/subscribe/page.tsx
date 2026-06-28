import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { ArtistSubscriptionOverview } from "@/features/subscriptions/components/artist-subscription-overview";

export default async function ArtistSubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ artistId: string }>;
  searchParams: Promise<{ trackId?: string }>;
}) {
  const { artistId } = await params;
  const { trackId } = await searchParams;

  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Subscriptions"
            title="Artist subscription"
            description="Review the plan, see what unlocks, and subscribe with your Stellar wallet."
          />
          <ArtistSubscriptionOverview artistId={artistId} trackId={trackId} />
        </div>
      </PageContainer>
    </section>
  );
}
