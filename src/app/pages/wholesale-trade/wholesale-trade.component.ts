import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { ProductCategoriesComponent } from '../../components/product-categories/product-categories.component';

// Wholesale & Trade Accounts page — content grounded in business-brief.md's
// Customer Types (resellers, systems integrators, contractors, corporate
// procurement) and Value Proposition (tested stock, installation-ready,
// supply only — no pricing/discount figures are stated since none are
// confirmed). The CTA routes to Contact with ?intent=wholesale, which
// pre-selects the existing "Wholesale & Trade Account" reason there.
@Component({
  selector: 'app-wholesale-trade',
  standalone: true,
  imports: [ProductCategoriesComponent],
  templateUrl: './wholesale-trade.component.html',
  styleUrl: './wholesale-trade.component.css',
})
export class WholesaleTradeComponent {
  constructor(private readonly titleService: Title) {
    this.titleService.setTitle('Wholesale & Trade Accounts | Rychlost');
  }
}
