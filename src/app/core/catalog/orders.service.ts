import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export const ORDER_STATUSES = ['New', 'In progress', 'Completed', 'Cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: number;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  reason: string;
  productName: string | null;
  message: string;
  status: OrderStatus;
  createdAt: string; // ISO, UTC
}

// What the public Contact page sends to POST /api/orders.
export interface PlaceOrderRequest {
  name: string;
  company: string;
  email: string;
  phone: string;
  reason: string;
  productName: string;
  message: string;
}

// Orders = submissions from the public Contact page (the site has no
// checkout; "Request a Quote" is the order flow). The admin endpoints need the
// admin JWT (attached by auth.interceptor.ts); POST /api/orders is public.
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  place(request: PlaceOrderRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/orders`, request);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiBase}/admin/orders`);
  }

  setStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.put<Order>(`${this.apiBase}/admin/orders/${id}/status`, { status });
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/admin/orders/${id}`);
  }
}
