import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import {
  CatalogService,
  compressCatalogImage,
  describeCatalogError,
  validateCatalogImage,
  type ProductSubCategory,
} from '../../../core/catalog/catalog.service';
import {
  PRODUCT_IMAGE_SLOTS,
  ProductsService,
  type Product,
  type ProductItem,
  type ProductVariant,
} from '../../../core/catalog/products.service';
import { ProductCategoriesStore } from './product-categories.store';

const PAGE_SIZE = 20;

// One of the five picture slots in the form. `file` is a newly chosen image;
// `saved` is the URL of the one already stored; `preview` is what's shown.
interface ImageSlot {
  file: File | null;
  preview: string | null;
  hasSaved: boolean;
  remove: boolean;
}

// A variant row as edited in the form (numbers kept as plain inputs).
interface VariantRow {
  color: string;
  useColor: boolean;
  weightKg: number | null;
  lengthM: number | null;
  pieces: number | null;
}

// Named "-list" to avoid clashing with the storefront's own
// ProductsComponent (pages/products/products.component.ts).
@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-products-list.component.html',
  styleUrl: './admin-products-list.component.scss',
})
export class AdminProductsListComponent implements OnInit {
  private readonly api = inject(ProductsService);
  private readonly catalog = inject(CatalogService);
  private readonly categoriesStore = inject(ProductCategoriesStore);

  readonly categories = this.categoriesStore.categories;
  readonly subCategories = signal<ProductSubCategory[]>([]);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly listError = signal<string | null>(null);

  readonly slotIndexes = Array.from({ length: PRODUCT_IMAGE_SLOTS }, (_, i) => i);

