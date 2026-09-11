import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { WhoWeAreService } from '../../../core/content/who-we-are.service';
import { WhyRychlostService } from '../../../core/content/why-rychlost.service';
import { WholesaleCtaService } from '../../../core/content/wholesale-cta.service';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-cms.component.html',
  styleUrl: './admin-cms.component.scss',
})
export class AdminCmsComponent implements OnInit {
  readonly message = signal('Loading…');

  // "Who We Are" editor — the home page's brand-video section reads this
  // live via WhoWeAreService.getPublic(); this form edits it via
  // getForEdit()/update() (both behind the admin JWT).
  readonly whoWeAreForm: FormGroup;
  readonly whoWeAreLoading = signal(true);
  readonly whoWeAreSaving = signal(false);
  readonly whoWeAreError = signal<string | null>(null);
  readonly whoWeAreSaved = signal(false);

  // "Why Rychlost" editor — sub-heading, fixed 3-item checklist, and the
  // back face of the testimonial card (content + owner name) shown on the
  // home page's Why Rychlost section. The "Why Rychlost" eyebrow label, the
  // card's front face, and the attribution role ("Founder, Rychlost") are
  // NOT editable here, by design — they stay fixed in the
  // WhyRychlostComponent template.
  readonly whyRychlostForm: FormGroup;
  readonly whyRychlostLoading = signal(true);
  readonly whyRychlostSaving = signal(false);
  readonly whyRychlostError = signal<string | null>(null);
  readonly whyRychlostSaved = signal(false);

