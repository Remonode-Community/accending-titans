import CampaignAnalytics from '@/components/admin/promotional-emails/CampaignAnalytics';

import { noIndexMetadata } from '@/lib/seo/metadata';

export const metadata = noIndexMetadata("Campaign analytics", "/admin/promotional-emails/campaign/analytics");

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <CampaignAnalytics />
    </div>
  );
}
