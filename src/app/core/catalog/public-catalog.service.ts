import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

import { environment } from '../../../environments/environment';

// Storefront (public, no login) view of the CMS catalog: the Products page
// and Product Details page read categories, product types and products from
// RychlostApi's /api/catalog endpoints. Only active items are returned.

export interface StoreProductType {
  id: number;
  name: string;
  seoName: string;
}

export interface StoreCategory {
  id: number;
  name: string;
  seoName: string;
  types: StoreProductType[];
}

export interface StoreVariant {
  color: string | null;
  weightKg: number | null;
  lengthM: number | null;
  pieces: number | null;
}

export interface StoreProduct {
  id: number;
  // "<id>-<name-slug>" — the id is what the detail page looks the product up by.
  slug: string;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  typeId: number;
  typeName: string;
  // Image URLs of the filled picture slots, main picture first.
  imageUrls: string[];
  variants: StoreVariant[];
  items: { item: string; description: string }[];
}

export interface StoreCatalog {
  categories: StoreCategory[];
  products: StoreProduct[];
}

interface CategoryResponse {
  id: number;
  name: string;
  seoName: string;
  subCategories: { id: number; name: string; seoName: string }[];
}

interface ProductResponse {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  subCategoryId: number;
  imageSlots: number[];
  imageVersion: number;
  variants: StoreVariant[];
  items: { item: string; description: string | null }[];
}

export function productSlug(id: number, name: string): string {
  const text = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return text ? `${id}-${text}` : String(id);
}

// "12-cat6-cable" -> 12 (NaN when the slug doesn't start with an id).
export function productIdFromSlug(slug: string): number {
  return parseInt(slug, 10);
}

@Injectable({ providedIn: 'root' })
export class PublicCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  getCatalog(): Observable<StoreCatalog> {
    return forkJoin({
      categories: this.http.get<CategoryResponse[]>(`${this.apiBase}/catalog/categories`),
      products: this.http.get<ProductResponse[]>(`${this.apiBase}/catalog/products`),
    }).pipe(
      map(({ categories, products }) => {
        const storeCategories: StoreCategory[] = categories.map((c) => ({
          id: c.id,
          name: c.name,
          seoName: c.seoName,
          types: c.subCategories.map((s) => ({ id: s.id, name: s.name, seoName: s.seoName })),
        }));

        const categoryName = new Map(storeCategories.map((c) => [c.id, c.name]));
        const typeName = new Map(storeCategories.flatMap((c) => c.types.map((t) => [t.id, t.name] as const)));

        const storeProducts: StoreProduct[] = products.map((p) => ({
          id: p.id,
          slug: productSlug(p.id, p.name),
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          categoryName: categoryName.get(p.categoryId) ?? '',
          typeId: p.subCategoryId,
          typeName: typeName.get(p.subCategoryId) ?? '',
          imageUrls: [...p.imageSlots]
            .sort((a, b) => a - b)
            .map((slot) => `${this.apiBase}/catalog/products/${p.id}/images/${slot}?v=${p.imageVersion}`),
          variants: p.variants,
          items: p.items.map((i) => ({ item: i.item, description: i.description ?? '' })),
        }));

        return { categories: storeCategories, products: storeProducts };
      }),
    );
  }
}
