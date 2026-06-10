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
            title="Clean catalog screens should only compose views and ask for data."
            description="The heavy lifting belongs in API clients, server routes, and services. The page just frames the browse experience."
          />
          <DiscoverOverview />
        </div>
      </PageContainer>
    </section>
  );
}
