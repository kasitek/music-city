import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { TrackManageOverview } from "@/features/dashboard/components/track-manage-overview";

export default async function DashboardTrackPage({
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
            eyebrow="Track"
            title="Manage release access"
            description="Control whether this song stays private, becomes subscriber-only, or goes fully public."
          />
          <TrackManageOverview trackId={trackId} />
        </div>
      </PageContainer>
    </section>
  );
}
