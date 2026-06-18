import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { TrackDetailOverview } from "@/features/music/components/track-detail-overview";

export default async function StreamTrackPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;

  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Streaming"
            title="Track details"
            description="View release details and start playback from the catalog."
          />
          <TrackDetailOverview trackId={trackId} />
        </div>
      </PageContainer>
    </section>
  );
}
