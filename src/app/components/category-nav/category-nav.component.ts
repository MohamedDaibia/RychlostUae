import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

// Shape of GET /api/catalog/categories (CatalogController): active categories
// only, ordered by SortOrder, each with its active sub-categories (also
// ordered by SortOrder).
interface CategoryResponse {
  id: number;
  name: string;
  seoName: string;
  subCategories: { id: number; name: string; seoName: string }[];
}

// The nav bar shows at most this many categories directly; any further ones
// are grouped under a single "Others" dropdown.
const MAX_CATEGORIES = 5;
// At most this many sub-categories are listed per category dropdown; the
// "View all" link at the bottom covers the rest.
const MAX_SUB_CATEGORIES = 10;

@Component({
  selector: 'app-category-nav',
  standalone: true,
  imports: [NgFor, NgIf, NgTemplateOutlet],
  templateUrl: './category-nav.component.html',
  styleUrl: './category-nav.component.css',
})
export class CategoryNavComponent {
  private readonly http = inject(HttpClient);

  private readonly allCategories = signal<CategoryResponse[]>([]);

  // First 5 categories, each trimmed to its first 10 sub-categories.
  readonly categories = computed(() =>
    this.allCategories()
      .slice(0, MAX_CATEGORIES)
      .map((c) => ({ ...c, subCategories: c.subCategories.slice(0, MAX_SUB_CATEGORIES) })),
  );

  // Category 6 onwards — rendered as links inside the "Others" dropdown.
  readonly otherCategories = computed(() => this.allCategories().slice(MAX_CATEGORIES));

  constructor() {
    // If the API is unreachable the bar simply shows no category links (the
    // search field and the rest of the header are unaffected).
    this.http.get<CategoryResponse[]>(`${environment.apiBaseUrl}/catalog/categories`).subscribe({
      next: (list) => this.allCategories.set(list),
      error: () => this.allCategories.set([]),
    });
  }

  categoryLink(categoryName: string): string {
    return `/products?category=${encodeURIComponent(categoryName)}`;
  }

  subCategoryLink(categoryName: string, subCategoryName: string): string {
    return `${this.categoryLink(categoryName)}&item=${encodeURIComponent(subCategoryName)}`;
  }
}
