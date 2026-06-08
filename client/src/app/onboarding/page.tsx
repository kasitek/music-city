import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";

export default function OnboardingPage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Onboarding"
            title="The onboarding flow is now centered on server-owned user records."
            description="Wallet authentication is only step one. Profile creation, role selection, and release setup should happen through explicit backend APIs."
          />
          <OnboardingForm />
        </div>
      </PageContainer>
    </section>
  );
}
