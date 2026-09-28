import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';

import { SupplyCategoriesService } from '../../core/content/supply-categories.service';

// What one carousel card needs to render. `iconMask` is a ready-to-use CSS
// `url("...")` value for the icon's mask, or null when no icon has been
// uploaded (the template then draws a default icon).
interface CategoryCard {
  id: number;
  title: string;
  description: string;
  linkUrl: string;
  iconMask: string | null;
}

function toMask(url: string): string {
  return `url("${url}")`;
}

// The site draws each icon as a CSS mask in the brand's cyan, so only the
// shape's alpha matters. These are the four launch icons as data: URIs
// (same-origin, so they never depend on the API being reachable).
function svgDataUri(shapes: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" ' +
    `stroke="#000" stroke-width="1.4">${shapes}</svg>`;
  return toMask(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
}

// Fallback copy — shown until the fetch below resolves, and kept if the API
// is unreachable, so the section is never blank. Mirrors the four categories
// the database is seeded with.
const FALLBACK_CATEGORIES: CategoryCard[] = [
  {
    id: 1,
    title: 'Structured & Custom Cabling',
    description: 'Copper and fiber cabling built and tested for demanding installs.',
    linkUrl: '/products?category=Structured%20%26%20Custom%20Cabling',
    iconMask: svgDataUri(
      '<circle cx="4" cy="10" r="2"/><circle cx="16" cy="10" r="2"/><path d="M6 10h8" stroke-linecap="round"/>'
    ),
  },
  {
    id: 2,
    title: 'Rack Enclosures & Cabinets',
    description: 'Enclosures and cabinets sized and specced for any server or comms room.',
    linkUrl: '/products?category=Rack%20Enclosures%20%26%20Cabinets',
    iconMask: svgDataUri(
      '<rect x="5" y="2" width="10" height="16" rx="1.5"/><path d="M8 6h4M8 10h4M8 14h4" stroke-linecap="round"/>'
    ),
  },
  {
    id: 3,
    title: 'AV & Connectivity Equipment',
    description: 'Connectivity and AV hardware that keeps systems talking to each other.',
    linkUrl: '/products?category=AV%20%26%20Connectivity%20Equipment',
    iconMask: svgDataUri('<rect x="2" y="4" width="16" height="10" rx="1.5"/><path d="M7 17h6M10 14v3" stroke-linecap="round"/>'),
  },
  {
    id: 4,
    title: 'Networking & Telecom Hardware',
    description: 'Switches, hardware, and telecom equipment for enterprise networks.',
    linkUrl: '/products?category=Networking%20%26%20Telecom%20Hardware',
    iconMask: svgDataUri(
      '<rect x="2" y="8" width="16" height="7" rx="1.2"/><path d="M5 8V6M9 8V6M13 8V6" stroke-linecap="round"/>'
    ),
  },
];

// How long each slide advance waits when autoplay is on.
const AUTOPLAY_MS = 5000;

// "What We Supply" — a horizontal carousel of category cards, loaded from the
// API (title, description, link, and icon are all admin-editable). Built on a
// native scroll-snap track, so touch swipe, trackpad, and keyboard scrolling
// work for free; the arrows, dots, and autoplay just drive that same scroll
// position. How many cards are visible at once is pure CSS (3 / 2 / 1 by
// screen width) — the JS reads the real card width, so it follows along.
@Component({
  selector: 'app-product-categories',
  standalone: true,
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.css',
})
export class ProductCategoriesComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly categories = signal<CategoryCard[]>(FALLBACK_CATEGORIES);

  // Carousel position/controls state — recomputed from the track's scroll
  // position by updateState().
  readonly canPrev = signal(false);
  readonly canNext = signal(false);
  readonly pageCount = signal(0);
  readonly activePage = signal(0);

  @ViewChild('track') private trackRef?: ElementRef<HTMLElement>;

  private resizeObserver?: ResizeObserver;
  private autoplayTimer?: ReturnType<typeof setInterval>;
  private paused = false;

  constructor(private categoriesService: SupplyCategoriesService) {}

  ngOnInit(): void {
    this.categoriesService.getPublic().subscribe({
      next: (items) => {
        this.categories.set(
          items.map((item) => {
            const iconUrl = this.categoriesService.iconUrl(item);
            return {
              id: item.id,
              title: item.title,
              description: item.description,
              linkUrl: item.linkUrl,
              iconMask: iconUrl ? toMask(iconUrl) : null,
            };
          })
        );
        // Wait for the new cards to render before measuring the track.
        setTimeout(() => {
          this.scrollTo(0, false);
          this.updateState();
        });
      },
      error: () => {
        // API unreachable — keep the fallback categories above.
      },
    });
  }

  ngAfterViewInit(): void {
    const track = this.trackRef?.nativeElement;
    if (!track) {
      return;
    }

    if (typeof ResizeObserver !== 'undefined') {
      // Breakpoint changes alter how many cards fit, so the page count and
      // prev/next availability need recomputing.
      this.resizeObserver = new ResizeObserver(() => this.updateState());
      this.resizeObserver.observe(track);
    }

    this.updateState();
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.stopAutoplay();
  }

  onScroll(): void {
    this.updateState();
  }

  prev(): void {
    this.scrollBySlides(-1);
  }

  next(): void {
    this.scrollBySlides(1);
  }

  goToPage(page: number): void {
    this.scrollTo(page * this.stepWidth(), true);
  }

  // Autoplay pauses while the pointer or keyboard focus is on the carousel,
  // so it never moves out from under someone who's reading or about to click.
  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  private startAutoplay(): void {
    const prefersReducedMotion =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    this.autoplayTimer = setInterval(() => {
      if (this.paused || this.pageCount() <= 1 || document.hidden) {
        return;
      }
      // Wrap back to the first card after the last one.
      if (this.canNext()) {
        this.next();
      } else {
        this.scrollTo(0, true);
      }
    }, AUTOPLAY_MS);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer !== undefined) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }

  // Distance from one card's left edge to the next: card width + the flex gap.
  private stepWidth(): number {
    const track = this.trackRef?.nativeElement;
    const slide = track?.querySelector<HTMLElement>('.category-carousel-slide');
    if (!track || !slide) {
      return 0;
    }
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return slide.offsetWidth + gap;
  }

  private scrollBySlides(direction: 1 | -1): void {
    const track = this.trackRef?.nativeElement;
    if (!track) {
      return;
    }
    track.scrollBy({ left: direction * this.stepWidth(), behavior: 'smooth' });
  }

  private scrollTo(left: number, smooth: boolean): void {
    this.trackRef?.nativeElement.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  }

  private updateState(): void {
    const track = this.trackRef?.nativeElement;
    if (!track) {
      return;
    }

    const step = this.stepWidth();
    const maxScroll = track.scrollWidth - track.clientWidth;
    // A few px of slack — scrollLeft is fractional on high-DPI screens.
    const slack = 4;

    this.canPrev.set(track.scrollLeft > slack);
    this.canNext.set(track.scrollLeft < maxScroll - slack);

    if (step <= 0 || maxScroll <= slack) {
      // Every card already fits — nothing to page through.
      this.pageCount.set(0);
      this.activePage.set(0);
      return;
    }

    const pages = Math.round(maxScroll / step) + 1;
    this.pageCount.set(pages);
    this.activePage.set(Math.min(pages - 1, Math.max(0, Math.round(track.scrollLeft / step))));
  }

  // Template helper: [0, 1, 2, ...] for the pagination dots.
  pages(): number[] {
    return Array.from({ length: this.pageCount() }, (_, i) => i);
  }
}
