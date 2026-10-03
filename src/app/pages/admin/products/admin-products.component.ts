import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-container">
      <h2>Products</h2>
      <p class="text-muted">Manage products. This section is under construction.</p>
    </div>
  `,
  styles: [`
    .section-container {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    h2 {
      margin: 0 0 16px;
      color: var(--color-navy-900);
      font-size: 24px;
      font-weight: 600;
    }

    .text-muted {
      color: var(--color-neutral-600);
      margin: 0;
    }
  `]
})
export class AdminProductsComponent {}
