import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  AdminSupplyCategory,
  SupplyCategoriesService,
} from '../../../core/content/supply-categories.service';

// Mirrors the API's limits (AdminSupplyCategoriesController) so a bad file is
// caught before the upload instead of after it.
const MAX_ICON_BYTES = 256 * 1024;
const ALLOWED_ICON_EXTENSIONS = ['.svg', '.png', '.webp'];

// Admin editor for the home page's "What We Supply" carousel: add, edit,
// reorder, hide/show, and delete the category cards, including each card's
// icon (uploaded here, stored by the API, and served back to the public site).
// Only the cards are editable — the section's eyebrow, heading, and
// sub-heading are fixed in ProductCategoriesComponent's template.
@Component({
  selector: 'app-supply-categories-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './supply-categories-editor.component.html',
  styleUrl: './supply-categories-editor.component.scss',
})
export class SupplyCategoriesEditorComponent implements OnInit, OnDestroy {
  readonly categories = signal<AdminSupplyCategory[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  // Message above the list (reorder/delete results).
  readonly listError = signal<string | null>(null);
  readonly listNotice = signal<string | null>(null);

  // Id of the category whose inline "Delete? Yes / No" prompt is open.
  readonly confirmingDeleteId = signal<number | null>(null);

  // The add/edit form. `editing` = the category being edited, or null when
  // adding a new one; `formOpen` shows/hides the whole form card.
  readonly form: FormGroup;
  readonly formOpen = signal(false);
  readonly editing = signal<AdminSupplyCategory | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // Icon handling inside the form.
  readonly iconError = signal<string | null>(null);
  readonly removeIcon = signal(false);
  private selectedFile: File | null = null;
  // Object URL of the chosen (not yet uploaded) file, for the live preview.
  private selectedPreviewUrl: string | null = null;
  readonly selectedFileName = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private categoriesService: SupplyCategoriesService,
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(120)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      linkUrl: ['', [Validators.maxLength(300)]],
      isActive: [true],
    });
  }

  get title() {
    return this.form.controls['title'];
  }

  get description() {
    return this.form.controls['description'];
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  // Public so the "Try again" button can call it.
  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.categoriesService.getAll().subscribe({
      next: (items) => {
        this.categories.set(items);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(this.describeLoadError(err));
        this.loading.set(false);
      },
    });
  }

  // Says WHY the list couldn't load, not just that it couldn't — the usual
  // causes each leave a different status code.
  private describeLoadError(err: HttpErrorResponse): string {
    const base = 'Could not load the "What We Supply" categories.';
    switch (err.status) {
      case 0:
        return `${base} The API isn't reachable — check it's running and that apiBaseUrl in environment.ts points at it.`;
      case 401:
      case 403:
        return `${base} Your admin session has expired — log out and log in again.`;
      case 404:
        return `${base} The API doesn't have this endpoint yet — restart it so it picks up the latest code.`;
      case 500:
        return `${base} The API hit an error — most likely the SupplyCategories database migration hasn't been applied yet (Update-Database -Context CmsDbContext).`;
      default:
        return `${base} (HTTP ${err.status})`;
    }
  }

  // CSS `url("...")` for a category's saved icon, or null if it has none —
  // the template paints it as a mask so it takes the text colour.
  iconMask(category: AdminSupplyCategory): string | null {
    const url = this.categoriesService.iconUrl(category);
    return url ? `url("${url}")` : null;
  }

  // Icon shown in the form: the newly chosen file if there is one, otherwise
  // the category's current icon (unless it's been marked for removal).
  formIconMask(): string | null {
    if (this.selectedPreviewUrl) {
      return `url("${this.selectedPreviewUrl}")`;
    }
    const current = this.editing();
    if (current && !this.removeIcon()) {
      return this.iconMask(current);
    }
    return null;
  }

  // Whether the category being edited has a saved icon that could be removed.
  canRemoveSavedIcon(): boolean {
    const current = this.editing();
    return !!current && current.hasIcon && !this.selectedFile;
  }

  startAdd(): void {
    this.resetForm();
    this.editing.set(null);
    this.form.reset({ title: '', description: '', linkUrl: '', isActive: true });
    this.formOpen.set(true);
  }

  startEdit(category: AdminSupplyCategory): void {
    this.resetForm();
    this.editing.set(category);
    this.form.reset({
      title: category.title,
      description: category.description,
      linkUrl: category.linkUrl,
      isActive: category.isActive,
    });
    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.resetForm();
    this.formOpen.set(false);
    this.editing.set(null);
  }

  private resetForm(): void {
    this.formError.set(null);
    this.iconError.set(null);
    this.removeIcon.set(false);
    this.clearSelectedFile();
  }

  onIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.iconError.set(null);

    if (!file) {
      this.clearSelectedFile();
      return;
    }

    const dot = file.name.lastIndexOf('.');
    const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
    if (!ALLOWED_ICON_EXTENSIONS.includes(extension)) {
      this.iconError.set('The icon must be an SVG, PNG or WebP file.');
      input.value = '';
      this.clearSelectedFile();
      return;
    }

    if (file.size > MAX_ICON_BYTES) {
      this.iconError.set(`The icon must be smaller than ${MAX_ICON_BYTES / 1024} KB.`);
      input.value = '';
      this.clearSelectedFile();
      return;
    }

    this.revokePreview();
    this.selectedFile = file;
    this.selectedPreviewUrl = URL.createObjectURL(file);
    this.selectedFileName.set(file.name);
    // Picking a new file supersedes "remove the saved icon".
    this.removeIcon.set(false);
  }

  // "Clear" next to the chosen file — drops the pending upload and empties
  // the native file input so the same file can be picked again.
  discardSelectedFile(input: HTMLInputElement): void {
    input.value = '';
    this.iconError.set(null);
    this.clearSelectedFile();
  }

  toggleRemoveIcon(): void {
    this.removeIcon.update((value) => !value);
  }

  private clearSelectedFile(): void {
    this.revokePreview();
    this.selectedFile = null;
    this.selectedFileName.set(null);
  }

  private revokePreview(): void {
    if (this.selectedPreviewUrl) {
      URL.revokeObjectURL(this.selectedPreviewUrl);
      this.selectedPreviewUrl = null;
    }
  }

  save(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as {
      title: string;
      description: string;
      linkUrl: string;
      isActive: boolean;
    };

    // multipart/form-data: the icon file travels with the text fields.
    const body = new FormData();
    body.append('title', value.title.trim());
    body.append('description', value.description.trim());
    body.append('linkUrl', (value.linkUrl ?? '').trim());
    body.append('isActive', String(value.isActive));
    body.append('removeIcon', String(this.removeIcon()));
    if (this.selectedFile) {
      body.append('icon', this.selectedFile, this.selectedFile.name);
    }

    const editing = this.editing();
    const request = editing
      ? this.categoriesService.update(editing.id, body)
      : this.categoriesService.create(body);

    this.saving.set(true);
    request.subscribe({
      next: (saved) => {
        this.categories.update((list) =>
          editing ? list.map((c) => (c.id === saved.id ? saved : c)) : [...list, saved],
        );
        this.saving.set(false);
        // A save proves the API is up, but the list itself may never have
        // loaded (stale load error) — refetch so the full list shows.
        if (this.loadError()) {
          this.load();
        }
        this.cancelForm();
        this.notice(editing ? 'Category saved.' : 'Category added to the end of the carousel.');
      },
      error: (err: HttpErrorResponse) => {
        this.formError.set(this.describeError(err, 'Could not save this category.'));
        this.saving.set(false);
      },
    });
  }

  // Swaps a category with its neighbour and saves the new order. The list
  // updates immediately; if the save fails it's reloaded from the server.
  move(index: number, delta: -1 | 1): void {
    const list = [...this.categories()];
    const target = index + delta;
    if (target < 0 || target >= list.length) {
      return;
    }

    [list[index], list[target]] = [list[target], list[index]];
    this.categories.set(list);
    this.listError.set(null);

    this.categoriesService.reorder(list.map((c) => c.id)).subscribe({
      next: () => this.notice('Order saved.'),
      error: (err: HttpErrorResponse) => {
        this.listError.set(this.describeError(err, 'Could not save the new order.'));
        this.load();
      },
    });
  }

  askDelete(category: AdminSupplyCategory): void {
    this.confirmingDeleteId.set(category.id);
  }

  cancelDelete(): void {
    this.confirmingDeleteId.set(null);
  }

  confirmDelete(category: AdminSupplyCategory): void {
    this.listError.set(null);
    this.categoriesService.remove(category.id).subscribe({
      next: () => {
        this.categories.update((list) => list.filter((c) => c.id !== category.id));
        this.confirmingDeleteId.set(null);
        if (this.editing()?.id === category.id) {
          this.cancelForm();
        }
        this.notice('Category deleted.');
      },
      error: (err: HttpErrorResponse) => {
        this.listError.set(this.describeError(err, 'Could not delete this category.'));
        this.confirmingDeleteId.set(null);
      },
    });
  }

  private notice(message: string): void {
    this.listNotice.set(message);
    setTimeout(() => {
      if (this.listNotice() === message) {
        this.listNotice.set(null);
      }
    }, 4000);
  }

  // The API answers validation problems with a plain-text 400 body; anything
  // else (network, 401, 500) gets the generic fallback.
  private describeError(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 400 && typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }
    return fallback;
  }
}
