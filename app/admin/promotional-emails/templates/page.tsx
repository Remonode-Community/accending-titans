import EmailTemplatesPage from '@/components/admin/promotional-emails/EmailTemplatesPage';

import { noIndexMetadata } from '@/lib/seo/metadata';

export const metadata = noIndexMetadata("Email templates", "/admin/promotional-emails/templates");

export default function TemplatesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <EmailTemplatesPage />
    </div>
  );
}
