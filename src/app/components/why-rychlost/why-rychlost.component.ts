import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';

import { WhyRychlostService } from '../../core/content/why-rychlost.service';

// Fallback copy — shown until the fetch below resolves, and kept if the API
// is unreachable. The "Why Rychlost" eyebrow label is intentionally NOT
// here: it stays a fixed string in the template, not editable from admin.
const FALLBACK_HEADING = 'The preferred source for IT, networking, and telecom products across the UAE';
const FALLBACK_ITEMS = [
  {
    title: 'Tested before it ships',
    description: 'Every product is quality-checked and proven before it leaves our warehouse.',
  },
  {
    title: 'Installation-ready stock',
    description:
      'We choose stock that simplifies installation and minimizes complexity for your team or contractor.',
  },
  {
    title: 'Supply only, done right',
    description: 'We focus on getting the right product to you — installation is handled by your own team or contractor.',
  },
];

// Back face of the testimonial flip card. Stored WITHOUT surrounding quote
// marks — the template supplies those. The card's front face and the
// attribution role ("Founder, Rychlost") are fixed and are not editable.
const FALLBACK_TESTIMONIAL_QUOTE =
  'Rychlost UAE delivered a campus network that is faster, cleaner, and easier to manage. Their structured ' +
  'cabling design and AV integration simplified our operations and improved reliability across every floor.';
const FALLBACK_TESTIMONIAL_OWNER_NAME = 'Nathan';

@Component({
  selector: 'app-why-rychlost',
  standalone: true,
  templateUrl: './why-rychlost.component.html',
  styleUrl: './why-rychlost.component.css',
})
export class WhyRychlostComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly heading = signal(FALLBACK_HEADING);
  readonly items = signal(FALLBACK_ITEMS);
  readonly testimonialQuote = signal(FALLBACK_TESTIMONIAL_QUOTE);
  readonly testimonialOwnerName = signal(FALLBACK_TESTIMONIAL_OWNER_NAME);

  // Both the checklist and the card sit below the fold, so their entrance
  // animations are triggered by scroll position (IntersectionObserver)
  // rather than firing on page load like the hero's animations do.
  @ViewChild('list') private listRef?: ElementRef<HTMLElement>;
  @ViewChild('card') private cardRef?: ElementRef<HTMLElement>;

  private observer?: IntersectionObserver;

  constructor(private whyRychlostService: WhyRychlostService) {}

  ngOnInit(): void {
    this.whyRychlostService.getPublic().subscribe({
      next: (content) => {
        if (content.heading) {
          this.heading.set(content.heading);
        }
        if (content.items?.length) {
          this.items.set(content.items);
        }
        if (content.testimonialQuote) {
          this.testimonialQuote.set(content.testimonialQuote);
        }
        if (content.testimonialOwnerName) {
          this.testimonialOwnerName.set(content.testimonialOwnerName);
        }
      },
      error: () => {
        // API unreachable — keep the fallback copy above.
      },
    });
  }

  ngAfterViewInit(): void {
    const targets = [this.listRef?.nativeElement, this.cardRef?.nativeElement].filter(
      (el): el is HTMLElement => !!el
    );

    if (!targets.length) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      // No IntersectionObserver support (very old browser) — just show them.
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    targets.forEach((el) => this.observer?.observe(el));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
