import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

// Dummy Contact page — the form below does not send anywhere yet (see the
// TODO in onSubmit). Contact details in the template are placeholders,
// matching the same bracketed convention already used in
// footer.component.html ("[Phone number]" etc.).
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
      this.defaultMessage.set(`I'd like a quote for: ${product}\n\nQuantity needed: `);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    // TODO(integration): wire this up to a real endpoint (email, CRM, etc.)
    // before launch — right now submitting just shows the confirmation state
    // below, nothing is actually sent.
    this.submitted.set(true);
  }

  sendAnother(): void {
    this.submitted.set(false);
  }
}
