import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

import { Product, getProductBySlug, getRelatedProducts } from '../../core/data/products.data';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  readonly product = signal<Product | undefined>(undefined);
  readonly relatedProducts = signal<Product[]>([]);

  private paramSub?: Subscription;

  constructor(private readonly route: ActivatedRoute, private readonly titleService: Title) {}

  ngOnInit(): void {
    // Subscribed (not a one-off snapshot read) so that navigating from one
    // product's "You may also need" rail straight to another product re-runs
    // this lookup — the router reuses this same component instance across
    // sibling /products/:slug routes instead of destroying and recreating it.
    this.paramSub = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';
      const found = getProductBySlug(slug);
      this.product.set(found);
      this.relatedProducts.set(found ? getRelatedProducts(found) : []);
      this.titleService.setTitle(found ? `${found.name} | Rychlost` : 'Product not found | Rychlost');
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
  }
}
