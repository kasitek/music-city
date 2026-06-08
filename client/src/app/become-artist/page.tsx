import { PageContainer } from "@/components/common/page-container";
import { PageHero } from "@/components/common/page-hero";
import { BecomeArtistOverview } from "@/features/become-artist/components/become-artist-overview";

export default function BecomeArtistPage() {
  return (
    <section className="py-16 sm:py-24">
      <PageContainer>
        <div className="space-y-12">
          <PageHero
            eyebrow="Artist setup"
            title="Artist workflows are being rebuilt for real release operations."
            description="This route now reflects the new direction: storage-first uploads, backend-managed jobs, and Stellar-backed access rules."
          />
          <BecomeArtistOverview />
        </div>
      </PageContainer>
    </section>
  );
}
