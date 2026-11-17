'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { userService } from '@/services/auth.service';
import { useAlert } from '@/hooks/useAlert';
import { useRouter } from 'next/navigation';

interface DeleteFormData {
  password: string;
  reason: string;
}

export function AccountDeletion() {
  const router = useRouter();
  const { success, error: showError } = useAlert();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<DeleteFormData>({
    defaultValues: {
      password: '',
      reason: '',
    },
  });

  const password = watch('password');
  const isConfirmChecked = deleteConfirmation === 'DELETE_MY_ACCOUNT';

  const onDelete = async (data: DeleteFormData) => {
    if (!isConfirmChecked) {
      showError('Please confirm that you want to delete your account');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await userService.deleteAccount(data.password, data.reason);

      if (response.success) {
        success('Account deletion requested successfully. You will be logged out.');
        setTimeout(() => {
          // Redirect to login after showing success
          router.push('/auth/login');
        }, 2000);
      } else {
        showError(response.message || 'Failed to delete account');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while deleting your account');
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900/60 dark:bg-red-950/30 sm:p-8">
        <div className="flex gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-red-900 dark:text-red-300">
              Important: Account Deletion
            </h3>
            <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-200">
              Deleting your account is permanent and cannot be undone. All your personal data, transaction history, and wallet balance will be deleted from our active systems.
            </p>
          </div>
        </div>
      </Card>

      {/* Data Deletion Information */}
      <Card className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm dark:border-[#28251e] dark:bg-[#1b1a16] sm:p-8">
        <h3 className="text-xl font-black tracking-tight text-[#111] dark:text-gray-100">
          What Happens When You Delete Your Account
        </h3>

        <div className="mt-6 space-y-4">
          <div className="rounded-[24px] border border-black/5 bg-[#f8f8f8] p-5 dark:border-[#28251e] dark:bg-[#24221c]">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-black text-[#111] dark:text-gray-100">Data Deleted Immediately</p>
                <p className="mt-1 text-sm text-black/50 dark:text-gray-300">
                  Your personal information, transaction records, and account settings will be permanently removed from our active database.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/5 bg-[#f8f8f8] p-5 dark:border-[#28251e] dark:bg-[#24221c]">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-black text-[#111] dark:text-gray-100">30-Day Recovery Period</p>
                <p className="mt-1 text-sm text-black/50 dark:text-gray-300">
                  Your account can be recovered within 30 days of deletion. After 30 days, your account and all associated data will be permanently and irreversibly deleted.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/5 bg-[#f8f8f8] p-5 dark:border-[#28251e] dark:bg-[#24221c]">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-black text-[#111] dark:text-gray-100">Retained for Legal Compliance</p>
                <p className="mt-1 text-sm text-black/50 dark:text-gray-300">
                  Certain transaction records may be retained as required by law and financial regulations. These records are kept separate from your personal data and cannot be used to identify you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Deletion Form */}
      <Card className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm dark:border-[#28251e] dark:bg-[#1b1a16] sm:p-8">
        <h3 className="text-xl font-black tracking-tight text-[#111] dark:text-gray-100">
          Request Account Deletion
        </h3>

        <p className="mt-2 text-sm leading-6 text-black/50 dark:text-gray-300">
          To delete your account, enter your password and confirm your request. You'll receive an email confirmation.
        </p>

        <form onSubmit={handleSubmit(() => setShowConfirmModal(true))} className="mt-6 space-y-6">
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          <div>
            <label className="mb-2 block text-sm font-black text-[#111] dark:text-gray-100">
              Reason for Deletion (Optional)
            </label>
            <textarea
              placeholder="Tell us why you're deleting your account (this helps us improve)"
              rows={3}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#111] outline-none transition placeholder:text-black/35 focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/10 dark:border-[#302b20] dark:bg-[#24221c] dark:text-gray-100 dark:placeholder:text-gray-500"
              {...register('reason')}
            />
          </div>

          <Button
            type="submit"
            disabled={!password}
            className="h-11 rounded-xl bg-red-600 px-6 font-black text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Request Account Deletion
          </Button>
        </form>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setDeleteConfirmation('');
          }}
          title="Confirm Account Deletion"
        >
          <div className="space-y-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
              <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                This action cannot be undone. Your account will be deleted permanently after 30 days.
              </p>
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmChecked}
                  onChange={(e) =>
                    setDeleteConfirmation(e.target.checked ? 'DELETE_MY_ACCOUNT' : '')
                  }
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-600"
                />
                <span className="text-sm text-black/70 dark:text-gray-300">
                  I understand that this action will delete my account and all associated data.
                  I confirm that I want to delete my account permanently.
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit(onDelete)}
                isLoading={isDeleting}
                className="flex-1 h-11 rounded-xl bg-red-600 px-6 font-black text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
              >
                Delete Account
              </Button>

              <Button
                onClick={() => {
                  setShowConfirmModal(false);
                  setDeleteConfirmation('');
                }}
                variant="outline"
                className="flex-1 h-11 rounded-xl border-black/10 px-6 font-black text-[#111] hover:bg-[#f8f8f8] dark:border-[#302b20] dark:text-gray-100 dark:hover:bg-[#24221c]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
