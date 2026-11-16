import type { ApiResponse } from '@/types/api.types';

/**
 * Turning an API refusal into something a member can act on.
 *
 * The API answers every denial with the standard `{ success, message }`
 * envelope plus fields that say *why*: `error_code`, `feature`, and — for
 * entitlement failures — `required`. The client used to drop all of it.
 * `api-client` rejects with a plain object rather than an `Error`, so every
 * `err instanceof Error ? err.message : '<generic>'` call site silently fell
 * through to its fallback, and the member was told "Something went wrong"
 * when the real answer was "your plan does not include this".
 *
 * This module is the single place that reads those fields, so the modal, the
 * banners, the toasts and the inline errors all word a refusal the same way
 * and offer the right next step — permission, subscription, plan upgrade and
 * administrator-disabled are four different problems and must not read alike.
 *
 * It deliberately imports nothing but types: `api-client` uses it to build
 * the stored 403 payload, and pulling the feature store in here would close
 * an import cycle through `platform-settings.service`.
 */

/** Why the member was refused, in the order the app branches on it. */
export type AccessDeniedKind =
  /** No active subscription at all — there is nothing to upgrade *from*. */
  | 'subscription'
  /** Has a plan, but that plan does not include the feature. */
  | 'upgrade'
  /** An administrator switched the feature off platform-wide. */
  | 'disabled'
  /** A genuine role/permission refusal, unrelated to billing. */
  | 'permission'
  /** Anything the API did not label — a fault, not a refusal. */
  | 'unknown';

export interface AccessDeniedAction {
  label: string;
  href: string;
}

export interface AccessDenied {
  kind: AccessDeniedKind;
  /** Heading: names the resource and the reason. */
  title: string;
  /** The full explanation, preferring the server's own wording. */
  message: string;
  /** Primary next step, when there is a useful one. */
  action?: AccessDeniedAction;
  /** The way out, offered whenever there is somewhere to go back to. */
  secondaryAction?: AccessDeniedAction;
}

/**
 * Mirrors `config/features.php`, so a refusal names the feature exactly the
 * way the sidebar does. The server already sends its own label inside
 * `message`; this is the fallback for composed wording and for `title`.
 */
const FEATURE_LABELS: Record<string, string> = {
  catalogue: 'Business Catalogue',
  subscriptions: 'Subscription',
  wallet: 'Wallet',
  birthdays: 'Birthdays',
  network: 'Member Network',
  content: 'Submit Content',
  rankings: 'Rankings',
  referrals: 'Referral Program',
  messages: 'Messages',
  opportunities: 'Opportunities',
};

const DASHBOARD: AccessDeniedAction = { label: 'Back to dashboard', href: '/dashboard' };
const VIEW_PLANS: AccessDeniedAction = { label: 'View plans', href: '/dashboard/subscriptions' };
const CONTACT_SUPPORT: AccessDeniedAction = { label: 'Contact support', href: '/dashboard/support' };

/** Human-readable name for a feature key, falling back to a capitalised key. */
export function featureLabel(key?: string | null): string {
  if (!key) return 'This feature';
  return (
    FEATURE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
  );
}

/** The fields `api-client` carries on a rejected request. */
interface DenialFields {
  message?: string;
  /** Set aside by the idempotency handler when it rewrites `message`. */
  originalMessage?: string;
  error_code?: string;
  feature?: string;
  required?: 'subscription' | 'upgrade';
  status?: number;
}

function readDenial(err: unknown): DenialFields {
  if (typeof err === 'string') return { message: err };
  if (err instanceof Error) return { message: err.message };
  if (err && typeof err === 'object') return err as DenialFields;
  return {};
}

/**
 * Describe a refusal so a member learns *why* they cannot proceed.
 *
 * `fallback` is only used when the API labelled nothing useful — a dropped
 * connection must not be reported as an access problem, and an access problem
 * must not be reported as "Something went wrong".
 */
export function describeAccessDenied(
  err: unknown,
  fallback?: string,
): AccessDenied {
  const { message, originalMessage, error_code, feature, required, status } =
    readDenial(err);

  const label = featureLabel(feature);
  const server = (message || originalMessage || '').trim();

  // ── Entitlement: the member is allowed to use the app, just not this. ──
  if (error_code === 'PLAN_REQUIRED' || required) {
    if (required === 'subscription') {
      return {
        kind: 'subscription',
        title: `Unlock ${label}`,
        message:
          server ||
          `Access to ${label} is included in a membership plan. Choose a plan to get started.`,
        action: VIEW_PLANS,
        secondaryAction: DASHBOARD,
      };
    }

    return {
      kind: 'upgrade',
      title: `${label} is not in your plan`,
      message:
        server ||
        `Your current plan does not include ${label}. Upgrade your plan to access it.`,
      action: VIEW_PLANS,
      secondaryAction: DASHBOARD,
    };
  }

  // ── An administrator turned it off: buying a better plan changes nothing. ──
  if (error_code === 'FEATURE_DISABLED') {
    return {
      kind: 'disabled',
      title: `${label} is unavailable`,
      message:
        server || `${label} is temporarily switched off. Please check back later.`,
      secondaryAction: DASHBOARD,
    };
  }

  // ── A real permission refusal: nothing to buy, nothing to retry. ──
  if (
    error_code === 'PERMISSION_DENIED' ||
    error_code === 'FORBIDDEN' ||
    status === 403
  ) {
    return {
      kind: 'permission',
      title: 'You do not have access to this',
      message:
        server ||
        'Your account does not have permission to use this part of the app. If you believe that is a mistake, contact support.',
      action: CONTACT_SUPPORT,
      secondaryAction: DASHBOARD,
    };
  }

  // ── Not a refusal at all. Prefer our own wording over a transport string
  //    like "Network Error" or "Request failed with status code 500", which
  //    tell the member nothing they can act on. A body that carried no
  //    `error_code` at all (the plain `success: false` envelope) is trusted,
  //    because there the server deliberately wrote a message for the member. ──
  const labelled = Boolean(
    (error_code && error_code !== 'UNKNOWN_ERROR') ||
      feature ||
      (!error_code && server),
  );

  return {
    kind: 'unknown',
    title: 'Something went wrong',
    message:
      (labelled ? server : '') ||
      fallback ||
      'We could not complete that request. Please try again.',
  };
}

/**
 * Just the sentence, for surfaces that can only render a string — toasts and
 * the `error` fields of the older hooks.
 */
export function accessDeniedMessage(err: unknown, fallback: string): string {
  return describeAccessDenied(err, fallback).message;
}

/** Whether this failure is worth rendering as an access explanation. */
export function isAccessDenied(err: unknown): boolean {
  return describeAccessDenied(err).kind !== 'unknown';
}

/** Narrow an API payload to the fields this module reads. */
export type AccessDeniedPayload = Pick<
  ApiResponse,
  'message' | 'error_code' | 'feature' | 'required'
> & { status?: number };
