'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Bell, CheckCircle2, Megaphone, Send, Users } from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import type { AdminUser } from '@/types/api.types';

type SendMode = 'single' | 'selected' | 'all';
type Recipient = Pick<AdminUser, 'id' | 'first_name' | 'last_name' | 'email'> & {
  is_active?: boolean;
};

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

const initialForm = {
  title: '',
  body: '',
  type: 'system',
  priority: 'normal',
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sendMode, setSendMode] = useState<SendMode>('single');
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState<Recipient[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.includes('admin')),
    [user]
  );

  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard');
  }, [user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    adminService.getNotificationStats()
      .then((response) => {
        if (active && response?.success && response.data) {
          setStats(response.data as NotificationStats);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError?.message || 'Unable to load notification statistics.');
        }
      })
      .finally(() => {
        if (active) setLoadingStats(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || sendMode === 'all') return;

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        setLoadingUsers(true);
        const response = await adminService.getUsers(
          1,
          50,
          search.trim() ? { search: search.trim() } : undefined
        );
        const data = response?.data as
          | { users?: Recipient[]; data?: Recipient[] }
          | Recipient[]
          | undefined;
        const recipients = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : Array.isArray(data?.data)
              ? data.data
              : [];
        if (active) setUsers(recipients);
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load recipients.');
        }
      } finally {
        if (active) setLoadingUsers(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isAdmin, search, sendMode]);

  const toggleRecipient = useCallback((id: number) => {
    setSelectedUserIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }, []);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title.trim() || !form.body.trim()) {
      setError('Enter both a title and a message.');
      return;
    }
    if (sendMode === 'single' && !selectedUserId) {
      setError('Choose a recipient.');
      return;
    }
    if (sendMode === 'selected' && selectedUserIds.length === 0) {
      setError('Select at least one recipient.');
      return;
    }
    if (sendMode === 'all' && !window.confirm('Send this notification to every active user?')) {
      return;
    }

    try {
      setSending(true);
      const response = sendMode === 'single'
        ? await adminService.sendNotificationToUser(
            Number(selectedUserId),
            form.title.trim(),
            form.body.trim(),
            form.type,
            form.priority
          )
        : sendMode === 'selected'
          ? await adminService.sendNotificationToUsers(
              selectedUserIds,
              form.title.trim(),
              form.body.trim(),
              form.type,
              form.priority
            )
          : await adminService.sendNotificationToAllUsers(
              form.title.trim(),
              form.body.trim(),
              form.type,
              form.priority
            );

      if (!response?.success) {
        throw new Error(response?.message || 'The notification could not be sent.');
      }

      const count = response.data?.sent ?? (sendMode === 'single' ? 1 : 0);
      setSuccess(`Notification saved for ${count} active user${count === 1 ? '' : 's'}. Push delivery follows each user's notification preferences.`);
      setForm(initialForm);
      setSelectedUserId('');
      setSelectedUserIds([]);

      const refreshedStats = await adminService.getNotificationStats();
      if (refreshedStats?.success && refreshedStats.data) {
        setStats(refreshedStats.data as NotificationStats);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send the notification.');
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) return null;

  const statCards = [
    { label: 'Total notifications', value: stats?.total ?? 0, icon: Bell },
    { label: 'Unread', value: stats?.unread ?? 0, icon: Megaphone },
    { label: 'Read', value: stats?.read ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-[#f8f8f8] p-4 text-slate-950 sm:p-6">
      <AdminHeader
        title="Notifications"
        description="Send a notification to one user, selected users, or all active users."
      />

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Notification totals">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardBody className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                {loadingStats ? (
                  <div className="mt-2"><Spinner /></div>
                ) : (
                  <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
                )}
              </div>
              <span className="rounded-xl bg-amber-50 p-3 text-amber-700">
                <Icon size={20} />
              </span>
            </CardBody>
          </Card>
        ))}
      </section>

      <Card id="notification-composer">
        <CardHeader>
          <h2 className="text-lg font-semibold">Compose notification</h2>
          <p className="mt-1 text-sm text-slate-500">
            In-app messages are saved for recipients. Push is attempted for registered devices when user preferences allow it.
          </p>
        </CardHeader>
        <CardBody>
          <div className="mb-6 grid gap-3 sm:grid-cols-3" role="group" aria-label="Recipient group">
            {([
              ['single', 'One user', 'Send a private message', Users],
              ['selected', 'Selected users', 'Choose multiple recipients', Users],
              ['all', 'All active users', 'Platform-wide announcement', Megaphone],
            ] as const).map(([mode, label, description, Icon]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setSendMode(mode);
                  setError(null);
                  setSuccess(null);
                }}
                aria-pressed={sendMode === mode}
                className={`rounded-xl border p-4 text-left transition ${
                  sendMode === mode
                    ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Icon size={18} /> {label}
                </span>
                <span className="mt-1 block text-sm text-slate-500">{description}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="space-y-5">
            {sendMode !== 'all' && (
              <div className="space-y-3">
                <label htmlFor="recipient-search" className="block text-sm font-medium">
                  Find recipients
                </label>
                <input
                  id="recipient-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
                {loadingUsers ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : sendMode === 'single' ? (
                  <select
                    aria-label="Choose a recipient"
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select an active user</option>
                    {users.filter((recipient) => recipient.is_active !== false).map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.first_name} {recipient.last_name} · {recipient.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                    {users.filter((recipient) => recipient.is_active !== false).length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">No active users found.</p>
                    ) : users.filter((recipient) => recipient.is_active !== false).map((recipient) => (
                      <label key={recipient.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(Number(recipient.id))}
                          onChange={() => toggleRecipient(Number(recipient.id))}
                          className="h-4 w-4 accent-amber-600"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {recipient.first_name} {recipient.last_name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">{recipient.email}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {sendMode === 'selected' && (
                  <p className="text-xs text-slate-500">
                    {selectedUserIds.length} recipient{selectedUserIds.length === 1 ? '' : 's'} selected
                  </p>
                )}
              </div>
            )}

            {sendMode === 'all' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                This announcement will be saved for every active account. Inactive accounts are excluded.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Notification type
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="system">System</option>
                  <option value="update">Update</option>
                  <option value="promotion">Promotion</option>
                  <option value="alert">Alert</option>
                  <option value="transaction">Transaction</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Priority
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium">
              Title
              <input
                required
                maxLength={120}
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="A clear, concise title"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </label>

            <label className="block text-sm font-medium">
              Message
              <textarea
                required
                maxLength={5000}
                rows={5}
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                placeholder="Write the message users will receive"
                className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              <span className="mt-1 block text-right text-xs text-slate-500">{form.body.length}/5000</span>
            </label>

            {error && (
              <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={17} /> {error}
              </p>
            )}
            {success && (
              <p role="status" className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 size={17} /> {success}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" isLoading={sending} disabled={loadingUsers && sendMode !== 'all'}>
                <Send size={16} /> Send notification
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-semibold">Notifications by type</h2></CardHeader>
          <CardBody>
            {Object.keys(stats?.by_type ?? {}).length === 0 ? (
              <p className="text-sm text-slate-500">No notification activity yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats?.by_type ?? {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600">{type.replaceAll('_', ' ')}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Notifications by priority</h2></CardHeader>
          <CardBody>
            {Object.keys(stats?.by_priority ?? {}).length === 0 ? (
              <p className="text-sm text-slate-500">No notification activity yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats?.by_priority ?? {}).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600">{priority}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
