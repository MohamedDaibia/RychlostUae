import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface WhyRychlostChecklistItem {
  title: string;
  description: string;
}

export interface WhyRychlostContent {
  heading: string;
  items: WhyRychlostChecklistItem[];
  // Back face of the testimonial flip card next to the checklist.
  // testimonialQuote is the quote text WITHOUT surrounding quotation marks —
  // the template adds those. The card's front face and the attribution role
  // ("Founder, Rychlost") are fixed in the template and are not part of this.
  testimonialQuote: string;
  testimonialOwnerName: string;
}

// Talks to RychlostApi's "Why Rychlost" content endpoints:
// - GET /api/content/why-rychlost is public — used by WhyRychlostComponent to
//   render the home page's Why Rychlost section (sub-heading, 3-item
//   checklist, and the testimonial card's back face). The "Why Rychlost"
//   eyebrow label itself is NOT part of this — it stays a fixed label in the
//   template, per the client's request.
// - GET/PUT /api/admin/content/why-rychlost require the admin JWT (attached
//   by auth.interceptor.ts) and back the admin "Home page" editor.
@Injectable({ providedIn: 'root' })
export class WhyRychlostService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getPublic(): Observable<WhyRychlostContent> {
    return this.http.get<WhyRychlostContent>(`${this.apiBase}/content/why-rychlost`);
  }

  getForEdit(): Observable<WhyRychlostContent> {
    return this.http.get<WhyRychlostContent>(`${this.apiBase}/admin/content/why-rychlost`);
  }

  update(content: WhyRychlostContent): Observable<WhyRychlostContent> {
    return this.http.put<WhyRychlostContent>(`${this.apiBase}/admin/content/why-rychlost`, content);
  }
}
