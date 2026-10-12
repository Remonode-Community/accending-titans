'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card, CardBody } from '@/components/shared/Card';

interface TierUpgradeCtaProps {
  currentTierLevel: number;
  canUpgrade?: boolean;
  className?: string;
}

export const TierUpgradeCta: React.FC<TierUpgradeCtaProps> = ({
  currentTierLevel,
  canUpgrade = true,
  className,
}) => {
  const tierNames = ['None', 'Bronze', 'Silver', 'Gold'];
  const nextTierLevel = Math.min(currentTierLevel + 1, 3);
  const nextTierName = tierNames[nextTierLevel];

  if (!canUpgrade || nextTierLevel > 3) {
    return null;
  }

  return (
    <Card className={`border-2 border-[#c9a84c] bg-gradient-to-r from-blue-50 to-purple-50 ${className}`}>
      <CardBody className="py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#c9a84c]" />
            <div>
              <p className="font-semibold text-gray-900">
                Ready to upgrade to <span className="text-[#c9a84c]">{nextTierName}</span>?
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                Complete your profile to unlock exclusive benefits
              </p>
            </div>
          </div>

          <Link href="/dashboard/settings/tier-upgrade">
            <Button variant="primary" className="flex items-center gap-2 whitespace-nowrap">
              Upgrade Now
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
};
