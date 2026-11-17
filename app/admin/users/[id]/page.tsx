'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Mail, MapPin, Phone, UserRound, UsersRound } from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';
import { adminService } from '@/services/admin.service';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/utils/format.utils';
import type { AdminUserDetail } from '@/types/role.types';

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: typeof UserRound;
}) {
  return (
    <div className="flex gap-3 py-3">
      {Icon && <Icon size={18} className="mt-0.5 shrink-0 text-slate-400" />}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-slate-900">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

function dateLabel(value: string | null | undefined): string {
  return value ? formatDate(value) : 'Not available';
}

export default function AdminUserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isAdmin = useMemo(
    () => Boolean(currentUser?.roles?.includes('admin')),
    [currentUser]
  );

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [currentUser, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin || !params.id) return;

    let active = true;
    adminService.getUser(params.id)
      .then((response) => {
        const data = response?.data as { user?: AdminUserDetail } | undefined;
        if (!response?.success || !data?.user) {
          throw new Error(response?.message || 'User profile could not be found.');
        }
        if (active) setProfile(data.user);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load this user profile.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, params.id, reloadKey]);

  const retryProfile = () => {
    setLoading(true);
    setError(null);
    setReloadKey((current) => current + 1);
  };

  if (!isAdmin) return null;

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User profile';
  const accountStatus = profile?.deleted_at
    ? 'Deleted'
    : profile?.is_active
      ? 'Active'
      : 'Inactive';
  const accountStatusVariant = profile?.deleted_at || (profile && !profile.is_active)
    ? 'danger'
    : 'success';

  return (
    <main className="min-h-screen space-y-6 bg-[#f8f8f8] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminHeader
          title={fullName}
          description={profile ? `User #${profile.id} · Member account overview` : 'Review the information available for this user.'}
        />
        <Button type="button" variant="outline" onClick={() => router.push('/admin/users')}>
          <ArrowLeft size={16} /> Back to users
        </Button>
      </div>

      {loading ? (
        <Card><CardBody className="flex min-h-64 items-center justify-center"><Spinner /></CardBody></Card>
      ) : error || !profile ? (
        <Card>
          <CardBody className="space-y-4 py-10 text-center">
            <p role="alert" className="text-sm text-red-700">{error || 'User profile could not be found.'}</p>
            <div className="flex justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/admin/users')}>Back to users</Button>
              <Button type="button" onClick={retryProfile}>Try again</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
          <div className="space-y-6">
            <Card>
              <CardBody className="flex flex-wrap items-center gap-5 p-6">
                {profile.profile_photo_url ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-4 ring-white shadow">
                    <Image
                      src={profile.profile_photo_url}
                      alt={`${fullName} profile`}
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl font-semibold text-amber-800">
                    {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-950">{fullName}</h2>
                    <Badge variant={accountStatusVariant}>{accountStatus}</Badge>
                    <Badge variant={profile.is_verified ? 'success' : 'warning'}>
                      {profile.is_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                  <p className="mt-1 break-all text-sm text-slate-600">{profile.email}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {profile.is_profile_complete ? 'Profile complete' : 'Profile incomplete'}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-slate-900">Contact and personal details</h2>
                <p className="mt-1 text-sm text-slate-500">Only information currently available on this account is shown.</p>
              </CardHeader>
              <CardBody className="grid gap-x-8 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
                <InfoRow label="Email address" value={profile.email} icon={Mail} />
                <InfoRow label="Phone number" value={profile.phone_number} icon={Phone} />
                <InfoRow label="Date of birth" value={profile.dob ? dateLabel(profile.dob) : null} icon={CalendarDays} />
                <InfoRow label="Gender" value={profile.gender} icon={UserRound} />
                {profile.address && (
                  <div className="sm:col-span-2">
                    <InfoRow label="Address" value={profile.address} icon={MapPin} />
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-slate-900">Verification</h2>
                <p className="mt-1 text-sm text-slate-500">Verification status and recorded dates.</p>
              </CardHeader>
              <CardBody className="grid gap-x-8 sm:grid-cols-2">
                <div className="flex items-start gap-3 py-3">
                  <Mail size={18} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                    <p className="mt-1 text-sm font-medium">{profile.email_verified_at ? 'Verified' : 'Not verified'}</p>
                    {profile.email_verified_at && <p className="mt-1 text-xs text-slate-500">{dateLabel(profile.email_verified_at)}</p>}
                  </div>
                </div>
              </CardBody>
            </Card>

            {profile.deleted_at && (
              <Card>
                <CardHeader><h2 className="font-semibold text-slate-900">Account deletion</h2></CardHeader>
                <CardBody className="grid gap-x-8 sm:grid-cols-2">
                  <InfoRow label="Deleted at" value={dateLabel(profile.deleted_at)} icon={Clock3} />
                  <InfoRow label="Deletion requested" value={dateLabel(profile.deletion_requested_at)} icon={CalendarDays} />
                  {profile.deletion_reason && (
                    <div className="sm:col-span-2">
                      <InfoRow label="Reason" value={profile.deletion_reason} />
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader><h2 className="font-semibold text-slate-900">Account at a glance</h2></CardHeader>
              <CardBody className="divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-slate-600">Account status</span>
                  <Badge variant={accountStatusVariant}>{accountStatus}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-slate-600">Profile</span>
                  <span className="text-sm font-medium">{profile.is_profile_complete ? 'Complete' : 'Incomplete'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-slate-600">Email verification</span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    {profile.email_verified_at && <CheckCircle2 size={15} className="text-green-600" />}
                    {profile.email_verified_at ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h2 className="font-semibold text-slate-900">Roles and referrals</h2></CardHeader>
              <CardBody className="space-y-5">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <UserRound size={15} /> Roles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.roles?.length ? profile.roles.map((role) => (
                      <Badge key={role} variant={role === 'admin' ? 'danger' : 'info'}>{role}</Badge>
                    )) : <span className="text-sm text-slate-500">No roles assigned</span>}
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <UsersRound size={15} /> Referrals
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{profile.referral?.total_referrals ?? 0}</p>
                  <p className="text-sm text-slate-500">successful referrals</p>
                  {profile.referral?.code && (
                    <p className="mt-3 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                      Code: {profile.referral.code}
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h2 className="font-semibold text-slate-900">Account timeline</h2></CardHeader>
              <CardBody className="space-y-4">
                <InfoRow label="Joined" value={dateLabel(profile.created_at)} icon={CalendarDays} />
                <InfoRow label="Last updated" value={dateLabel(profile.updated_at)} icon={Clock3} />
              </CardBody>
            </Card>
          </aside>
        </div>
      )}
    </main>
  );
}
