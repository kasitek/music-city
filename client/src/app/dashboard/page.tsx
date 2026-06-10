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
            title="Artist operations now hang off the backend instead of browser-only state."
            description="This shell is intentionally thin. Uploads, transcoding jobs, entitlements, and release management move behind API modules instead of bloated page files."
          />
          <DashboardOverview />
        </div>
      </PageContainer>
    </section>
  );
}
