import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { PRODUCTS } from '../../core/data/products.data';

interface CategoryGroup {
  category: string;
  types: string[];
}

type SortKey = 'name-asc' | 'name-desc' | 'type-asc';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  readonly products = PRODUCTS;

  readonly categoryGroups: CategoryGroup[] = this.buildCategoryGroups();
  readonly allTypes: string[] = this.categoryGroups.flatMap((g) => g.types);
  private readonly typeCounts = this.buildTypeCounts();

  readonly searchTerm = signal('');
  readonly sortKey = signal<SortKey>('name-asc');
  readonly selectedTypes = signal<Set<string>>(new Set(this.allTypes));
  readonly railOpen = signal(false);

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const active = this.selectedTypes();

    let list = this.products.filter((p) => active.has(p.type));
    if (term) {
      list = list.filter((p) =>
        `${p.name} ${p.type} ${p.category} ${p.description}`.toLowerCase().includes(term)
      );
    }

    const sort = this.sortKey();
    return [...list].sort((a, b) => {
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'type-asc') return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  });

  constructor(private readonly route: ActivatedRoute, private readonly titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Products | Rychlost');

    const params = this.route.snapshot.queryParamMap;
    const q = params.get('q');
    const item = params.get('item');
    const category = params.get('category');

    if (q) {
      this.searchTerm.set(q);
    }

    if (item) {
      // Links built from CategoryNavComponent's draft subcategory list — see
      // the taxonomy note in core/data/products.data.ts. Select the matching
      // type if we have one; otherwise fall back to search so the click
      // still surfaces something instead of silently showing everything.
      const matchedType = this.allTypes.find((t) => t.toLowerCase() === item.toLowerCase());
      if (matchedType) {
        this.selectedTypes.set(new Set([matchedType]));
      } else if (!q) {
        this.searchTerm.set(item);
      }
    } else if (category) {
      const matchedGroup = this.categoryGroups.find((g) => g.category.toLowerCase() === category.toLowerCase());
      if (matchedGroup) {
        this.selectedTypes.set(new Set(matchedGroup.types));
      } else if (!q) {
        this.searchTerm.set(category);
      }
    }
  }

  toggleType(type: string): void {
    const next = new Set(this.selectedTypes());
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    this.selectedTypes.set(next);
  }

  isTypeActive(type: string): boolean {
    return this.selectedTypes().has(type);
  }

  countFor(type: string): number {
    return this.typeCounts.get(type) ?? 0;
  }

  clearFilters(): void {
    this.selectedTypes.set(new Set(this.allTypes));
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

  private buildCategoryGroups(): CategoryGroup[] {
    const map = new Map<string, string[]>();
    for (const p of PRODUCTS) {
      const types = map.get(p.category) ?? [];
      if (!types.includes(p.type)) types.push(p.type);
      map.set(p.category, types);
    }
    return Array.from(map.entries()).map(([category, types]) => ({
      category,
      types: types.sort((a, b) => a.localeCompare(b)),
    }));
  }

  private buildTypeCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const p of PRODUCTS) {
      counts.set(p.type, (counts.get(p.type) ?? 0) + 1);
    }
    return counts;
  }
}
