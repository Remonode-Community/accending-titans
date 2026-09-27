'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpDown,
  Briefcase,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Grid3x3,
  Image as ImageIcon,
  List,
  Loader2,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { ProtectedPageWrapper } from '@/components/ProtectedPageWrapper';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Modal } from '@/components/shared/Modal';
import { BusinessProfileForm } from '@/components/catalogue/BusinessProfileForm';
import { useMyCatalogue } from '@/hooks/useMyCatalogue';
import { formatCurrency } from '@/utils/format.utils';
import type {
  AddPortfolioItemRequest,
  PortfolioItem,
  UpdatePortfolioItemRequest,
} from '@/types/portfolio.types';

// ── Local view state ─────────────────────────────────────────────────────────
type ViewMode = 'grid' | 'list';
type SortKey = 'newest' | 'oldest' | 'name_asc' | 'price_high' | 'price_low';

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  name_asc: 'Name (A–Z)',
  price_high: 'Price (high to low)',
  price_low: 'Price (low to high)',
};

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#C9A84C] focus:bg-white focus:ring-2 focus:ring-[#C9A84C]/10';

// ── Status badge ─────────────────────────────────────────────────────────────
// The API models visibility as a single is_active flag, so the UI shows the two
// states the backend can actually store.
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
      isActive
        ? 'border-green-100 bg-green-50 text-green-700'
        : 'border-gray-200 bg-gray-50 text-gray-500'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
    {isActive ? 'Active' : 'Hidden'}
  </span>
);

// ── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
  <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-400">{sub}</p>
      </div>
      <div className={`rounded-xl ${iconBg} p-2.5`}>
        <Icon size={18} className={iconColor} />
      </div>
    </div>
  </div>
);

interface ItemActions {
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
  onToggleStatus: (item: PortfolioItem) => void;
}

