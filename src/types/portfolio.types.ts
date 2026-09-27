/**
 * Business Catalogue types.
 *
 * Mirrors the backend catalogue contract:
 *   member_portfolios  -> Portfolio
 *   portfolio_items    -> PortfolioItem
 *
 * Field names are snake_case because they map 1:1 onto the API payloads.
 */

export type PortfolioItemType = 'product' | 'service';

export interface PortfolioOwner {
  id: number;
  name: string;
  profile_photo_url: string | null;
  /** Only present on the owner/admin projection, never on the public one. */
  email?: string;
  whatsapp_number?: string | null;
}

export interface PortfolioItem {
  id: number;
  title: string;
  description: string | null;
  item_type: PortfolioItemType;
  /** null means "price on request". */
  price: number | null;
  image_urls: string[];
  whatsapp_dm_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

/** Owner + admin projection (includes moderation state). */
export interface Portfolio {
  id: number;
  user_id: number;
  business_name: string;
  business_category: string | null;
  business_description: string | null;
  whatsapp_number: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  is_approved: boolean;
  is_featured: boolean;
  views_count: number;
  items_count: number;
  /** Only loaded on detail views. */
  items?: PortfolioItem[];
  owner?: PortfolioOwner | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Public projection — no moderation state, no owner email. */
export type PublicPortfolio = Omit<
  Portfolio,
  'user_id' | 'is_approved' | 'owner' | 'updated_at'
> & {
  owner?: PortfolioOwner | null;
};

export interface UpsertPortfolioRequest {
  business_name: string;
  business_category?: string | null;
  business_description?: string | null;
  whatsapp_number?: string | null;
  profile_image_url?: string | null;
  cover_image_url?: string | null;
}

export interface AddPortfolioItemRequest {
  title: string;
  description?: string | null;
  item_type?: PortfolioItemType;
  price?: number | null;
  image_urls?: string[];
  whatsapp_dm_link?: string | null;
  is_active?: boolean;
}

export interface UpdatePortfolioItemRequest {
  title?: string;
  description?: string | null;
  item_type?: PortfolioItemType;
  price?: number | null;
  image_urls?: string[];
  whatsapp_dm_link?: string | null;
  is_active?: boolean;
}

export interface ReorderPortfolioItemsRequest {
  item_ids: number[];
}

export interface PortfolioBrowseParams {
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PortfolioCategory {
  name: string;
  count: number;
}

export type CatalogueImageFolder = 'business' | 'items';

export interface UploadedCatalogueImage {
  url: string;
  public_id: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

// ── Response envelopes returned by the catalogue endpoints ───────────────────

export interface CataloguePagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number | null;
  to?: number | null;
}

export interface CatalogueBrowseData {
  portfolios: PublicPortfolio[];
  pagination: CataloguePagination;
}

export interface MyCatalogueData {
  portfolio: Portfolio | null;
  can_manage: boolean;
}

export interface CatalogueCategoriesData {
  categories: PortfolioCategory[];
}

export interface CatalogueDetailData {
  portfolio: PublicPortfolio;
}

export interface CatalogueAdminStats {
  total: number;
  approved: number;
  pending: number;
  featured: number;
  items: number;
}

export interface CatalogueAdminListData {
  portfolios: Portfolio[];
  pagination: CataloguePagination;
  stats: CatalogueAdminStats;
}

// ── Admin ────────────────────────────────────────────────────────────────────

export type CatalogueAdminStatus = 'approved' | 'pending' | 'featured';

export interface AdminPortfolioListParams {
  status?: CatalogueAdminStatus;
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AdminPortfolioUpdateRequest {
  is_approved?: boolean;
  is_featured?: boolean;
}
