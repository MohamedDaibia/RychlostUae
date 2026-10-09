import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

// One variant row: a colour (hex from the colour picker) plus a size given as
// weight (kg), length (metres) and/or number of pieces. All optional.
export interface ProductVariant {
  color: string | null;
  weightKg: number | null;
  lengthM: number | null;
  pieces: number | null;
}

// One row of the "Item / Description" list.
export interface ProductItem {
  item: string;
  description: string;
}

// Picture slots: 0 is the mandatory main picture, 1-4 are optional.
export const PRODUCT_IMAGE_SLOTS = 5;

export interface Product {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  subCategoryId: number;
  priceAed: number;
  status: 'active' | 'inactive';
  // Full URL per slot (null = empty slot).
  imageUrls: (string | null)[];
  variants: ProductVariant[];
  items: ProductItem[];
}

interface ProductDto {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  subCategoryId: number;
  priceAed: number;
  isActive: boolean;
  imageSlots: number[];
  imageVersion: number;
  variants: ProductVariant[];
  items: { item: string; description: string | null }[];
}

// Talks to RychlostApi's /api/admin/catalog/products (admin JWT, multipart
// FormData so the pictures travel with the text fields) and reads the public
// /api/catalog/products/{id}/images/{slot} for <img> tags.
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  getProducts(): Observable<Product[]> {
    return this.http
      .get<ProductDto[]>(`${this.apiBase}/admin/catalog/products`)
      .pipe(map((rows) => rows.map((row) => this.toProduct(row))));
  }

  saveProduct(id: number | null, form: FormData): Observable<Product> {
    const request =
      id === null
        ? this.http.post<ProductDto>(`${this.apiBase}/admin/catalog/products`, form)
        : this.http.put<ProductDto>(`${this.apiBase}/admin/catalog/products/${id}`, form);
    return request.pipe(map((row) => this.toProduct(row)));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/admin/catalog/products/${id}`);
  }

  private toProduct(row: ProductDto): Product {
    const imageUrls: (string | null)[] = Array(PRODUCT_IMAGE_SLOTS).fill(null);
    for (const slot of row.imageSlots) {
      imageUrls[slot] = `${this.apiBase}/catalog/products/${row.id}/images/${slot}?v=${row.imageVersion}`;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.categoryId,
      subCategoryId: row.subCategoryId,
      priceAed: row.priceAed,
      status: row.isActive ? 'active' : 'inactive',
      imageUrls,
      variants: row.variants,
      items: row.items.map((i) => ({ item: i.item, description: i.description ?? '' })),
    };
  }
}
