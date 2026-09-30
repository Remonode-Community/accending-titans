'use client';

import Image from 'next/image';
import { AlertTriangle, CheckCircle2, Clock, Flag, MapPin, MessageCircle, X } from 'lucide-react';
import type { Ask } from '@/types/network.types';

const CARD =
  'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]';

const STATUS_META: Record<
  Ask['status'],
  { label: string; className: string }
> = {
  open: { label: 'Open', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  claimed: { label: 'Responded', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  fulfilled: { label: 'Fulfilled', className: 'bg-[#C9A84C]/10 text-[#8A6F1F] border-[#C9A84C]/30' },
  cancelled: { label: 'Closed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

interface Props {
  ask: Ask;
  busy?: boolean;
  onClaim: (id: number) => void;
  onFulfil: (id: number) => void;
  onWithdraw: (id: number) => void;
  onCancel: (id: number) => void;
  onReport: (ask: Ask) => void;
}

/**
 * One ask, with every action the viewer is actually allowed to take.
 *
 * The buttons are driven entirely by `viewer_can_*` flags from the server, not
 * by comparing ids in the client. The server is the only party that knows
 * whether a block exists, so a client-side id comparison would offer actions
 * that are then refused.
 *
 * On contact: `contact.whatsapp` is null unless `contact.is_revealed` is true.
 * There is deliberately no fallback to any other number, because there is no
 * other source the member consented to.
 */
export const AskCard = ({
  ask,
  busy = false,
  onClaim,
  onFulfil,
  onWithdraw,
  onCancel,
  onReport,
}: Props) => {
  const status = STATUS_META[ask.status];
  const isNeed = ask.kind === 'need';

  return (
    <article className={CARD}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${status.className}`}
              >
                {status.label}
              </span>
              <span className="rounded-full bg-[#C9A84C]/10 px-2 py-0.5 text-[11px] font-bold text-[#8A6F1F]">
                {isNeed ? 'Looking for' : 'Offering'}
              </span>
            </div>

            <h3 className="mt-2 text-base font-bold leading-snug text-gray-900">
              {ask.title}
            </h3>

            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {ask.description}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#C9A84C]/15 text-[10px] font-bold text-[#B8962E]">
                  {ask.asker?.profile_photo_url ? (
                    <Image
                      src={ask.asker.profile_photo_url}
                      alt={ask.asker.name}
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    ask.asker?.name.charAt(0).toUpperCase()
                  )}
                </span>
                {ask.asker?.name ?? 'A member'}
              </span>

              {ask.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {ask.city}
                </span>
              )}

              {ask.budget_note && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  {ask.budget_note}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact disclosure. Nothing is rendered unless the server released it. */}
        {ask.contact.is_revealed && ask.contact.whatsapp && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <MessageCircle className="h-4 w-4 shrink-0 text-emerald-700" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-emerald-900">
                {ask.is_own
                  ? 'Your WhatsApp number is visible to this responder'
                  : `${ask.asker?.name} shared their WhatsApp`}
              </p>
              <a
                href={`https://wa.me/${ask.contact.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
              >
                {ask.contact.whatsapp}
              </a>
            </div>
          </div>
        )}

        {ask.contact.is_revealed && !ask.contact.whatsapp && !ask.is_own && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
            <p className="text-xs leading-relaxed text-gray-600">
              This member hasn't chosen to share their number. Try reaching them
              through the platform, or ask another member to introduce you.
            </p>
          </div>
        )}

        {/* Responder, when there is one. */}
        {ask.claimed_by && (
          <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
            {ask.status === 'fulfilled' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#B8962E]" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
            )}
            <p className="text-xs text-gray-600">
              {ask.status === 'fulfilled' ? (
                <>
                  <span className="font-semibold text-gray-900">
                    {ask.claimed_by.name}
                  </span>{' '}
                  helped with this
                </>
              ) : (
                <>
                  <span className="font-semibold text-gray-900">
                    {ask.claimed_by.name}
                  </span>{' '}
                  has responded
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-[#FDFAF3] px-4 py-3 sm:px-5">
        {ask.viewer_can_claim && (
          <ActionButton
            onClick={() => onClaim(ask.id)}
            disabled={busy}
            primary
            icon={MessageCircle}
          >
            I can help
          </ActionButton>
        )}

        {ask.viewer_can_fulfil && (
          <ActionButton
            onClick={() => onFulfil(ask.id)}
            disabled={busy}
            primary
            icon={CheckCircle2}
          >
            Mark as fulfilled
          </ActionButton>
        )}

        {ask.viewer_can_withdraw && (
          <ActionButton onClick={() => onWithdraw(ask.id)} disabled={busy} icon={X}>
            Withdraw
          </ActionButton>
        )}

        {ask.viewer_can_cancel && (
          <ActionButton onClick={() => onCancel(ask.id)} disabled={busy} icon={X}>
            Close ask
          </ActionButton>
        )}

        {!ask.is_own && (
          <button
            type="button"
            onClick={() => onReport(ask)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Flag size={13} />
            Report
          </button>
        )}
      </div>
    </article>
  );
};

const ActionButton = ({
  children,
  onClick,
  disabled,
  primary,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
      primary
        ? 'bg-[#C9A84C] text-white hover:bg-[#B8962E]'
        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
    }`}
  >
    {Icon && <Icon size={13} />}
    {children}
  </button>
);