  // "Contact our customer support" CTA banner editor — the eyebrow label
  // and paragraph shown on the home page just before the footer. The
  // heading ("Contact our customer support") and the "Contact Us" button
  // are NOT editable here, by design — they stay fixed in the
  // WholesaleCtaComponent template.
  readonly wholesaleCtaForm: FormGroup;
  readonly wholesaleCtaLoading = signal(true);
  readonly wholesaleCtaSaving = signal(false);
  readonly wholesaleCtaError = signal<string | null>(null);
  readonly wholesaleCtaSaved = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private whoWeAreService: WhoWeAreService,
    private whyRychlostService: WhyRychlostService,
    private wholesaleCtaService: WholesaleCtaService,
  ) {
    this.whoWeAreForm = this.fb.group({
      heading: ['', [Validators.required]],
      body: ['', [Validators.required]],
    });

    this.whyRychlostForm = this.fb.group({
      heading: ['', [Validators.required]],
      items: this.fb.array([
        this.buildChecklistItemGroup(),
        this.buildChecklistItemGroup(),
        this.buildChecklistItemGroup(),
      ]),
      testimonialQuote: ['', [Validators.required]],
      testimonialOwnerName: ['', [Validators.required]],
    });

    this.wholesaleCtaForm = this.fb.group({
      eyebrow: ['', [Validators.required]],
      text: ['', [Validators.required]],
    });
  }

  get heading() {
    return this.whoWeAreForm.controls['heading'];
  }

  get body() {
    return this.whoWeAreForm.controls['body'];
  }

  get whyRychlostHeading() {
    return this.whyRychlostForm.controls['heading'];
  }

  get whyRychlostItems(): FormArray {
    return this.whyRychlostForm.get('items') as FormArray;
  }

  get testimonialQuote() {
    return this.whyRychlostForm.controls['testimonialQuote'];
  }

  get testimonialOwnerName() {
    return this.whyRychlostForm.controls['testimonialOwnerName'];
  }

  get wholesaleCtaEyebrow() {
    return this.wholesaleCtaForm.controls['eyebrow'];
  }

  get wholesaleCtaText() {
    return this.wholesaleCtaForm.controls['text'];
  }

  private buildChecklistItemGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Confirms the token against the API rather than trusting local state alone.
    this.authService.fetchCms().subscribe({
      next: (res) => this.message.set(res.message),
      error: () => {
        this.authService.logout();
        this.router.navigateByUrl('/admin/login');
      },
    });

    this.whoWeAreService.getForEdit().subscribe({
      next: (content) => {
        this.whoWeAreForm.setValue({ heading: content.heading, body: content.body });
        this.whoWeAreLoading.set(false);
      },
      error: () => {
        this.whoWeAreError.set('Could not load the current "Who We Are" content.');
        this.whoWeAreLoading.set(false);
      },
    });

    this.whyRychlostService.getForEdit().subscribe({
      next: (content) => {
        this.whyRychlostForm.patchValue({
          heading: content.heading,
          testimonialQuote: content.testimonialQuote,
          testimonialOwnerName: content.testimonialOwnerName,
        });
        content.items.forEach((item, index) => {
          this.whyRychlostItems.at(index)?.patchValue(item);
        });
        this.whyRychlostLoading.set(false);
      },
      error: () => {
        this.whyRychlostError.set('Could not load the current "Why Rychlost" content.');
        this.whyRychlostLoading.set(false);
      },
    });

    this.wholesaleCtaService.getForEdit().subscribe({
      next: (content) => {
        this.wholesaleCtaForm.setValue({ eyebrow: content.eyebrow, text: content.text });
        this.wholesaleCtaLoading.set(false);
      },
      error: () => {
        this.wholesaleCtaError.set('Could not load the current "Contact our customer support" content.');
        this.wholesaleCtaLoading.set(false);
      },
    });
  }

  saveWhoWeAre(): void {
    if (this.whoWeAreForm.invalid) {
      this.whoWeAreForm.markAllAsTouched();
      return;
    }

    this.whoWeAreSaving.set(true);
    this.whoWeAreError.set(null);
    this.whoWeAreSaved.set(false);

    const { heading, body } = this.whoWeAreForm.getRawValue();

    this.whoWeAreService.update({ heading: heading ?? '', body: body ?? '' }).subscribe({
      next: () => {
        this.whoWeAreSaving.set(false);
        this.whoWeAreSaved.set(true);
      },
      error: () => {
        this.whoWeAreSaving.set(false);
        this.whoWeAreError.set('Could not save — please try again.');
      },
    });
  }

  saveWhyRychlost(): void {
    if (this.whyRychlostForm.invalid) {
      this.whyRychlostForm.markAllAsTouched();
      return;
    }

    this.whyRychlostSaving.set(true);
    this.whyRychlostError.set(null);
    this.whyRychlostSaved.set(false);

    const value = this.whyRychlostForm.getRawValue();

    this.whyRychlostService
      .update({
        heading: value.heading ?? '',
        items: value.items,
        testimonialQuote: value.testimonialQuote ?? '',
        testimonialOwnerName: value.testimonialOwnerName ?? '',
      })
      .subscribe({
        next: () => {
          this.whyRychlostSaving.set(false);
          this.whyRychlostSaved.set(true);
        },
        error: () => {
          this.whyRychlostSaving.set(false);
          this.whyRychlostError.set('Could not save — please try again.');
        },
      });
  }

  saveWholesaleCta(): void {
    if (this.wholesaleCtaForm.invalid) {
      this.wholesaleCtaForm.markAllAsTouched();
      return;
    }

    this.wholesaleCtaSaving.set(true);
    this.wholesaleCtaError.set(null);
    this.wholesaleCtaSaved.set(false);

    const { eyebrow, text } = this.wholesaleCtaForm.getRawValue();

    this.wholesaleCtaService.update({ eyebrow: eyebrow ?? '', text: text ?? '' }).subscribe({
      next: () => {
        this.wholesaleCtaSaving.set(false);
        this.wholesaleCtaSaved.set(true);
      },
      error: () => {
        this.wholesaleCtaSaving.set(false);
        this.wholesaleCtaError.set('Could not save — please try again.');
      },
    });
  }
}
