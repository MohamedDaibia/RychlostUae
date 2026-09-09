import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TrustStripComponent } from '../../components/trust-strip/trust-strip.component';

// Clients page — no real client logos or case studies are confirmed yet
// (open item in site-content-plan-link.md: "Client logos + permission to
// display, and 2-3 flagship projects to feature"), so this page frames
// "who we work with" around the customer types confirmed in
// business-brief.md rather than inventing named clients or testimonials.
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [TrustStripComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
})
export class ClientsComponent {
  constructor(private readonly titleService: Title) {
    this.titleService.setTitle('Clients | Rychlost');
  }
}
