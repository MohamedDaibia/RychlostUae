import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

// Layout route for /admin/cms/products — renders the Categories / Sub
// Categories / Products tab bar and mounts whichever tab is active
// (see app.routes.ts children) in the outlet below.
@Component({
  selector: 'app-admin-products-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-products-layout.component.html',
  styleUrl: './admin-products-layout.component.scss',
})
export class AdminProductsLayoutComponent {}