// ── Item card (grid view) ───────────────────────────────────────────────────
const ItemCard: React.FC<{ item: PortfolioItem } & ItemActions> = ({
  item,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const cover = item.image_urls?.[0];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9A84C]/30 hover:shadow-md">
      {/* Image */}
      <div className="relative h-40 flex-shrink-0 overflow-hidden bg-gray-50">
        {cover ? (
          // Member-supplied host, so the optimiser is bypassed.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={28} className="text-gray-200" />
          </div>
        )}

        {/* Type badge */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold capitalize text-gray-600 backdrop-blur-sm">
          {item.item_type === 'product' ? <Package size={11} /> : <Briefcase size={11} />}
          {item.item_type}
        </span>

        {/* Menu */}
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-500 backdrop-blur-sm transition hover:text-gray-900"
            aria-label="Item actions"
          >
            <MoreVertical size={13} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onEdit(item);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Pencil size={12} /> Edit item
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleStatus(item);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  {item.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                  {item.is_active ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(item);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3 className="text-sm font-black leading-tight text-gray-900">{item.title}</h3>
        </div>

        <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-400">
          {item.description || 'No description yet.'}
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {item.image_urls?.length > 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
              {item.image_urls.length} images
            </span>
          )}
          <StatusBadge isActive={item.is_active} />
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm font-black text-gray-900">
            {item.price !== null && item.price !== undefined
              ? formatCurrency(item.price)
              : 'Price on request'}
          </span>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="text-xs font-semibold text-[#C9A84C] transition hover:text-[#B8962E]"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Item row (list view) ────────────────────────────────────────────────────
const ItemRow: React.FC<{ item: PortfolioItem } & ItemActions> = ({
  item,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const cover = item.image_urls?.[0];

  return (
    <div className="flex items-center gap-4 border-b border-gray-50 px-5 py-4 transition last:border-0 hover:bg-[#FDFAF3]/40">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon size={16} className="text-gray-200" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-gray-900">{item.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
          <span className="capitalize">{item.item_type}</span>
          {item.description && (
            <>
              <span>·</span>
              <span className="truncate">{item.description}</span>
            </>
          )}
        </p>
      </div>

      <span className="hidden shrink-0 text-sm font-black text-gray-900 sm:block">
        {item.price !== null && item.price !== undefined
          ? formatCurrency(item.price)
          : 'On request'}
      </span>

      <StatusBadge isActive={item.is_active} />

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onToggleStatus(item)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label={item.is_active ? 'Unpublish item' : 'Publish item'}
          title={item.is_active ? 'Unpublish' : 'Publish'}
        >
          {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Edit item"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Delete item"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState: React.FC<{
  onAdd: () => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  hasProfile: boolean;
}> = ({ onAdd, hasFilters, onClearFilters, hasProfile }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-6 py-20 text-center shadow-sm">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C9A84C]/20 bg-[#FDFAF3]">
      <Store size={26} className="text-[#C9A84C]" />
    </div>
    <h3 className="text-lg font-black text-gray-900">
      {!hasProfile
        ? 'Set up your business first'
        : hasFilters
          ? 'No items match your filters'
          : 'Your catalogue is empty'}
    </h3>
    <p className="mt-1.5 max-w-sm text-sm text-gray-400">
      {!hasProfile
        ? 'Add your business details, then start listing the products and services you offer.'
        : hasFilters
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Start building your storefront by adding your first product or service.'}
    </p>
    {hasProfile && (
      <button
        type="button"
        onClick={hasFilters ? onClearFilters : onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E]"
      >
        {hasFilters ? <X size={14} /> : <Plus size={14} />}
        {hasFilters ? 'Clear filters' : 'Add your first item'}
      </button>
    )}
  </div>
);

// ── Add / edit modal ─────────────────────────────────────────────────────────
interface ItemModalProps {
  isOpen: boolean;
  item: PortfolioItem | null;
  onClose: () => void;
  onSave: (payload: AddPortfolioItemRequest | UpdatePortfolioItemRequest) => Promise<boolean>;
  onUploadImage: (file: File) => Promise<string>;
  isSaving: boolean;
}

const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
  onUploadImage,
  isSaving,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [price, setPrice] = useState('');
  const [dmLink, setDmLink] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setTitle(item?.title ?? '');
    setDescription(item?.description ?? '');
    setItemType(item?.item_type ?? 'product');
    setPrice(item?.price !== null && item?.price !== undefined ? String(item.price) : '');
    setDmLink(item?.whatsapp_dm_link ?? '');
    setImages(item?.image_urls ?? []);
    setIsActive(item?.is_active ?? true);
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = 'Enter a name of at least 2 characters.';
    if (price.trim() !== '' && (Number.isNaN(Number(price)) || Number(price) < 0)) {
      next.price = 'Enter a valid price, or leave blank.';
    }
    if (dmLink.trim() !== '' && !/^https?:\/\/.+/i.test(dmLink.trim())) {
      next.dmLink = 'Enter a full link starting with http:// or https://';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const ok = await onSave({
      title: title.trim(),
      description: description.trim() || null,
      item_type: itemType,
      price: price.trim() === '' ? null : Number(price),
      image_urls: images,
      whatsapp_dm_link: dmLink.trim() || null,
      is_active: isActive,
    });

    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => undefined : onClose}
      title={item ? 'Edit item' : 'Add item'}
      icon={item ? Pencil : Plus}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="catalogue-item-form"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] disabled:opacity-60 sm:w-auto"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {item ? 'Save changes' : 'Add item'}
          </button>
        </>
      }
    >
      <form id="catalogue-item-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-700" htmlFor="m-title">
            Item name <span className="text-red-400">*</span>
          </label>
          <input
            id="m-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((p) => ({ ...p, title: '' }));
            }}
            placeholder="e.g. Premium Leather Bag"
            className={`${inputClass} ${errors.title ? 'border-red-300' : ''}`}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-700" htmlFor="m-desc">
            Description
          </label>
          <textarea
            id="m-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe this item…"
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700" htmlFor="m-type">
              Type
            </label>
            <select
              id="m-type"
              value={itemType}
              onChange={(e) => setItemType(e.target.value as 'product' | 'service')}
              className={inputClass}
            >
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700" htmlFor="m-price">
              Price (NGN)
            </label>
            <input
              id="m-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setErrors((p) => ({ ...p, price: '' }));
              }}
              placeholder="Blank if on request"
              className={`${inputClass} ${errors.price ? 'border-red-300' : ''}`}
            />
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-700" htmlFor="m-dm">
            WhatsApp enquiry link
          </label>
          <input
            id="m-dm"
            value={dmLink}
            onChange={(e) => {
              setDmLink(e.target.value);
              setErrors((p) => ({ ...p, dmLink: '' }));
            }}
            placeholder="https://wa.me/2348012345678"
            className={`${inputClass} ${errors.dmLink ? 'border-red-300' : ''}`}
          />
          {errors.dmLink && <p className="mt-1 text-xs text-red-500">{errors.dmLink}</p>}
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-gray-700">Photos</span>
          <ItemImagesEditor value={images} onChange={setImages} onUpload={onUploadImage} disabled={isSaving} />
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#C9A84C]"
          />
          <span className="text-sm text-gray-700">Visible in my public catalogue</span>
        </label>
      </form>
    </Modal>
  );
};

