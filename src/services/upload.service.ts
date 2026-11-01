import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';

/**
 * Upload service — Cloudinary-backed uploads via the Laravel API.
 *
 * Mirrors the two backend endpoints:
 *
 *  - `uploadProfilePhoto` → POST /profile/upload-image (avatar; the backend
 *    also stores the URL on the member's row, so no follow-up save call).
 *  - `uploadImage` → POST /uploads/images (generic hosted URL for content
 *    submissions, ad media, documents …).
 *
 * The api-client detects FormData and strips the JSON Content-Type so the
 * browser can set the multipart boundary itself — never set that header
 * manually here.
 */

/** Whitelist mirrors the backend `folder` validation rule. */
export type UploadFolder = 'content' | 'ads' | 'docs' | 'misc';

export interface UploadedImage {
  /** Secure Cloudinary URL — the value to store/submit. */
  image_url: string;
  public_id: string;
  width: number;
  height: number;
  size: number;
  uploaded_at: string;
}

/** The generic endpoint also echoes the URL as `url`. */
export interface UploadedGenericImage extends UploadedImage {
  url: string;
  format: string;
}

class UploadService {
  /**
   * Upload the member's profile photo (avatar).
   * POST /profile/upload-image — multipart field: `image`.
   */
  async uploadProfilePhoto(file: File): Promise<ApiResponse<UploadedImage>> {
    const form = new FormData();
    form.append('image', file);

    return apiClient.post<UploadedImage>('/profile/upload-image', form, {
      timeout: 60000,
    });
  }

  /**
   * Upload the member's personal profile cover (banner). Same shape as the
   * avatar endpoint; stored on users.cover_image_url.
   */
  async uploadProfileCover(file: File): Promise<ApiResponse<UploadedImage>> {
    const form = new FormData();
    form.append('image', file);

    return apiClient.post<UploadedImage>('/profile/upload-cover', form, {
      timeout: 60000,
    });
  }

  /**
   * Generic image upload; returns a hosted URL without side effects.
   * POST /uploads/images — multipart fields: `image`, `folder`.
   */
  async uploadImage(
    file: File,
    folder: UploadFolder = 'misc',
  ): Promise<ApiResponse<UploadedGenericImage>> {
    const form = new FormData();
    form.append('image', file);
    form.append('folder', folder);

    return apiClient.post<UploadedGenericImage>('/uploads/images', form, {
      timeout: 60000,
    });
  }
}

export const uploadService = new UploadService();
