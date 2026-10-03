import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { CatalogService, describeCatalogError, type ProductCategory } from '../../../core/catalog/catalog.service';

export type { ProductCategory } from '../../../core/catalog/catalog.service';

// Shared by AdminCategoriesComponent (which edits this list, including
// drag-and-drop reordering) and AdminSubCategoriesComponent (which needs it to
// populate the "Category" dropdown on the sub-category form). Both inject the
// same instance (providedIn: 'root'), so an add/edit/delete/reorder in one
// place is reflected in the other right away.
//
// The data lives in the API (CatalogService) — this store is just the shared,
// in-memory copy the two tabs read from, kept in sync after every write.
@Injectable({ providedIn: 'root' })
export class ProductCategoriesStore {
  private readonly api = inject(CatalogService);

  // Always kept sorted by sortOrder so every consumer sees the same, current
  // display order without having to sort it themselves.
  private readonly _categories = signal<ProductCategory[]>([]);
  readonly categories = this._categories.asReadonly();

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  private loaded = false;

  // Fetches the list from the API. A no-op once loaded unless `force` is set
  // (the "Try again" button, or after a failed reorder).
  load(force = false): void {
    if (this.loaded && !force) {
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    this.api.getCategories().subscribe({
      next: (list) => {
        this._categories.set(this.sorted(list));
        this.loaded = true;
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(describeCatalogError(err, 'Could not load the categories.'));
        this.loading.set(false);
      },
    });
  }

  // Creates (id = null) or updates a category; the saved row is merged into
  // the shared list. Subscribe in the caller to handle success/failure.
  save(id: number | null, form: FormData): Observable<ProductCategory> {
    return this.api.saveCategory(id, form).pipe(
      tap((saved) =>
        this._categories.update((list) =>
          this.sorted(id === null ? [...list, saved] : list.map((cat) => (cat.id === saved.id ? saved : cat))),
        ),
      ),
    );
  }

  remove(id: number): Observable<void> {
    return this.api
      .deleteCategory(id)
      .pipe(tap(() => this._categories.update((list) => list.filter((cat) => cat.id !== id))));
  }

  // Called after a drag-and-drop reorder in the Categories grid —
  // `orderedIds` is the full list of category ids in its new display order.
  // The list updates immediately; if the save fails it's reloaded from the
  // server and the error is passed to `onError`.
  reorder(orderedIds: number[], onError: (message: string) => void): void {
    this._categories.update((list) => {
      const byId = new Map(list.map((cat) => [cat.id, cat]));
      return orderedIds
        .map((id, index) => {
          const cat = byId.get(id);
          return cat ? { ...cat, sortOrder: index } : null;
        })
        .filter((cat): cat is ProductCategory => cat !== null);
    });

    this.api.reorderCategories(orderedIds).subscribe({
      error: (err: HttpErrorResponse) => {
        onError(describeCatalogError(err, 'Could not save the new order.'));
        this.load(true);
      },
    });
  }

  private sorted(list: ProductCategory[]): ProductCategory[] {
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }
}
