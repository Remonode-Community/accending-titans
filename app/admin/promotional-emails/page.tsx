import PromotionalEmailCampaigns from '@/components/admin/promotional-emails/PromotionalEmailCampaigns';

import { noIndexMetadata } from '@/lib/seo/metadata';

export const metadata = noIndexMetadata("Email campaigns", "/admin/promotional-emails");

export default function EmailCampaignsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PromotionalEmailCampaigns />
    </div>
  );
}
