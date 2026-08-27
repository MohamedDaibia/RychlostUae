import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-why-rychlost',
  standalone: true,
  templateUrl: './why-rychlost.component.html',
  styleUrl: './why-rychlost.component.css',
})
export class WhyRychlostComponent implements AfterViewInit, OnDestroy {
  // Both the checklist and the card sit below the fold, so their entrance
  // animations are triggered by scroll position (IntersectionObserver)
  // rather than firing on page load like the hero's animations do.
  @ViewChild('list') private listRef?: ElementRef<HTMLElement>;
  @ViewChild('card') private cardRef?: ElementRef<HTMLElement>;

  private observer?: IntersectionObserver;

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
