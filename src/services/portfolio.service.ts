import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  AddPortfolioItemRequest,
  AdminPortfolioListParams,
  AdminPortfolioUpdateRequest,
  CatalogueAdminListData,
  CatalogueBrowseData,
  CatalogueCategoriesData,
  CatalogueDetailData,
  CatalogueImageFolder,
  MyCatalogueData,
  Portfolio,
  PortfolioBrowseParams,
  PortfolioItem,
  ReorderPortfolioItemsRequest,
  UpdatePortfolioItemRequest,
  UpsertPortfolioRequest,
  UploadedCatalogueImage,
} from '@/types/portfolio.types';

class PortfolioService {
  // ── Public ──────────────────────────────────────────────────────────────

  /** GET /portfolios — browse approved businesses. */
  async browse(params?: PortfolioBrowseParams): Promise<ApiResponse<CatalogueBrowseData>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const qs = searchParams.toString();
    return apiClient.get<CatalogueBrowseData>(`/portfolios${qs ? `?${qs}` : ''}`);
  }

  /** GET /portfolios/categories */
  async getCategories(): Promise<ApiResponse<CatalogueCategoriesData>> {
    return apiClient.get<CatalogueCategoriesData>('/portfolios/categories');
  }

  /** GET /portfolios/{id} */
  async getPortfolio(id: number): Promise<ApiResponse<CatalogueDetailData>> {
    return apiClient.get<CatalogueDetailData>(`/portfolios/${id}`);
  }

  // ── Authenticated member ────────────────────────────────────────────────

  /** GET /portfolios/my — includes inactive items so the owner can manage them. */
  async getMy(): Promise<ApiResponse<MyCatalogueData>> {
    return apiClient.get<MyCatalogueData>('/portfolios/my');
  }

  /** POST /portfolios — create or update the member's business profile. */
  async upsert(data: UpsertPortfolioRequest): Promise<ApiResponse<{ portfolio: Portfolio }>> {
    return apiClient.post<{ portfolio: Portfolio }>('/portfolios', data);
  }

  /** POST /portfolios/items */
  async addItem(data: AddPortfolioItemRequest): Promise<ApiResponse<{ item: PortfolioItem }>> {
    return apiClient.post<{ item: PortfolioItem }>('/portfolios/items', data);
  }

  /** PUT /portfolios/items/{id} — partial update. */
  async updateItem(
    id: number,
    data: UpdatePortfolioItemRequest,
  ): Promise<ApiResponse<{ item: PortfolioItem }>> {
    return apiClient.put<{ item: PortfolioItem }>(`/portfolios/items/${id}`, data);
  }

  /** DELETE /portfolios/items/{id} */
  async deleteItem(id: number): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/portfolios/items/${id}`);
  }

  /** PUT /portfolios/items/order */
  async reorderItems(data: ReorderPortfolioItemsRequest): Promise<ApiResponse<null>> {
    return apiClient.put<null>('/portfolios/items/order', data);
  }

  /**
   * POST /portfolios/images — multipart upload.
   *
   * The api-client strips Content-Type for FormData so the browser can set the
   * multipart boundary itself.
   */
  async uploadImage(
    file: File,
    folder: CatalogueImageFolder = 'items',
  ): Promise<ApiResponse<{ image: UploadedCatalogueImage }>> {
    const form = new FormData();
    form.append('image', file);
    form.append('folder', folder);

    return apiClient.post<{ image: UploadedCatalogueImage }>('/portfolios/images', form, {
      timeout: 60000,
    });
  }

  // ── Admin ───────────────────────────────────────────────────────────────

  /** GET /admin/portfolios */
  async adminGetAll(
    params?: AdminPortfolioListParams,
  ): Promise<ApiResponse<CatalogueAdminListData>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const qs = searchParams.toString();
    return apiClient.get<CatalogueAdminListData>(`/admin/portfolios${qs ? `?${qs}` : ''}`);
  }

  /** GET /admin/portfolios/{id} */
  async adminGetOne(id: number): Promise<ApiResponse<{ portfolio: Portfolio }>> {
    return apiClient.get<{ portfolio: Portfolio }>(`/admin/portfolios/${id}`);
  }

  /** PUT /admin/portfolios/{id} — approve / feature. */
  async adminUpdate(
    id: number,
    data: AdminPortfolioUpdateRequest,
  ): Promise<ApiResponse<{ portfolio: Portfolio }>> {
    return apiClient.put<{ portfolio: Portfolio }>(`/admin/portfolios/${id}`, data);
  }
}

export const portfolioService = new PortfolioService();
