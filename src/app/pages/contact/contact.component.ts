import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { OrdersService } from '../../core/catalog/orders.service';

// Contact page. Submitting the form saves it as an order (POST /api/orders),
// which the team sees in the CMS Orders screen — "Request a Quote" is how
// customers order, since the site has no cart or checkout. Contact details in
// the template are placeholders, matching the same bracketed convention
// already used in footer.component.html ("[Phone number]" etc.).
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  readonly reasons = ['General Inquiry', 'Request a Quote', 'Wholesale & Trade Account', 'Product Availability', 'Other'];
  readonly defaultReason = signal('General Inquiry');
  readonly defaultMessage = signal('');
  readonly submitted = signal(false);
  readonly sending = signal(false);
  readonly sendError = signal<string | null>(null);

  // Set when the visitor arrived from a product page's "Request a Quote".
  private productName = '';

  private readonly orders = inject(OrdersService);

  constructor(private readonly route: ActivatedRoute, private readonly titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Contact | Rychlost');

    // The header's "Request a Quote" button links here with ?intent=quote —
    // pre-select the matching reason so that link actually does something.
    // Product Details pages (ProductDetailComponent) link here the same way
    // plus a `product` param, so also pre-fill the message with the product
    // name — saves a visitor from having to retype what they just clicked.
    const intent = this.route.snapshot.queryParamMap.get('intent');
    if (intent === 'quote') {
      this.defaultReason.set('Request a Quote');
    } else if (intent === 'wholesale') {
      this.defaultReason.set('Wholesale & Trade Account');
    }

    const product = this.route.snapshot.queryParamMap.get('product');
    if (product) {
      this.productName = product;
      this.defaultMessage.set(`I'd like a quote for: ${product}\n\nQuantity needed: `);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.sending()) {
      return;
    }

    const data = new FormData(event.target as HTMLFormElement);
    const field = (key: string) => String(data.get(key) ?? '').trim();

    this.sendError.set(null);
    this.sending.set(true);

    this.orders
      .place({
        name: field('name'),
        company: field('company'),
        email: field('email'),
        phone: field('phone'),
        reason: field('reason'),
        productName: this.productName,
        message: field('message'),
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.submitted.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.sending.set(false);
          this.sendError.set(
            err.status === 400 && typeof err.error === 'string' && err.error.trim()
              ? err.error
              : "We couldn't send your message right now. Please try again, or contact us directly.",
          );
        },
      });
  }

  sendAnother(): void {
    this.submitted.set(false);
  }
}
