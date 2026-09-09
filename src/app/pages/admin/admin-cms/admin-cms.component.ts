import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [],
  templateUrl: './admin-cms.component.html',
  styleUrl: './admin-cms.component.scss',
})
export class AdminCmsComponent implements OnInit {
  readonly message = signal('Loading…');

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Confirms the token against the API rather than trusting local state alone.
    this.authService.fetchCms().subscribe({
      next: (res) => this.message.set(res.message),
      error: () => {
        this.authService.logout();
        this.router.navigateByUrl('/admin/login');
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
