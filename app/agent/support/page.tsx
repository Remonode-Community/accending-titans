'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/shared/Spinner';

/**
 * The agent area has its own navigation, but support is one shared desk:
 * every signed-in user raises and tracks tickets on the member surface
 * (`/dashboard/support`), backed by the same `/v1/support` endpoints the
 * backend scopes to the current user. The old placeholder page with
 * hard-coded demo tickets is retired in favour of that real experience.
 */
export default function AgentSupportPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/support');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}