  ngOnInit(): void {
    this.categoriesStore.load();
    this.catalog.getSubCategories().subscribe({
      next: (list) => this.subCategories.set(list),
      error: () => this.subCategories.set([]),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.api.getProducts().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(describeCatalogError(err, 'Could not load the products.'));
        this.loading.set(false);
      },
    });
  }

  categoryName(id: number): string {
    return this.categories().find((c) => c.id === id)?.name ?? '—';
  }

  subCategoryName(id: number): string {
    return this.subCategories().find((s) => s.id === id)?.name ?? '—';
  }

  // ----- Search + pagination -----

  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.products();
    if (!query) {
      return list;
    }
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        this.categoryName(p.categoryId).toLowerCase().includes(query) ||
        this.subCategoryName(p.subCategoryId).toLowerCase().includes(query),
    );
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / PAGE_SIZE)));

  readonly pagedProducts = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredProducts().slice(start, start + PAGE_SIZE);
  });

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  prevPage(): void {
    this.currentPage.set(Math.max(1, this.currentPage() - 1));
  }

  nextPage(): void {
    this.currentPage.set(Math.min(this.totalPages(), this.currentPage() + 1));
  }

  // ----- Modal / form state -----

  readonly isModalOpen = signal(false);
  readonly saving = signal(false);
  readonly processingImage = signal(false);
  readonly formError = signal<string | null>(null);
  private editingId: number | null = null;

  formName = '';
  formDescription = '';
  formCategoryId: number | null = null;
  formSubCategoryId: number | null = null;
  formPrice: number | null = null;
  formStatus: 'active' | 'inactive' = 'active';
  formImages: ImageSlot[] = [];
  formVariants: VariantRow[] = [];
  formItems: ProductItem[] = [];

  // Product types offered in the form: only the chosen category's.
  formSubCategoryOptions(): ProductSubCategory[] {
    return this.subCategories()
      .filter((s) => s.categoryId === this.formCategoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  onFormCategoryChange(): void {
    const stillValid = this.formSubCategoryOptions().some((s) => s.id === this.formSubCategoryId);
    if (!stillValid) {
      this.formSubCategoryId = null;
    }
  }

  openAddModal(): void {
    this.editingId = null;
    this.resetForm();
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product): void {
    this.editingId = product.id;
    this.resetForm();
    this.formName = product.name;
    this.formDescription = product.description;
    this.formCategoryId = product.categoryId;
    this.formSubCategoryId = product.subCategoryId;
    this.formPrice = product.priceAed;
    this.formStatus = product.status;
    this.formImages = product.imageUrls.map((url) => ({
      file: null,
      preview: url,
      hasSaved: !!url,
      remove: false,
    }));
    this.formVariants = product.variants.map((v) => ({
      color: v.color ?? '#000000',
      useColor: !!v.color,
      weightKg: v.weightKg,
      lengthM: v.lengthM,
      pieces: v.pieces,
    }));
    this.formItems = product.items.map((i) => ({ ...i }));
    this.isModalOpen.set(true);
  }

  private resetForm(): void {
    this.formName = '';
    this.formDescription = '';
    this.formCategoryId = this.categories()[0]?.id ?? null;
    this.formSubCategoryId = null;
    this.formPrice = null;
    this.formStatus = 'active';
    this.formImages = this.slotIndexes.map(() => ({ file: null, preview: null, hasSaved: false, remove: false }));
    this.formVariants = [];
    this.formItems = [];
    this.formError.set(null);
  }

  closeModal(): void {
    if (!this.saving()) {
      this.isModalOpen.set(false);
    }
  }

  // ----- Pictures -----

  async onImageSelected(slot: number, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const chosen = input.files?.[0];
    this.formError.set(null);

    if (!chosen) {
      return;
    }

    const problem = validateCatalogImage(chosen);
    if (problem) {
      this.formError.set(problem);
      input.value = '';
      return;
    }

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

    const reader = new FileReader();
    reader.onload = () => {
      this.formImages[slot] = { ...this.formImages[slot], file, preview: reader.result as string, remove: false };
    };
    reader.readAsDataURL(file);
  }

  // Clears an optional slot (the main picture can only be replaced).
  clearImage(slot: number, input: HTMLInputElement): void {
    input.value = '';
    const current = this.formImages[slot];
    this.formImages[slot] = { file: null, preview: null, hasSaved: current.hasSaved, remove: current.hasSaved };
  }

  slotLabel(slot: number): string {
    return slot === 0 ? 'Main picture (required)' : `Picture ${slot + 1} (optional)`;
  }

  // ----- Variants -----

  addVariant(): void {
    this.formVariants.push({ color: '#000000', useColor: true, weightKg: null, lengthM: null, pieces: null });
  }

  removeVariant(index: number): void {
    this.formVariants.splice(index, 1);
  }

  // ----- Item / Description list -----

  addItem(): void {
    this.formItems.push({ item: '', description: '' });
  }

  removeItem(index: number): void {
    this.formItems.splice(index, 1);
  }

  // ----- Save / delete -----

  saveChanges(): void {
    this.formError.set(null);

    if (this.processingImage()) {
      return;
    }

    const name = this.formName.trim();
    if (!name) {
      this.formError.set('The product name is required.');
      return;
    }
    if (!this.formDescription.trim()) {
      this.formError.set('The description is required.');
      return;
    }
    if (this.formCategoryId === null) {
      this.formError.set('Choose a category.');
      return;
    }
    if (this.formSubCategoryId === null) {
      this.formError.set('Choose a product type.');
      return;
    }
    if (this.formPrice === null || this.formPrice < 0 || Number.isNaN(Number(this.formPrice))) {
      this.formError.set('Enter the cost in AED (0 or more).');
      return;
    }

    const main = this.formImages[0];
    if (!main.file && !main.hasSaved) {
      this.formError.set('The main picture is required.');
      return;
    }

    const variants: ProductVariant[] = this.formVariants.map((v) => ({
      color: v.useColor ? v.color : null,
      weightKg: this.numberOrNull(v.weightKg),
      lengthM: this.numberOrNull(v.lengthM),
      pieces: this.numberOrNull(v.pieces),
    }));

    const body = new FormData();
    body.append('name', name);
    body.append('description', this.formDescription.trim());
    body.append('categoryId', String(this.formCategoryId));
    body.append('subCategoryId', String(this.formSubCategoryId));
    body.append('priceAed', String(this.formPrice));
    body.append('isActive', String(this.formStatus === 'active'));
    body.append('variantsJson', JSON.stringify(variants));
    body.append('itemsJson', JSON.stringify(this.formItems));

    const removeSlots: number[] = [];
    this.formImages.forEach((image, slot) => {
      if (image.file) {
        body.append(`image${slot}`, image.file, image.file.name);
      } else if (slot > 0 && image.remove) {
        removeSlots.push(slot);
      }
    });
    body.append('removeSlots', removeSlots.join(','));

    this.saving.set(true);
    this.api.saveProduct(this.editingId, body).subscribe({
      next: (saved) => {
        this.products.update((list) =>
          this.editingId === null ? [saved, ...list] : list.map((p) => (p.id === saved.id ? saved : p)),
        );
        this.saving.set(false);
        this.isModalOpen.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(describeCatalogError(err, 'Could not save this product.'));
      },
    });
  }

  private numberOrNull(value: number | null): number | null {
    return value === null || value === undefined || (value as unknown) === '' || Number.isNaN(Number(value))
      ? null
      : Number(value);
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }

    this.listError.set(null);
    this.api.deleteProduct(product.id).subscribe({
      next: () => this.products.update((list) => list.filter((p) => p.id !== product.id)),
      error: (err: HttpErrorResponse) =>
        this.listError.set(describeCatalogError(err, `Could not delete "${product.name}".`)),
    });
  }

  trackById(_: number, product: Product): number {
    return product.id;
  }

  formatPrice(value: number): string {
    return `AED ${value.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
