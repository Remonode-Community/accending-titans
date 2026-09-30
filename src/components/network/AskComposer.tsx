'use client';

import { useState } from 'react';
import { HandHeart, X } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import type { CreateAskRequest } from '@/types/network.types';

interface Props {
  onSubmit: (data: CreateAskRequest) => Promise<boolean>;
  busy?: boolean;
  onDismiss?: () => void;
}

const KINDS = [
  {
    value: 'need' as const,
    label: 'I need something',
    hint: 'A supplier, a partner, a hand with a job.',
  },
  {
    value: 'offer' as const,
    label: 'I am offering something',
    hint: 'A service or product other members need.',
  },
];

/**
 * Composer for a new ask.
 *
 * `budget_note` is a text field with no numeric input and no validation of an
 * amount, on purpose. A money field would make this read as a marketplace,
 * which invites escrow expectations the platform does not honour — the API
 * accepts free text only, and this keeps the client from implying otherwise.
 */
export const AskComposer = ({ onSubmit, busy = false, onDismiss }: Props) => {
  const [kind, setKind] = useState<'need' | 'offer'>('need');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetNote, setBudgetNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim().length >= 5 && description.trim().length >= 15;

  const submit = async () => {
    if (!valid) {
      setError('Add a short title and a sentence or two of detail.');
      return;
    }

    setError(null);

    const ok = await onSubmit({
      kind,
      title: title.trim(),
      description: description.trim(),
      budget_note: budgetNote.trim() || null,
    });

    if (ok) {
      setTitle('');
      setDescription('');
      setBudgetNote('');
      onDismiss?.();
    }
  };

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <HandHeart className="h-5 w-5 text-[#C9A84C]" />
            Post an ask
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Your circle sees this. Conversation happens on WhatsApp — we just
            introduce you.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Kind */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {KINDS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setKind(option.value)}
            className={`rounded-xl border px-3.5 py-2.5 text-left transition ${
              kind === option.value
                ? 'border-[#C9A84C] bg-[#FDFAF3] ring-1 ring-[#C9A84C]/30'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <p className="text-sm font-bold text-gray-900">{option.label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{option.hint}</p>
          </button>
        ))}
      </div>

      {/* Title */}
      <label className="mt-4 block">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Title
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          placeholder={
            kind === 'need'
              ? 'Need a reliable bolt lace supplier'
              : 'I do bulk tailoring, 48-hour turnaround'
          }
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
        />
      </label>

      {/* Detail */}
      <label className="mt-3 block">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Detail
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder="What exactly do you need, and by when? The more specific you are, the better the match."
          className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
        />
      </label>

      {/* Budget note — free text, deliberately not an amount field. */}
      <label className="mt-3 block">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Budget or notes (optional)
        </span>
        <input
          type="text"
          value={budgetNote}
          onChange={(e) => setBudgetNote(e.target.value)}
          maxLength={160}
          placeholder="e.g. around 40–60k, flexible on timing"
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
        />
        <span className="mt-1 block text-xs text-gray-400">
          No money moves through the platform. This is context for whoever
          helps you.
        </span>
      </label>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={submit}
          disabled={busy || !valid}
        >
          {busy ? 'Posting…' : 'Post to my circle'}
        </Button>
        {onDismiss && (
          <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
