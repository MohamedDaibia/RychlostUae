import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import {
  compressCatalogImage,
  describeCatalogError,
  validateCatalogImage,
} from '../../../core/catalog/catalog.service';
import { ProductCategoriesStore, type ProductCategory } from './product-categories.store';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly store = inject(ProductCategoriesStore);
  readonly categories = this.store.categories;
  readonly loading = this.store.loading;
  readonly loadError = this.store.loadError;

  // Message above the grid (reorder/delete failures).
  readonly listError = signal<string | null>(null);

  ngOnInit(): void {
    this.store.load();
  }

  reload(): void {
    this.listError.set(null);
    this.store.load(true);
  }

  // Drag-and-drop reordering (native HTML5 DnD, no extra library) — cards
  // are draggable; dropping one on another moves it there and the new order
  // is saved to the API as each category's sortOrder via store.reorder().
  private draggedId: number | null = null;
  readonly dragOverId = signal<number | null>(null);

  onDragStart(event: DragEvent, category: ProductCategory): void {
    this.draggedId = category.id;
    event.dataTransfer?.setData('text/plain', String(category.id));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, category: ProductCategory): void {
    // Required so the element becomes a valid drop target.
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (this.draggedId !== null && this.draggedId !== category.id) {
      this.dragOverId.set(category.id);
    }
  }

  onDragLeave(category: ProductCategory): void {
    if (this.dragOverId() === category.id) {
      this.dragOverId.set(null);
    }
  }

  onDrop(event: DragEvent, targetCategory: ProductCategory): void {
    event.preventDefault();
    this.dragOverId.set(null);

    if (this.draggedId === null || this.draggedId === targetCategory.id) {
      return;
    }

    const list = [...this.categories()];
    const fromIndex = list.findIndex((cat) => cat.id === this.draggedId);
    const toIndex = list.findIndex((cat) => cat.id === targetCategory.id);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    this.listError.set(null);
    this.store.reorder(
      list.map((cat) => cat.id),
      (message) => this.listError.set(message),
    );
    this.draggedId = null;
  }

  onDragEnd(): void {
    this.draggedId = null;
    this.dragOverId.set(null);
  }

  // Modal state
  readonly isModalOpen = signal(false);
  readonly saving = signal(false);
  // True while a chosen image is being shrunk to fit the 512 KB limit.
  readonly processingImage = signal(false);
  readonly formError = signal<string | null>(null);
  private editingId: number | null = null;

  // Form fields bound via ngModel
  formName = '';
  formSeoName = '';
  formStatus: 'active' | 'inactive' = 'active';
  formImagePreview: string | null = null;
  formFileName = '';

  // Image handling: a newly chosen file replaces the saved one; "Remove
  // image" drops the saved one (ignored if a new file is chosen too).
  private selectedFile: File | null = null;
  formHasSavedImage = false;
  formRemoveImage = false;

  openAddModal(): void {
    this.editingId = null;
    this.resetForm();
    this.isModalOpen.set(true);
  }

  openEditModal(category: ProductCategory): void {
    this.editingId = category.id;
    this.resetForm();
    this.formName = category.name;
    this.formSeoName = category.seoName;
    this.formStatus = category.status;
    this.formImagePreview = category.imageUrl;
    this.formHasSavedImage = !!category.imageUrl;
    this.isModalOpen.set(true);
  }

  private resetForm(): void {
    this.formName = '';
    this.formSeoName = '';
    this.formStatus = 'active';
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
      this.formError.set('The category name is required.');
      return;
    }

    // multipart/form-data: the image file travels with the text fields.
    const body = new FormData();
    body.append('name', this.formName.trim());
    body.append('seoName', this.formSeoName.trim());
    body.append('isActive', String(this.formStatus === 'active'));
    body.append('removeImage', String(this.formRemoveImage));
    if (this.selectedFile) {
      body.append('image', this.selectedFile, this.selectedFile.name);
    }

    this.saving.set(true);
    this.store.save(this.editingId, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.isModalOpen.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(describeCatalogError(err, 'Could not save this category.'));
      },
    });
  }

  deleteCategory(category: ProductCategory): void {
    const confirmed = confirm(`Delete "${category.name}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.listError.set(null);
    this.store.remove(category.id).subscribe({
      error: (err: HttpErrorResponse) =>
        this.listError.set(describeCatalogError(err, `Could not delete "${category.name}".`)),
    });
  }

  trackById(_index: number, category: ProductCategory): number {
    return category.id;
  }
}
