import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Shared placeholder for sidebar sections that don't have a real screen yet
// (Products, Settings, Stocks, Billing) — the title comes from each route's
// `data.title` in app.routes.ts. Swap a route to its own component as each
// section gets built out.
@Component({
  selector: 'app-admin-coming-soon',
  standalone: true,
  imports: [],
  templateUrl: './admin-coming-soon.component.html',
  styleUrl: './admin-coming-soon.component.scss',
})
export class AdminComingSoonComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title: string = this.route.snapshot.data['title'] ?? 'Coming soon';
}
