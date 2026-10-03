import { Component } from '@angular/core';

// Named "-list" to avoid clashing with the storefront's own
// ProductsComponent (pages/products/products.component.ts).
@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  imports: [],
  templateUrl: './admin-products-list.component.html',
  styleUrl: './admin-products-list.component.scss',
})
export class AdminProductsListComponent {}
