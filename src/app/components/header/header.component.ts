import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

interface NavLink {
  label: string;
  href: string;
  /**
   * When set, this item renders as a normal link at desktop widths but as a
   * button on mobile that opens the Bootstrap offcanvas with this element
   * id instead of navigating — used for "Products", which opens the
   * product-category slider (rendered by <app-category-nav>).
   */
  submenuTargetId?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  readonly navLinks: NavLink[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Products', href: '/products', submenuTargetId: 'mobileCategoryNav' },
    { label: 'Wholesale & Trade', href: '/wholesale-trade' },
    { label: 'Clients', href: '/clients' },
    { label: 'Contact', href: '/contact' },
  ];
}
