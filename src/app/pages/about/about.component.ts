import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TrustStripComponent } from '../../components/trust-strip/trust-strip.component';
import { ProductCategoriesComponent } from '../../components/product-categories/product-categories.component';

// Dummy About page — placeholder copy throughout (flagged in the template),
// built so the header/footer "About" link goes somewhere. Reuses TrustStrip
// and ProductCategories from the homepage rather than duplicating them.
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [TrustStripComponent, ProductCategoriesComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  constructor(private readonly titleService: Title) {
    this.titleService.setTitle('About | Rychlost');
  }
}