/** Multi-image editor kept local to preserve the original modal layout. */
const ItemImagesEditor: React.FC<{
  value: string[];
  onChange: (urls: string[]) => void;
  onUpload: (file: File) => Promise<string>;
  disabled: boolean;
}> = ({ value, onChange, onUpload, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    setBusy(true);
    try {
      const next = [...value];
      for (const file of Array.from(files)) {
        if (next.length >= 5) break;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError('Only JPG, PNG or WebP images are supported.');
          continue;
        }
        if (file.size > 4 * 1024 * 1024) {
          setError('Images must be 4MB or smaller.');
          continue;
        }
        try {
          next.push(await onUpload(file));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed.');
        }
      }
      onChange(next);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-white/95 text-gray-600 shadow-sm transition hover:bg-red-600 hover:text-white"
                aria-label={`Remove image ${i + 1}`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {value.length < 5 && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 text-gray-400 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus size={16} />
                <span className="text-[10px] font-semibold">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {error ? (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : (
        <p className="mt-1.5 text-[11px] text-gray-400">
          JPG, PNG or WebP up to 4MB. Up to 5 images.
        </p>
      )}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CataloguePage() {
  const {
    portfolio,
    items,
    canManage,
    isLoading,
    isSavingProfile,
    savingItemId,
    error,
    refresh,
    saveProfile,
    addItem,
    updateItem,
    deleteItem,
    toggleItemActive,
    uploadImage,
  } = useMyCatalogue();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'hidden' | ''>('');
  const [typeFilter, setTypeFilter] = useState<'product' | 'service' | ''>('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);

  const hasProfile = Boolean(portfolio);
  const hasFilters = Boolean(search || statusFilter || typeFilter);

  // A brand-new member has no business profile, and the API requires one
  // before items can be added — so open the form for them automatically.
  useEffect(() => {
    if (!isLoading && !hasProfile) setProfileOpen(true);
  }, [isLoading, hasProfile]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter === 'active') result = result.filter((i) => i.is_active);
    if (statusFilter === 'hidden') result = result.filter((i) => !i.is_active);
    if (typeFilter) result = result.filter((i) => i.item_type === typeFilter);

    const byDate = (a: PortfolioItem, b: PortfolioItem) =>
      new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();

    switch (sortKey) {
      case 'newest':
        result.sort(byDate);
        break;
      case 'oldest':
        result.sort((a, b) => -byDate(a, b));
        break;
      case 'name_asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
        break;
      case 'price_low':
        result.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
        break;
    }

    return result;
  }, [items, search, statusFilter, typeFilter, sortKey]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((i) => i.is_active).length,
      hidden: items.filter((i) => !i.is_active).length,
      value: items.reduce((sum, i) => sum + (i.price ?? 0), 0),
    }),
    [items],
  );

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = async (
    payload: AddPortfolioItemRequest | UpdatePortfolioItemRequest,
  ): Promise<boolean> => {
    if (editingItem) return updateItem(editingItem.id, payload as UpdatePortfolioItemRequest);
    return addItem(payload as AddPortfolioItemRequest);
  };

  if (isLoading) {
    return (
      <ProtectedPageWrapper>
        <PageSkeleton />
      </ProtectedPageWrapper>
    );
  }

  return (
    <ProtectedPageWrapper>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-gray-900">
              <ShoppingBag className="h-5 w-5 text-[#C9A84C]" />
              Business Catalogue
            </h1>
            <p className="mt-1 text-sm text-gray-400">Showcase and manage your products and services.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Jump to the member's public catalogue page */}
            {portfolio && (
              <Link
                href={`/catalogue/${portfolio.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View my public catalogue page"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
              >
                <ExternalLink size={15} />
                <span className="hidden sm:inline">View public page</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <Store size={15} />
              Business profile
              {portfolio && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    portfolio.is_approved ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  title={portfolio.is_approved ? 'Live' : 'Hidden by an admin'}
                />
              )}
            </button>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canManage || !hasProfile}
              title={!hasProfile ? 'Set up your business profile first' : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#C9A84C]/20 transition hover:bg-[#B8962E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add item
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="flex-1 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total items"
            value={stats.total}
            sub="In your catalogue"
            icon={ShoppingBag}
            iconBg="bg-[#FDFAF3]"
            iconColor="text-[#C9A84C]"
          />
          <StatCard
            label="Active"
            value={stats.active}
            sub="Visible to customers"
            icon={Eye}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            label="Hidden"
            value={stats.hidden}
            sub="Not published"
            icon={EyeOff}
            iconBg="bg-gray-50"
            iconColor="text-gray-400"
          />
          <StatCard
            label="Catalogue value"
            value={formatCurrency(stats.value)}
            sub="Combined listed price"
            icon={Tag}
            iconBg="bg-[#FDFAF3]"
            iconColor="text-[#C9A84C]"
          />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items"
              aria-label="Search items"
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'hidden' | '')}
              aria-label="Filter by status"
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 outline-none transition hover:border-[#C9A84C]/30 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'product' | 'service' | '')}
              aria-label="Filter by type"
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 outline-none transition hover:border-[#C9A84C]/30 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/10"
            >
              <option value="">All types</option>
              <option value="product">Products</option>
              <option value="service">Services</option>
            </select>

            {/* Sort */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-[#C9A84C]/30"
              >
                <ArrowUpDown size={12} />
                {SORT_LABELS[sortKey]}
                <ChevronDown size={12} className="text-gray-400" />
              </button>

              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSortKey(key);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-semibold transition ${
                          sortKey === key ? 'text-[#C9A84C]' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {SORT_LABELS[key]}
                        {sortKey === key && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-[#C9A84C] shadow-sm' : 'text-gray-400'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-[#C9A84C] shadow-sm' : 'text-gray-400'
                }`}
                aria-label="List view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {filteredItems.length === 0 ? (
          <EmptyState
            onAdd={handleAdd}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            hasProfile={hasProfile}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onToggleStatus={toggleItemActive}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
            {filteredItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onToggleStatus={toggleItemActive}
              />
            ))}
          </div>
        )}

        {/* ── Business profile modal ── */}
        <Modal
          isOpen={profileOpen}
          onClose={isSavingProfile ? () => undefined : () => setProfileOpen(false)}
          title="Business profile"
          subtitle="How your business appears in the public catalogue."
          icon={Store}
          size="lg"
          footer={
            <>
              {portfolio && (
                <Link
                  href={`/catalogue/${portfolio.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#C9A84C]/40 hover:text-[#C9A84C] sm:w-auto sm:mr-auto"
                >
                  <ExternalLink size={14} />
                  View public page
                </Link>
              )}
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                disabled={isSavingProfile}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
              >
                {isSavingProfile ? 'Saving…' : 'Close'}
              </button>
            </>
          }
        >
          <BusinessProfileForm
            portfolio={portfolio}
            isSaving={isSavingProfile}
            disabled={!canManage}
            onSave={saveProfile}
            onUploadImage={(file) => uploadImage(file, 'business')}
          />
        </Modal>

        {/* ── Add/Edit modal ── */}
        <ItemModal
          isOpen={modalOpen}
          item={editingItem}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          onUploadImage={(file) => uploadImage(file, 'items')}
          isSaving={savingItemId !== null}
        />

        {/* ── Delete confirmation ── */}
        <ConfirmDialog
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (!deleteTarget) return;
            const ok = await deleteItem(deleteTarget.id);
            if (ok) setDeleteTarget(null);
          }}
          title="Delete this item?"
          message={
            deleteTarget
              ? `"${deleteTarget.title}" will be permanently removed from your catalogue. This can't be undone.`
              : ''
          }
          confirmLabel="Delete"
        />
      </div>
    </ProtectedPageWrapper>
  );
}
