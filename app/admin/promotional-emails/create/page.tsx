import PromotionalEmailBuilder from '@/components/admin/PromotionalEmailBuilder';

import { noIndexMetadata } from '@/lib/seo/metadata';

export const metadata = noIndexMetadata("Create email campaign", "/admin/promotional-emails/create");

export default function CreateCampaignPage() {
  return <PromotionalEmailBuilder />;
}
