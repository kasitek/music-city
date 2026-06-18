import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { DiscoverOverview } from "@/features/discover/components/discover-overview";

export default function DiscoverPage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Discover"
            title="Discover music"
            description="Browse featured tracks and find something new to play."
          />
          <DiscoverOverview />
        </div>
      </PageContainer>
    </section>
  );
}
