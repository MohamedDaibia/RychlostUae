import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './components/header/header.component';
import { CategoryNavComponent } from './components/category-nav/category-nav.component';
import { HeroComponent } from './components/hero/hero.component';
import { TrustStripComponent } from './components/trust-strip/trust-strip.component';
import { BrandVideoComponent } from './components/brand-video/brand-video.component';
import { ProductCategoriesComponent } from './components/product-categories/product-categories.component';
import { WhyRychlostComponent } from './components/why-rychlost/why-rychlost.component';
import { WholesaleCtaComponent } from './components/wholesale-cta/wholesale-cta.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CategoryNavComponent, HeroComponent, TrustStripComponent, BrandVideoComponent, ProductCategoriesComponent, WhyRychlostComponent, WholesaleCtaComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
