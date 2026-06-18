import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { AccountOverview } from "@/features/account/components/account-overview";

export default function AccountPage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Account"
            title="Your account"
            description="View your profile, wallet, and recent activity."
          />
          <AccountOverview />
        </div>
      </PageContainer>
    </section>
  );
}
