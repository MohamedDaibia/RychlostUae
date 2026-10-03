import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-products-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-products-nav">
      <nav class="nav-tabs">
        <a 
          routerLink="/admin/cms/products/categories" 
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-tab">
          Categories
        </a>
        <a 
          routerLink="/admin/cms/products/sub-categories" 
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-tab">
          Sub Categories
        </a>
        <a 
          routerLink="/admin/cms/products/products" 
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-tab">
          Products
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .admin-products-nav {
      padding: 0 24px;
      border-bottom: 1px solid var(--color-neutral-300);
      background-color: var(--color-neutral-100);
    }

    .nav-tabs {
      display: flex;
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-tab {
      padding: 16px 24px;
      font-size: 14px;
      font-weight: 500;
      color: var(--color-neutral-600);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        color: var(--color-navy-700);
        background-color: var(--color-neutral-200);
      }

      &.active {
        color: var(--color-cyan-500);
        border-bottom-color: var(--color-cyan-500);
        background-color: transparent;
      }
    }

    @media (max-width: 768px) {
      .admin-products-nav {
        padding: 0 16px;
      }

      .nav-tab {
        padding: 12px 16px;
        font-size: 13px;
      }
    }
  `]
})
export class AdminProductsNavComponent {}
