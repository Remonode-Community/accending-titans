'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' for destructive actions, 'primary' otherwise. */
  tone?: 'danger' | 'primary';
  icon?: ElementType;
}

/**
 * Confirmation dialog for destructive or irreversible actions.
 *
 * The buttons are frozen while the action is in flight so a slow request
 * cannot be double-submitted.
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  icon,
}: ConfirmDialogProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isConfirming ? () => undefined : onClose}
      title={title}
      size="sm"
      icon={icon ?? AlertTriangle}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
              tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#C9A84C] hover:bg-[#B8962E]'
            }`}
          >
            {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
            {isConfirming ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-gray-600">{message}</p>
    </Modal>
  );
};
