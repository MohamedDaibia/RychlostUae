import { Component, OnInit, signal } from '@angular/core';

import { WhoWeAreService } from '../../core/content/who-we-are.service';

// Kept as the fallback copy if the API is unreachable, and as the initial
// value shown before the fetch below resolves — same text that used to be
// hardcoded here. The admin "Home page" screen edits the live copy via
// WhoWeAreService; this component just renders whatever it returns.
const FALLBACK_HEADING = 'Who We Are';
const FALLBACK_BODY =
  "From structured cabling to telecom hardware, Rychlost stocks tested, proven products so your " +
  'team can build with confidence without compromise. See how we keep networking and telecom ' +
  'projects across the UAE moving forward.';

@Component({
  selector: 'app-brand-video',
  standalone: true,
  templateUrl: './brand-video.component.html',
  styleUrl: './brand-video.component.css',
})
export class BrandVideoComponent implements OnInit {
  readonly heading = signal(FALLBACK_HEADING);
  readonly body = signal(FALLBACK_BODY);

  constructor(private whoWeAreService: WhoWeAreService) {}

  ngOnInit(): void {
    this.whoWeAreService.getPublic().subscribe({
      next: (content) => {
        if (content.heading) {
          this.heading.set(content.heading);
        }
        if (content.body) {
          this.body.set(content.body);
        }
      },
      error: () => {
        // API unreachable — keep showing the fallback copy above rather
        // than leaving this section blank.
      },
    });
  }
}
