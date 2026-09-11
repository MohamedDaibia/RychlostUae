import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

// Shell for every /admin/cms screen: fixed sidebar (logo top-left, section
// nav, Logout pinned to the bottom) + a <router-outlet> for the active
// child route. See app.routes.ts for the child routes this wraps.
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
