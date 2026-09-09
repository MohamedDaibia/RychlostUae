import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

const MIN_PASSWORD_LENGTH = 6;

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss',
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
  });

  get username() {
    return this.form.controls.username;
  }

  get password() {
    return this.form.controls.password;
  }

  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/admin/cms';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    const { username, password } = this.form.getRawValue();

    this.authService.login({ username: username ?? '', password: password ?? '' }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Invalid username or password.');
      },
    });
  }
}
