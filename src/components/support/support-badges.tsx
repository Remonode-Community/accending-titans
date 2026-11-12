'use client';

import { clsx } from 'clsx';
import {
  CircleDot,
  Clock3,
  MessageCircleQuestion,
  CheckCircle2,
  Lock,
  UserRound,
  ArrowUpRight,
  Flame,
} from 'lucide-react';
import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/types/support.types';

/**
 * Status and priority chips for the support desk.
 *
 * Light and dark palettes are declared together so a chip never reads
 * differently across themes — the dark side uses translucent tints instead
 * of pastel solids, matching the app's dark surfaces.
 */

const STATUS_STYLES: Record<
  SupportTicketStatus,
  { light: string; dark: string; icon: React.ElementType }
> = {
  open: {
    light: 'bg-blue-50 text-blue-700 border-blue-200',
    dark: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    icon: CircleDot,
  },
  in_progress: {
    light: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dark: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    icon: Clock3,
  },
  // The ball is with the member — amber is the app's "you act next" colour.
  awaiting_member: {
    light: 'bg-amber-50 text-amber-700 border-amber-200',
    dark: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    icon: MessageCircleQuestion,
  },
  awaiting_staff: {
    light: 'bg-teal-50 text-teal-700 border-teal-200',
    dark: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    icon: UserRound,
  },
  resolved: {
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dark: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: CheckCircle2,
  },
  closed: {
    light: 'bg-gray-100 text-gray-600 border-gray-200',
    dark: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    icon: Lock,
  },
};

export const TicketStatusBadge = ({
  status,
  label,
  size = 'md',
  className,
}: {
  status: SupportTicketStatus;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}) => {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  const Icon = style.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        style.light,
        style.dark,
        className,
      )}
    >
      <Icon size={size === 'sm' ? 11 : 12} className="shrink-0" />
      {label ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
};

const PRIORITY_STYLES: Record<
  SupportTicketPriority,
  { light: string; dark: string; icon: React.ElementType | null }
> = {
  low: {
    light: 'bg-gray-100 text-gray-600 border-gray-200',
    dark: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    icon: null,
  },
  medium: {
    light: 'bg-blue-50 text-blue-700 border-blue-200',
    dark: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    icon: null,
  },
  high: {
    light: 'bg-orange-50 text-orange-700 border-orange-200',
    dark: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    icon: ArrowUpRight,
  },
  urgent: {
    light: 'bg-red-50 text-red-700 border-red-200',
    dark: 'bg-red-500/10 text-red-300 border-red-500/20',
    icon: Flame,
  },
};

export const TicketPriorityBadge = ({
  priority,
  label,
  className,
}: {
  priority: SupportTicketPriority;
  label?: string;
  className?: string;
}) => {
  const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        style.light,
        style.dark,
        className,
      )}
    >
      {style.icon && <style.icon size={11} className="shrink-0" />}
      {label ?? priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

/** Shared avatar/initials bubble used by the thread and lists. */
export const PersonInitials = ({
  firstName,
  lastName,
  className,
}: {
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
}) => {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <span
      className={clsx(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A84C]/25 bg-[#FDFAF3] text-[11px] font-black text-[#B8962E] dark:border-[#C9A84C]/25 dark:bg-[#C9A84C]/10 dark:text-[#D4B85A]',
        className,
      )}
    >
      {initials}
    </span>
  );
};
