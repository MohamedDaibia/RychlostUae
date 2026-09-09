import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HeaderComponent } from './components/header/header.component';
import { CategoryNavComponent } from './components/category-nav/category-nav.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CategoryNavComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // The admin area (login + CMS) renders without the storefront header/nav/footer.
  readonly isAdminRoute = signal(false);

  constructor(router: Router) {
    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.isAdminRoute.set((event as NavigationEnd).urlAfterRedirects.startsWith('/admin'));
    });
  }
}
