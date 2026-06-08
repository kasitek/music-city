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
            title="Wallet sign-in now belongs to the server boundary."
            description="The client only coordinates the flow. SEP-10 challenge creation, verification, and session issuance now live in the standalone backend."
          />
          <AuthPanel />
        </div>
      </PageContainer>
    </section>
  );
}
