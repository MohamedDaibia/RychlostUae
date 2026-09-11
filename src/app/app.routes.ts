import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { AboutComponent } from './pages/about/about.component';
import { WholesaleTradeComponent } from './pages/wholesale-trade/wholesale-trade.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { ContactComponent } from './pages/contact/contact.component';
import { AdminLoginComponent } from './pages/admin/admin-login/admin-login.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';
import { AdminCmsComponent } from './pages/admin/admin-cms/admin-cms.component';
import { AdminComingSoonComponent } from './pages/admin/admin-coming-soon/admin-coming-soon.component';
import { authGuard } from './core/auth/auth.guard';

// Header, Category Nav, and Footer stay mounted in AppComponent across every
// storefront route below (see app.component.html). The /admin routes render
// without that chrome.
//
// /admin/cms is now a layout route (AdminLayoutComponent renders the sidebar
// + logo) with the actual screens as children, so every sidebar link is a
// child of the same guarded parent. Products/Settings/Stocks/Billing don't
// have real screens yet, so they share AdminComingSoonComponent (title passed
// via route `data`) until each is built out.
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products/:slug', component: ProductDetailComponent },
  { path: 'about', component: AboutComponent },
  { path: 'wholesale-trade', component: WholesaleTradeComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin/cms',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', component: AdminCmsComponent },
      { path: 'products', component: AdminComingSoonComponent, data: { title: 'Products' } },
      { path: 'settings', component: AdminComingSoonComponent, data: { title: 'Settings' } },
      { path: 'stocks', component: AdminComingSoonComponent, data: { title: 'Stocks' } },
      { path: 'billing', component: AdminComingSoonComponent, data: { title: 'Billing' } },
    ],
  },
];
