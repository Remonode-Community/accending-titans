'use client';

import { ProtectedPageWrapper } from '@/components/ProtectedPageWrapper';
import { Card } from '@/components/shared/Card';
import { Briefcase } from 'lucide-react';

export default function OpportunitiesPage() {
  return (
    <ProtectedPageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <section>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-[#C9A84C]" /> Opportunities
          </h1>
          <p className="text-sm text-gray-500">Jobs, partnerships, and business opportunities</p>
        </section>

        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-0 shadow-[0_10px_35px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9A84C]/10">
              <Briefcase className="h-7 w-7 text-[#C9A84C]" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              No opportunities available yet
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Check back soon for new job openings and partnership opportunities.
            </p>
          </div>
        </Card>
      </div>
    </ProtectedPageWrapper>
  );
}
