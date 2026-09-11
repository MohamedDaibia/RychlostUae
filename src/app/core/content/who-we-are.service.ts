import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface WhoWeAreContent {
  heading: string;
  body: string;
}

// Talks to RychlostApi's "Who We Are" content endpoints:
// - GET /api/content/who-we-are is public — used by BrandVideoComponent to
//   render the home page's Who We Are copy.
// - GET/PUT /api/admin/content/who-we-are require the admin JWT (attached by
//   auth.interceptor.ts) and back the admin "Home page" editor in
//   AdminCmsComponent.
@Injectable({ providedIn: 'root' })
export class WhoWeAreService {
  private readonly apiBase = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getPublic(): Observable<WhoWeAreContent> {
    return this.http.get<WhoWeAreContent>(`${this.apiBase}/content/who-we-are`);
  }

  getForEdit(): Observable<WhoWeAreContent> {
    return this.http.get<WhoWeAreContent>(`${this.apiBase}/admin/content/who-we-are`);
  }

  update(content: WhoWeAreContent): Observable<WhoWeAreContent> {
    return this.http.put<WhoWeAreContent>(`${this.apiBase}/admin/content/who-we-are`, content);
  }
}
