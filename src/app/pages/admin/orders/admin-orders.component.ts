import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { describeCatalogError } from '../../../core/catalog/catalog.service';
import { ORDER_STATUSES, OrdersService, type Order, type OrderStatus } from '../../../core/catalog/orders.service';

const PAGE_SIZE = 20;
const QUOTE_REASON = 'Request a Quote';

// Every order placed from the site (Contact page submissions), newest first.
@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private readonly api = inject(OrdersService);

  readonly statuses = ORDER_STATUSES;

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly listError = signal<string | null>(null);

  // Order ids whose details row is open.
  readonly expanded = signal<Set<number>>(new Set());

  readonly searchQuery = signal('');
  // Defaults to quote requests (what the site treats as an order); "all"
  // also shows the other Contact reasons.
  readonly reasonFilter = signal<string>(QUOTE_REASON);
  readonly statusFilter = signal<string>('all');
  readonly currentPage = signal(1);

  readonly reasonOptions = computed(() => {
    const counts = new Map<string, number>();
    for (const order of this.orders()) {
      counts.set(order.reason, (counts.get(order.reason) ?? 0) + 1);
    }
    if (!counts.has(QUOTE_REASON)) {
      counts.set(QUOTE_REASON, 0);
    }
    return [...counts.entries()]
      .sort((a, b) => (a[0] === QUOTE_REASON ? -1 : b[0] === QUOTE_REASON ? 1 : a[0].localeCompare(b[0])))
      .map(([reason, count]) => ({ reason, count }));
  });

  readonly newCount = computed(() => this.orders().filter((o) => o.status === 'New').length);

  readonly filteredOrders = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const reason = this.reasonFilter();
    const status = this.statusFilter();

    return this.orders().filter((o) => {
      if (reason !== 'all' && o.reason !== reason) return false;
      if (status !== 'all' && o.status !== status) return false;
      if (!query) return true;
      return `${o.name} ${o.company ?? ''} ${o.email} ${o.phone ?? ''} ${o.productName ?? ''} ${o.message} ${o.id}`
        .toLowerCase()
        .includes(query);
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredOrders().length / PAGE_SIZE)));

  readonly pagedOrders = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredOrders().slice(start, start + PAGE_SIZE);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.api.getOrders().subscribe({
      next: (list) => {
        this.orders.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(describeCatalogError(err, 'Could not load the orders.'));
        this.loading.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onReasonChange(value: string): void {
    this.reasonFilter.set(value);
    this.currentPage.set(1);
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  prevPage(): void {
    this.currentPage.set(Math.max(1, this.currentPage() - 1));
  }

  nextPage(): void {
    this.currentPage.set(Math.min(this.totalPages(), this.currentPage() + 1));
  }

  toggle(id: number): void {
    const next = new Set(this.expanded());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expanded.set(next);
  }

  isOpen(id: number): boolean {
    return this.expanded().has(id);
  }

  changeStatus(order: Order, status: OrderStatus): void {
    if (status === order.status) {
      return;
    }

    this.listError.set(null);
    const previous = order.status;
    this.replace({ ...order, status });

    this.api.setStatus(order.id, status).subscribe({
      next: (saved) => this.replace(saved),
      error: (err: HttpErrorResponse) => {
        this.replace({ ...order, status: previous });
        this.listError.set(describeCatalogError(err, `Could not update order #${order.id}.`));
      },
    });
  }

  private replace(updated: Order): void {
    this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
  }

  deleteOrder(order: Order): void {
    if (!confirm(`Delete order #${order.id} from ${order.name}? This cannot be undone.`)) {
      return;
    }

    this.listError.set(null);
    this.api.deleteOrder(order.id).subscribe({
      next: () => this.orders.update((list) => list.filter((o) => o.id !== order.id)),
      error: (err: HttpErrorResponse) =>
        this.listError.set(describeCatalogError(err, `Could not delete order #${order.id}.`)),
    });
  }

  statusClass(status: OrderStatus): string {
    return 'order-status--' + status.toLowerCase().replace(/\s+/g, '-');
  }

  trackById(_: number, order: Order): number {
    return order.id;
  }
}
