import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { AuthPanel } from "@/features/auth/components/auth-panel";

export default function AuthPage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <PageHero
            eyebrow="Authentication"
            title="Social login now provisions the Stellar wallet for the user."
            description="Dynamic handles the social sign-in and embedded wallet. The backend still verifies identity and issues the application session used by the rest of the product."
          />
          <AuthPanel />
        </div>
      </PageContainer>
    </section>
  );
}
