import { Component, OnInit, signal } from '@angular/core';

import { WholesaleCtaService } from '../../core/content/wholesale-cta.service';

// Fallback copy — shown until the fetch below resolves, and kept if the API
// is unreachable. The heading ("Contact our customer support") and the
// "Contact Us" button are intentionally NOT here: they stay fixed strings
// in the template, not editable from admin.
const FALLBACK_EYEBROW = 'For Resellers, Integrators & Contractors';
const FALLBACK_TEXT =
  'Get trade pricing, dedicated support, and priority stock access as a reseller, systems integrator, ' +
  'contractor, or corporate procurement team.';

@Component({
  selector: 'app-wholesale-cta',
  standalone: true,
  templateUrl: './wholesale-cta.component.html',
  styleUrl: './wholesale-cta.component.css',
})
export class WholesaleCtaComponent implements OnInit {
  readonly eyebrow = signal(FALLBACK_EYEBROW);
  readonly text = signal(FALLBACK_TEXT);

  constructor(private wholesaleCtaService: WholesaleCtaService) {}

  ngOnInit(): void {
    this.wholesaleCtaService.getPublic().subscribe({
      next: (content) => {
        if (content.eyebrow) {
          this.eyebrow.set(content.eyebrow);
        }
        if (content.text) {
          this.text.set(content.text);
        }
      },
      error: () => {
        // API unreachable — keep the fallback copy above.
      },
    });
  }
}
