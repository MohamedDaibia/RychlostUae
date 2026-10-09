import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

import {
  PublicCatalogService,
  productIdFromSlug,
  type StoreProduct,
  type StoreVariant,
} from '../../core/catalog/public-catalog.service';

// Reads the product from the CMS catalog. The route's :slug is
// "<id>-<name-slug>"; only the leading id is used for the lookup.
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly catalog = inject(PublicCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);

  readonly loading = signal(true);
  readonly loadError = signal(false);

  private readonly allProducts = signal<StoreProduct[]>([]);
  private readonly slug = signal('');
  readonly selectedImage = signal(0);

  readonly product = computed(() => {
    const id = productIdFromSlug(this.slug());
    return this.allProducts().find((p) => p.id === id);
  });

  readonly relatedProducts = computed(() => {
    const current = this.product();
    if (!current) {
      return [];
    }
    return this.allProducts()
      .filter((p) => p.categoryId === current.categoryId && p.id !== current.id)
      .sort((a, b) => Number(b.typeId === current.typeId) - Number(a.typeId === current.typeId))
      .slice(0, 4);
  });

  private paramSub?: Subscription;
  private loaded = false;

  ngOnInit(): void {
    // Subscribed (not a one-off snapshot read) so that navigating from one
    // product's "You may also need" rail straight to another product updates
    // this page — the router reuses this component across sibling routes.
    this.paramSub = this.route.paramMap.subscribe((params) => {
      this.slug.set(params.get('slug') ?? '');
      this.selectedImage.set(0);
      this.updateTitle();
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.catalog.getCatalog().subscribe({
      next: ({ products }) => {
        this.allProducts.set(products);
        this.loaded = true;
        this.loading.set(false);
        this.updateTitle();
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private updateTitle(): void {
    if (!this.loaded) {
      return;
    }
    const found = this.product();
    this.titleService.setTitle(found ? `${found.name} | Rychlost` : 'Product not found | Rychlost');
  }

  selectImage(index: number): void {
    this.selectedImage.set(index);
  }

  // "2.5 kg · 10 m · 4 pcs" — only the sizes that were filled in.
  variantSize(variant: StoreVariant): string {
    const parts: string[] = [];
    if (variant.weightKg !== null) parts.push(`${variant.weightKg} kg`);
    if (variant.lengthM !== null) parts.push(`${variant.lengthM} m`);
    if (variant.pieces !== null) parts.push(`${variant.pieces} pcs`);
    return parts.join(' · ');
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }
}
