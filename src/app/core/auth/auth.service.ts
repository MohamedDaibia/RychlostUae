import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  username: string;
}

export interface CmsResponse {
  message: string;
}

const TOKEN_KEY = 'rychlost_admin_token';
const EXPIRY_KEY = 'rychlost_admin_token_expiry';

// Talks to RychlostApi's /api/admin endpoints for the single admin account.
// Token is a JWT bearer token, kept in localStorage and attached by
// auth.interceptor.ts on every request to the API.
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(this.hasValidToken());

  private readonly apiBase = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBase}/admin/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(EXPIRY_KEY, response.expiresAt);
        this.isAuthenticated.set(true);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return this.hasValidToken() ? localStorage.getItem(TOKEN_KEY) : null;
  }

  fetchCms(): Observable<CmsResponse> {
    return this.http.get<CmsResponse>(`${this.apiBase}/admin/cms`);
  }

  private hasValidToken(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);

    if (!token || !expiry) {
      return false;
    }

    return new Date(expiry).getTime() > Date.now();
  }
}
