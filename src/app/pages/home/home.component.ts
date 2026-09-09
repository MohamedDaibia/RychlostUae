import { Component } from '@angular/core';

import { HeroComponent } from '../../components/hero/hero.component';
import { TrustStripComponent } from '../../components/trust-strip/trust-strip.component';
import { BrandVideoComponent } from '../../components/brand-video/brand-video.component';
import { ProductCategoriesComponent } from '../../components/product-categories/product-categories.component';
import { WhyRychlostComponent } from '../../components/why-rychlost/why-rychlost.component';
import { WholesaleCtaComponent } from '../../components/wholesale-cta/wholesale-cta.component';

// The homepage slice of the site — everything that used to sit directly in
// AppComponent between the header/category-nav and the footer. Header,
// CategoryNav, and Footer now stay mounted in AppComponent across every
// route (see app.component.html), so only the home-only sections live here.
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    TrustStripComponent,
    BrandVideoComponent,
    ProductCategoriesComponent,
    WhyRychlostComponent,
    WholesaleCtaComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
