import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface WholesaleCtaContent {
  eyebrow: string;
  text: string;
}

// Talks to RychlostApi's "Contact our customer support" CTA banner
// endpoints (the home page section right before the footer):
// - GET /api/content/wholesale-cta is public — used by WholesaleCtaComponent
//   to render the banner's eyebrow label + paragraph. The heading ("Contact
//   our customer support") and the "Contact Us" button are NOT part of this —
//   they stay fixed in the template, per the client's request.
// - GET/PUT /api/admin/content/wholesale-cta require the admin JWT (attached
//   by auth.interceptor.ts) and back the admin "Home page" editor.
@Injectable({ providedIn: 'root' })
export class WholesaleCtaService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getPublic(): Observable<WholesaleCtaContent> {
    return this.http.get<WholesaleCtaContent>(`${this.apiBase}/content/wholesale-cta`);
  }

  getForEdit(): Observable<WholesaleCtaContent> {
    return this.http.get<WholesaleCtaContent>(`${this.apiBase}/admin/content/wholesale-cta`);
  }

  update(content: WholesaleCtaContent): Observable<WholesaleCtaContent> {
    return this.http.put<WholesaleCtaContent>(`${this.apiBase}/admin/content/wholesale-cta`, content);
  }
}
