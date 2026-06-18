import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

export default function DashboardPage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Dashboard"
            title="Your music"
            description="Create a track and upload your first release."
          />
          <DashboardOverview />
        </div>
      </PageContainer>
    </section>
  );
}
