import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { ArtistsOverview } from "@/features/artists/components/artists-overview";

export default function ArtistsPage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Artists"
            title="Discover artists"
            description="Browse artist profiles and explore the music they release on Music City."
          />
          <ArtistsOverview />
        </div>
      </PageContainer>
    </section>
  );
}
