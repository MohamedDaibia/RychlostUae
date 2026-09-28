import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// One card in the home page's "What We Supply" carousel, as the public API
// returns it. The icon's bytes are NOT in here (they'd bloat the list) —
// `hasIcon` says whether one was uploaded, and `iconVersion` is a cache-busting
// token; build the image URL with SupplyCategoriesService.iconUrl().
export interface SupplyCategory {
  id: number;
  title: string;
  description: string;
  linkUrl: string;
  hasIcon: boolean;
  iconVersion: number;
}

// The admin list additionally carries visibility and display order.
export interface AdminSupplyCategory extends SupplyCategory {
  isActive: boolean;
  sortOrder: number;
}

// Talks to RychlostApi's "What We Supply" endpoints:
// - GET /api/content/supply-categories is public — used by
//   ProductCategoriesComponent to render the carousel (visible categories, in
//   the admin's order).
// - GET /api/content/supply-categories/{id}/icon is public too — it's what the
//   icon <img>/CSS mask points at (see iconUrl()).
// - Everything under /api/admin/content/supply-categories requires the admin
//   JWT (attached by auth.interceptor.ts) and backs the admin "Home page"
//   editor. create()/update() take multipart FormData so the icon file travels
//   with the text fields in one request.
@Injectable({ providedIn: 'root' })
export class SupplyCategoriesService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getPublic(): Observable<SupplyCategory[]> {
    return this.http.get<SupplyCategory[]>(`${this.apiBase}/content/supply-categories`);
  }

  // Null when the category has no uploaded icon (callers then show a default).
  iconUrl(category: Pick<SupplyCategory, 'id' | 'hasIcon' | 'iconVersion'>): string | null {
    return category.hasIcon
      ? `${this.apiBase}/content/supply-categories/${category.id}/icon?v=${category.iconVersion}`
      : null;
  }

  getAll(): Observable<AdminSupplyCategory[]> {
    return this.http.get<AdminSupplyCategory[]>(`${this.apiBase}/admin/content/supply-categories`);
  }

  create(form: FormData): Observable<AdminSupplyCategory> {
    return this.http.post<AdminSupplyCategory>(`${this.apiBase}/admin/content/supply-categories`, form);
  }

  update(id: number, form: FormData): Observable<AdminSupplyCategory> {
    return this.http.put<AdminSupplyCategory>(`${this.apiBase}/admin/content/supply-categories/${id}`, form);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/admin/content/supply-categories/${id}`);
  }

  reorder(orderedIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.apiBase}/admin/content/supply-categories/reorder`, orderedIds);
  }
}
