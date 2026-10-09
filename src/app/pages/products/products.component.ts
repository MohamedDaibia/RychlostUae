import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

import {
  PublicCatalogService,
  type StoreCategory,
  type StoreProduct,
} from '../../core/catalog/public-catalog.service';

type SortKey = 'name-asc' | 'name-desc' | 'type-asc';

// Categories, product types and products all come from the CMS (admin >
// Products tabs) through PublicCatalogService — nothing is hardcoded here.
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  private readonly catalog = inject(PublicCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);

  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly categories = signal<StoreCategory[]>([]);
  readonly products = signal<StoreProduct[]>([]);

  // Rail groups: categories that actually have product types.
  readonly categoryGroups = computed(() => this.categories().filter((c) => c.types.length > 0));

  private readonly typeCounts = computed(() => {
    const counts = new Map<number, number>();
    for (const p of this.products()) {
      counts.set(p.typeId, (counts.get(p.typeId) ?? 0) + 1);
    }
    return counts;
  });

  readonly searchTerm = signal('');
  readonly sortKey = signal<SortKey>('name-asc');
  // Product-type ids currently ticked in the rail. Starts as "all types".
  readonly selectedTypes = signal<Set<number>>(new Set());
  readonly railOpen = signal(false);

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const active = this.selectedTypes();

    let list = this.products().filter((p) => active.has(p.typeId));
    if (term) {
      list = list.filter((p) =>
        `${p.name} ${p.typeName} ${p.categoryName} ${p.description}`.toLowerCase().includes(term),
      );
    }

    const sort = this.sortKey();
    return [...list].sort((a, b) => {
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'type-asc') return a.typeName.localeCompare(b.typeName) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  });

  ngOnInit(): void {
    this.titleService.setTitle('Products | Rychlost');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.catalog.getCatalog().subscribe({
      next: ({ categories, products }) => {
        this.categories.set(categories);
        this.products.set(products);
        this.selectedTypes.set(new Set(this.allTypeIds()));
        this.applyQueryParams();
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private allTypeIds(): number[] {
    return this.categoryGroups().flatMap((g) => g.types.map((t) => t.id));
  }

  // Deep links (?category=…&item=…, ?q=…) match a category / product type by
  // name or SEO name; if nothing matches, fall back to a text search so the
  // click still surfaces something instead of silently showing everything.
  private applyQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const q = params.get('q');
    const item = params.get('item');
    const category = params.get('category');

    if (q) {
      this.searchTerm.set(q);
    }

    const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

    if (item) {
      const matched = this.categoryGroups()
        .flatMap((g) => g.types)
        .find((t) => same(t.name, item) || same(t.seoName, item));
      if (matched) {
        this.selectedTypes.set(new Set([matched.id]));
      } else if (!q) {
        this.searchTerm.set(item);
      }
    } else if (category) {
      const group = this.categoryGroups().find((g) => same(g.name, category) || same(g.seoName, category));
      if (group) {
        this.selectedTypes.set(new Set(group.types.map((t) => t.id)));
      } else if (!q) {
        this.searchTerm.set(category);
      }
    }
  }

  toggleType(typeId: number): void {
    const next = new Set(this.selectedTypes());
    if (next.has(typeId)) {
      next.delete(typeId);
    } else {
      next.add(typeId);
    }
    this.selectedTypes.set(next);
  }

  isTypeActive(typeId: number): boolean {
    return this.selectedTypes().has(typeId);
  }

  countFor(typeId: number): number {
    return this.typeCounts().get(typeId) ?? 0;
  }

  clearFilters(): void {
    this.selectedTypes.set(new Set(this.allTypeIds()));
    this.searchTerm.set('');
    this.sortKey.set('name-asc');
  }

  toggleRail(): void {
    this.railOpen.update((open) => !open);
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  onSortChange(value: string): void {
    this.sortKey.set(value as SortKey);
  }
}
