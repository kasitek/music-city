import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { MarketplaceOverview } from "@/features/marketplace/components/marketplace-overview";

export default function MarketplacePage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Marketplace"
            title="Explore the marketplace"
            description="Browse releases, discover drops, and unlock access to music."
          />
          <MarketplaceOverview />
        </div>
      </PageContainer>
    </section>
  );
}
