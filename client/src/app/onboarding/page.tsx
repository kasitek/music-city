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
            title="Set up your profile"
            description="Choose how you want to appear on Music City so we can tailor your dashboard and public profile."
          />
          <OnboardingForm />
        </div>
      </PageContainer>
    </section>
  );
}
