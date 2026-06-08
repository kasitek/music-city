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
            title="Commercial flows belong beside backend entitlement rules."
            description="The marketplace surface should stay readable while the server owns product rules, payment state, and access enforcement."
          />
          <MarketplaceOverview />
        </div>
      </PageContainer>
    </section>
  );
}
