'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { FilterPanel, type FilterField } from '@/components/shared/FilterPanel';
import { useFilters } from '@/hooks/useFilters';
import { Toast } from '@/utils/toast.utils';
import { Modal } from '@/components/shared/Modal';
import { useAlert } from '@/hooks/useAlert';
import { rewardService } from '@/services/reward.service';
import { AbuseFlag } from '@/types/rewards.types';
import Link from 'next/link';

const flagTypeLabels: Record<string, string> = {
  duplicate_phone: 'Duplicate Phone',
  duplicate_device: 'Duplicate Device',
  suspicious_funding: 'Suspicious Funding',
  self_referral: 'Self Referral',
  reward_farming: 'Reward Farming',
};

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const ABUSE_FLAG_FILTER_FIELDS: FilterField[] = [
  {
    id: 'severity',
    label: 'Severity',
    type: 'select',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
    ],
  },
];

export default function AdminAbuseFlagsPage() {
  const alert = useAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [flags, setFlags] = useState<AbuseFlag[]>([]);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<AbuseFlag | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [error, setError] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const { filters, isOpen, openFilters, closeFilters, applyFilters, resetFilters, hasActiveFilters, getActiveFilterCount } = useFilters({
    fields: ABUSE_FLAG_FILTER_FIELDS,
    onFiltersChange: async () => {
      await loadFlags();
    },
  });

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setIsLoading(true);
      const response = await rewardService.getAllAbuseFlags(20, filters.severity || undefined, undefined, false);
      setFlags(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveClick = (flag: AbuseFlag) => {
    setSelectedFlag(flag);
    setResolutionNotes('');
    setShowResolveModal(true);
  };

  const handleResolveFlag = async () => {
    if (!selectedFlag || !resolutionNotes.trim()) {
      setError('Please enter resolution notes');
      return;
    }

    try {
      setIsResolving(true);
      setError('');
      await rewardService.resolveAbuseFlag(selectedFlag.id, resolutionNotes);
      alert.success('Flag resolved successfully');
      setShowResolveModal(false);
      loadFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve flag');
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={5} />;
  }

  const unresolved = flags.filter((f) => !f.resolved_at);
  const highSeverity = flags.filter((f) => f.severity === 'high' && !f.resolved_at);

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#090707] dark:text-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Abuse Flag Management</h1>
        <p className="mt-2 text-gray-600">Monitor and resolve suspicious account activity</p>
      </div>

      {/* Alert for High Severity */}
      {highSeverity.length > 0 && (
        <Card className="border border-red-200 bg-red-50">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">⚠️ Action Required</h3>
              <p className="text-sm text-red-800 mt-1">
                {highSeverity.length} high severity flag{highSeverity.length > 1 ? 's' : ''} require immediate attention
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Unresolved Flags</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{unresolved.length}</h3>
            </div>
            <AlertCircle className="h-10 w-10 text-yellow-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">High Severity</p>
              <h3 className="text-3xl font-bold text-red-600 mt-2">{highSeverity.length}</h3>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Flags</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{flags.length}</h3>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Filter Button */}
      <div className="flex gap-2">
        <Button onClick={openFilters} variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
        </Button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        title="Filter Abuse Flags"
        description="Filter flags by severity level to prioritize review."
        isOpen={isOpen}
        fields={ABUSE_FLAG_FILTER_FIELDS}
        onApply={applyFilters}
        onClose={closeFilters}
        onReset={resetFilters}
      />

      {/* Flags Table */}
      {flags.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Flag Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Flagged Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {flags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/users/${flag.user.id}`}>
                        <p className="text-sm font-medium text-[#4a5ff7] hover:underline">{flag.user.name}</p>
                        <p className="text-xs text-gray-600">{flag.user.email}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                        {flagTypeLabels[flag.flag_type] || flag.flag_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${severityColors[flag.severity]}`}
                      >
                        {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(flag.created_at).toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${flag.resolved_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {flag.resolved_at ? 'Resolved' : 'Unresolved'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!flag.resolved_at && (
                        <Button
                          onClick={() => handleResolveClick(flag)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">No unresolved flags found</p>
        </Card>
      )}

      {/* Resolve Flag Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Resolve Abuse Flag"
      >
        {selectedFlag && (
          <div className="space-y-4">
            <Card className="bg-gray-50 border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">User:</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedFlag.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Flag Type:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {flagTypeLabels[selectedFlag.flag_type]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Severity:</span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${severityColors[selectedFlag.severity]}`}>
                    {selectedFlag.severity}
                  </span>
                </div>
              </div>
            </Card>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution Notes</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the resolution action taken..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a5ff7]"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleResolveFlag}
                isLoading={isResolving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Resolve Flag
              </Button>
              <Button onClick={() => setShowResolveModal(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
