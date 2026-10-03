import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

// UI-side shapes used by the admin Products tabs. `status` is the UI's
// 'active' | 'inactive' wording for the API's `isActive` flag, and `imageUrl`
// is the full URL of the stored image (null when none was uploaded).
export interface ProductCategory {
  id: number;
  name: string;
  seoName: string;
  status: 'active' | 'inactive';
  imageUrl: string | null;
  sortOrder: number;
}

export interface ProductSubCategory {
  id: number;
  categoryId: number;
  name: string;
  seoName: string;
  status: 'active' | 'inactive';
  imageUrl: string | null;
  sortOrder: number;
}

// Image rules. The admin may pick a file up to MAX_CATALOG_IMAGE_UPLOAD_BYTES
// (15 MB); anything larger is refused. Files over the API's own limit
// (MAX_CATALOG_IMAGE_BYTES, 512 KB — mirrors CatalogHelpers on the API) are
// shrunk in the browser to fit before they're uploaded, so the API only ever
// receives images that are already small enough.
export const MAX_CATALOG_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_CATALOG_IMAGE_BYTES = 512 * 1024;
export const ALLOWED_CATALOG_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Quick checks on a chosen image file (type and the 15 MB cap); returns an
// error message, or null if it's fine to go on to compressCatalogImage().
export function validateCatalogImage(file: File): string | null {
  const dot = file.name.lastIndexOf('.');
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!ALLOWED_CATALOG_IMAGE_EXTENSIONS.includes(extension)) {
    return 'The image must be a JPG, PNG or WebP file.';
  }
  if (file.size > MAX_CATALOG_IMAGE_UPLOAD_BYTES) {
    return `The image is larger than ${MAX_CATALOG_IMAGE_UPLOAD_BYTES / (1024 * 1024)} MB. Choose a smaller file.`;
  }
  return null;
}

// Returns the file unchanged if it's already within the API's 512 KB limit;
// otherwise re-encodes it (WebP where the browser can, else JPEG), lowering
// the quality and then the dimensions step by step until it fits. Rejects with
// an Error carrying a message fit to show the admin.
export async function compressCatalogImage(file: File): Promise<File> {
  if (file.size <= MAX_CATALOG_IMAGE_BYTES) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That file couldn't be read as an image.");
  }

  try {
    // Cap the longest side first — catalog images are shown small, and huge
    // pixel counts are what make files heavy.
    const MAX_SIDE = 1600;
    const MIN_SIDE = 300;
    let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

    while (true) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error("Your browser couldn't resize the image.");
      }

      // JPEG has no transparency — paint white behind so a transparent PNG
      // doesn't turn black if the browser falls back to JPEG.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) {
        const blob = await canvasToBlob(canvas, quality);
        if (blob && blob.size <= MAX_CATALOG_IMAGE_BYTES) {
          const extension = blob.type === 'image/webp' ? '.webp' : '.jpg';
          const baseName = file.name.replace(/\.[^.]+$/, '');
          return new File([blob], baseName + extension, { type: blob.type });
        }
      }

      if (Math.max(width, height) <= MIN_SIDE) {
        throw new Error('The image is too detailed to shrink below 512 KB. Try a simpler or smaller image.');
      }
      scale *= 0.8;
    }
  } finally {
    bitmap.close();
  }
}

// WebP if the browser can encode it, otherwise JPEG (Safari can't encode WebP
// and silently hands back a PNG, which is why the blob's type is checked).
async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (webp && webp.type === 'image/webp') {
    return webp;
  }
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

