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
            title="Log in to Music City"
            description="Use email or social login to access your account."
          />
          <AuthPanel />
        </div>
      </PageContainer>
    </section>
  );
}
