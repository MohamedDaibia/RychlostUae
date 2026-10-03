import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import {
  CatalogService,
  describeCatalogError,
  compressCatalogImage,
  validateCatalogImage,
  type ProductSubCategory,
} from '../../../core/catalog/catalog.service';
import { ProductCategoriesStore } from './product-categories.store';

export type { ProductSubCategory } from '../../../core/catalog/catalog.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-sub-categories',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-sub-categories.component.html',
  styleUrl: './admin-sub-categories.component.scss',
})
export class AdminSubCategoriesComponent implements OnInit {
  private readonly api = inject(CatalogService);
  private readonly categoriesStore = inject(ProductCategoriesStore);
  readonly categories = this.categoriesStore.categories;

  readonly subCategories = signal<ProductSubCategory[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  // Message above the list (delete failures).
  readonly listError = signal<string | null>(null);

  ngOnInit(): void {
    // The "Category" dropdown and the parent-name column both need categories.
    this.categoriesStore.load();
    this.load();
  }

  // Public so the "Try again" button can call it.
  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.api.getSubCategories().subscribe({
      next: (list) => {
        this.subCategories.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(describeCatalogError(err, 'Could not load the product types.'));
        this.loading.set(false);
      },
    });
  }

  // Search — filters by product type name or its parent category name.
  readonly searchQuery = signal('');

  readonly filteredSubCategories = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = [...this.subCategories()].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    if (!query) {
      return list;
    }
    return list.filter(
      (sub) =>
        sub.name.toLowerCase().includes(query) ||
        this.categoryName(sub.categoryId).toLowerCase().includes(query),
    );
  });

  // Pagination — 20 product types per page.
  readonly pageSize = PAGE_SIZE;
  readonly currentPage = signal(1);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSubCategories().length / this.pageSize)),
  );

  readonly pagedSubCategories = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredSubCategories().slice(start, start + this.pageSize);
  });

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const clamped = Math.min(Math.max(page, 1), this.totalPages());
    this.currentPage.set(clamped);
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  // Modal state
  readonly isModalOpen = signal(false);
  readonly saving = signal(false);
  // True while a chosen image is being shrunk to fit the 512 KB limit.
  readonly processingImage = signal(false);
  readonly formError = signal<string | null>(null);
  private editingId: number | null = null;

  // Form fields bound via ngModel
  formCategoryId: number | null = null;
  formName = '';
  formSeoName = '';
  formStatus: 'active' | 'inactive' = 'active';
  formSortOrder: number | null = 0;
  formImagePreview: string | null = null;
  formFileName = '';

  private selectedFile: File | null = null;
  formHasSavedImage = false;
  formRemoveImage = false;

  categoryName(categoryId: number): string {
    return this.categories().find((cat) => cat.id === categoryId)?.name ?? 'Uncategorized';
  }

  private nextSortOrder(): number {
    const list = this.subCategories();
    return list.length ? Math.max(...list.map((sub) => sub.sortOrder)) + 1 : 0;
  }

  openAddModal(): void {
    this.editingId = null;
    this.resetForm();
    this.formCategoryId = this.categories()[0]?.id ?? null;
    this.formSortOrder = this.nextSortOrder();
    this.isModalOpen.set(true);
  }

  openEditModal(subCategory: ProductSubCategory): void {
    this.editingId = subCategory.id;
    this.resetForm();
    this.formCategoryId = subCategory.categoryId;
    this.formName = subCategory.name;
    this.formSeoName = subCategory.seoName;
    this.formStatus = subCategory.status;
    this.formSortOrder = subCategory.sortOrder;
    this.formImagePreview = subCategory.imageUrl;
    this.formHasSavedImage = !!subCategory.imageUrl;
    this.isModalOpen.set(true);
  }

  private resetForm(): void {
    this.formCategoryId = null;
    this.formName = '';
    this.formSeoName = '';
    this.formStatus = 'active';
    this.formSortOrder = 0;
    this.formImagePreview = null;
    this.formFileName = '';
    this.selectedFile = null;
    this.formHasSavedImage = false;
    this.formRemoveImage = false;
    this.formError.set(null);
  }

  closeModal(): void {
    if (this.saving()) {
      return;
    }
    this.isModalOpen.set(false);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const chosen = input.files?.[0];
    this.formError.set(null);

    if (!chosen) {
      return;
    }

    // Refuse wrong types and anything over 15 MB straight away.
    const problem = validateCatalogImage(chosen);
    if (problem) {
      this.formError.set(problem);
      input.value = '';
      return;
    }

    // Under 15 MB: shrink it to fit the API's 512 KB limit if it's bigger.
    this.processingImage.set(true);
    let file: File;
    try {
      file = await compressCatalogImage(chosen);
    } catch (err) {
      this.formError.set(err instanceof Error ? err.message : "The image couldn't be processed.");
      input.value = '';
      this.processingImage.set(false);
      return;
    }
    this.processingImage.set(false);

    this.selectedFile = file;
    this.formFileName = file.name;
    this.formRemoveImage = false;

    const reader = new FileReader();
    reader.onload = () => {
      this.formImagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // "Remove image" in the modal — drops the saved image on the next save.
  removeSavedImage(input: HTMLInputElement): void {
    input.value = '';
    this.selectedFile = null;
    this.formFileName = '';
    this.formImagePreview = null;
    this.formRemoveImage = true;
  }

  saveChanges(): void {
    this.formError.set(null);

    if (this.processingImage()) {
      return;
    }

    if (!this.formName.trim()) {
      this.formError.set('The product type name is required.');
      return;
    }
    if (this.formCategoryId === null) {
      this.formError.set('Choose a category.');
      return;
    }

    // multipart/form-data: the image file travels with the text fields.
    const body = new FormData();
    body.append('categoryId', String(this.formCategoryId));
    body.append('name', this.formName.trim());
    body.append('seoName', this.formSeoName.trim());
    body.append('isActive', String(this.formStatus === 'active'));
    body.append('removeImage', String(this.formRemoveImage));
    if (typeof this.formSortOrder === 'number' && Number.isFinite(this.formSortOrder)) {
      body.append('sortOrder', String(this.formSortOrder));
    }
    if (this.selectedFile) {
      body.append('image', this.selectedFile, this.selectedFile.name);
    }

    this.saving.set(true);
    this.api.saveSubCategory(this.editingId, body).subscribe({
      next: (saved) => {
        this.subCategories.update((list) =>
          this.editingId === null ? [...list, saved] : list.map((sub) => (sub.id === saved.id ? saved : sub)),
        );
        this.saving.set(false);
        this.isModalOpen.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(describeCatalogError(err, 'Could not save this product type.'));
      },
    });
  }

  deleteSubCategory(subCategory: ProductSubCategory): void {
    const confirmed = confirm(`Delete "${subCategory.name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.listError.set(null);
    this.api.deleteSubCategory(subCategory.id).subscribe({
      next: () => this.subCategories.update((list) => list.filter((sub) => sub.id !== subCategory.id)),
      error: (err: HttpErrorResponse) =>
        this.listError.set(describeCatalogError(err, `Could not delete "${subCategory.name}".`)),
    });
  }

  trackById(_index: number, subCategory: ProductSubCategory): number {
    return subCategory.id;
  }
}