// Turns an HTTP failure into something an admin can act on. The API answers
// validation problems with a plain-text 400 body; the rest are generic.
export function describeCatalogError(err: HttpErrorResponse, fallback: string): string {
  if (err.status === 400 && typeof err.error === 'string' && err.error.trim()) {
    return err.error;
  }
  switch (err.status) {
    case 0:
      return `${fallback} The API isn't reachable — check it's running and that apiBaseUrl in environment.ts points at it.`;
    case 401:
    case 403:
      return `${fallback} Your admin session has expired — log out and log in again.`;
    case 404:
      return `${fallback} It no longer exists, or the API needs restarting to pick up the latest code.`;
    case 500:
      return `${fallback} The API hit an error — most likely the catalog database migration hasn't been applied yet (Update-Database -Context CmsDbContext).`;
    default:
      return `${fallback} (HTTP ${err.status})`;
  }
}

interface CategoryDto {
  id: number;
  name: string;
  seoName: string;
  isActive: boolean;
  sortOrder: number;
  hasImage: boolean;
  imageVersion: number;
}

interface SubCategoryDto extends CategoryDto {
  categoryId: number;
}

// Talks to RychlostApi's catalog endpoints:
// - /api/admin/catalog/categories and /api/admin/catalog/sub-categories
//   require the admin JWT (attached by auth.interceptor.ts) and back the admin
//   Products > Categories / Sub Categories tabs. create/update send multipart
//   FormData so the image file travels with the text fields in one request.
// - /api/catalog/{categories|sub-categories}/{id}/image is public — it's what
//   the <img> tags point at (an <img> can't send the bearer token).
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  // ----- Categories -----

  getCategories(): Observable<ProductCategory[]> {
    return this.http
      .get<CategoryDto[]>(`${this.apiBase}/admin/catalog/categories`)
      .pipe(map((rows) => rows.map((row) => this.toCategory(row))));
  }

  saveCategory(id: number | null, form: FormData): Observable<ProductCategory> {
    const request =
      id === null
        ? this.http.post<CategoryDto>(`${this.apiBase}/admin/catalog/categories`, form)
        : this.http.put<CategoryDto>(`${this.apiBase}/admin/catalog/categories/${id}`, form);
    return request.pipe(map((row) => this.toCategory(row)));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/admin/catalog/categories/${id}`);
  }

  reorderCategories(orderedIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/admin/catalog/categories/reorder`, orderedIds);
  }

  // ----- Sub categories (product types) -----

  getSubCategories(): Observable<ProductSubCategory[]> {
    return this.http
      .get<SubCategoryDto[]>(`${this.apiBase}/admin/catalog/sub-categories`)
      .pipe(map((rows) => rows.map((row) => this.toSubCategory(row))));
  }

  saveSubCategory(id: number | null, form: FormData): Observable<ProductSubCategory> {
    const request =
      id === null
        ? this.http.post<SubCategoryDto>(`${this.apiBase}/admin/catalog/sub-categories`, form)
        : this.http.put<SubCategoryDto>(`${this.apiBase}/admin/catalog/sub-categories/${id}`, form);
    return request.pipe(map((row) => this.toSubCategory(row)));
  }

  deleteSubCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/admin/catalog/sub-categories/${id}`);
  }

  // ----- Mapping -----

  private toCategory(row: CategoryDto): ProductCategory {
    return {
      id: row.id,
      name: row.name,
      seoName: row.seoName,
      status: row.isActive ? 'active' : 'inactive',
      imageUrl: row.hasImage ? this.imageUrl('categories', row) : null,
      sortOrder: row.sortOrder,
    };
  }

  private toSubCategory(row: SubCategoryDto): ProductSubCategory {
    return {
      id: row.id,
      categoryId: row.categoryId,
      name: row.name,
      seoName: row.seoName,
      status: row.isActive ? 'active' : 'inactive',
      imageUrl: row.hasImage ? this.imageUrl('sub-categories', row) : null,
      sortOrder: row.sortOrder,
    };
  }

  private imageUrl(kind: 'categories' | 'sub-categories', row: { id: number; imageVersion: number }): string {
    return `${this.apiBase}/catalog/${kind}/${row.id}/image?v=${row.imageVersion}`;
  }
}
