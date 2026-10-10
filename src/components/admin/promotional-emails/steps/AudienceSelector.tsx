'use client';

import { TargetCriteria } from '@/types/promotional-email.types';
import { Users, Star, Sparkles, Moon, TrendingUp, CheckCircle2 } from 'lucide-react';

interface AudienceSelectorProps {
  criteria: TargetCriteria;
  targetUserCount: number;
  onUpdate: (criteria: TargetCriteria) => void;
}

const AUDIENCE_OPTIONS = [
  {
    id: 'all_users',
    title: 'All Users',
    description: 'Send to all active users',
    icon: Users,
  },
  {
    id: 'tier_level',
    title: 'By Loyalty Tier',
    description: 'Users in a specific loyalty tier',
    icon: Star,
    subfield: 'tier_id',
  },
  {
    id: 'first_time_users',
    title: 'First-Time Users',
    description: 'Recent sign-ups within N days',
    icon: Sparkles,
    subfield: 'days',
  },
  {
    id: 'inactive_users',
    title: 'Inactive Users',
    description: 'No activity for N days',
    icon: Moon,
    subfield: 'days',
  },
  {
    id: 'high_value_users',
    title: 'High-Value Users',
    description: 'Users with minimum transaction count',
    icon: TrendingUp,
    subfield: 'min_transactions',
  },
];

export default function AudienceSelector({
  criteria,
  targetUserCount,
  onUpdate,
}: AudienceSelectorProps) {
  const handleUpdate = (updates: Partial<TargetCriteria>) => {
    onUpdate({
      ...criteria,
      ...updates,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Select Target Audience</h2>
        <p className="mt-1 text-sm text-gray-500">Choose who will receive this campaign.</p>
      </div>

      {/* Audience Options */}
      <div className="space-y-3">
        {AUDIENCE_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          const isSelected = criteria.type === option.id;

          return (
            <div key={option.id}>
              <button
                type="button"
                onClick={() => handleUpdate({ type: option.id as any })}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                  isSelected
                    ? 'border-[#620707] bg-[#fdf2f2]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-[#620707]' : 'bg-gray-100'
                  }`}>
                    <IconComponent size={16} className={isSelected ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isSelected ? 'text-[#620707]' : 'text-gray-900'}`}>
                      {option.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={18} className="text-[#620707] flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>

              {/* Subfields */}
              {isSelected && option.subfield && (
                <div className="mt-2 ml-11 p-4 rounded-lg border border-gray-200 bg-white">
                  {option.subfield === 'tier_id' && (
                    <div>
                      <label htmlFor={`tier-${option.id}`} className="block text-xs font-medium text-gray-600 mb-2">
                        Select tier
                      </label>
                      <select
                        id={`tier-${option.id}`}
                        value={criteria.tier_id || ''}
                        onChange={(e) =>
                          handleUpdate({ tier_id: e.target.value ? parseInt(e.target.value) : undefined })
                        }
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#620707]/20 focus:border-[#620707] transition-colors text-gray-900"
                      >
                        <option value="">Select Tier...</option>
                        <option value="1">Bronze</option>
                        <option value="2">Silver</option>
                        <option value="3">Gold</option>
                        <option value="4">Platinum</option>
                      </select>
                    </div>
                  )}

                  {option.subfield === 'days' && (
                    <div>
                      <label htmlFor={`days-${option.id}`} className="block text-xs font-medium text-gray-600 mb-2">
                        Days: <span className="text-gray-500">{criteria.days || 7} days</span>
                      </label>
                      <input
                        id={`days-${option.id}`}
                        type="number"
                        min="1"
                        value={criteria.days || 7}
                        onChange={(e) => handleUpdate({ days: parseInt(e.target.value) })}
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#620707]/20 focus:border-[#620707] transition-colors text-gray-900"
                      />
                    </div>
                  )}

                  {option.subfield === 'min_transactions' && (
                    <div>
                      <label htmlFor={`transactions-${option.id}`} className="block text-xs font-medium text-gray-600 mb-2">
                        Minimum Transactions: <span className="text-gray-500">{criteria.min_transactions || 10}</span>
                      </label>
                      <input
                        id={`transactions-${option.id}`}
                        type="number"
                        min="1"
                        value={criteria.min_transactions || 10}
                        onChange={(e) => handleUpdate({ min_transactions: parseInt(e.target.value) })}
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#620707]/20 focus:border-[#620707] transition-colors text-gray-900"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {targetUserCount > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              <span className="font-medium">Audience size:</span> This campaign will reach{' '}
              <span className="font-semibold text-green-900">{targetUserCount.toLocaleString()}</span> users
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
