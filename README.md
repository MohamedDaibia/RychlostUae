# Rychlost UI (Angular)

Frontend for the Rychlost website — Angular standalone components, matching the
brand tokens and layout from the Figma homepage design
(https://www.figma.com/design/fxKNRFeOejIsI36JCSUZwj).

## What's built so far

- **Header** (`src/app/components/header`) — logo, primary nav, "Request a Quote" CTA.
- **Category Nav** (`src/app/components/category-nav`) — the 5-category mega-nav
  with click-to-open dropdown submenus and a search field.
- **Hero** (`src/app/components/hero`) — headline, subhead, two CTAs, brand graphic panel.

Everything else from the Figma homepage (trust strip, product category cards,
"Why Rychlost", wholesale CTA banner, footer) and the other pages (About,
Products, Wholesale & Trade, Clients, Contact) are not built yet.

## ⚠️ Content to confirm before this goes live

- **Category Nav subcategories are DRAFT placeholders** (see the `TODO(content)`
  comment in `category-nav.component.ts`) — typical industry subcategory names,
  not Rychlost's real catalog. Replace them with the actual list.
- **"AC Connectivity"** — assumed to mean "Active Connectivity" (switches,
  connectors, patch cords). Confirm what this category is actually meant to
  cover.
- Header/nav links point to routes (`/about`, `/products`, etc.) that don't
  exist yet — they'll 404 until those pages are built and added to
  `app.routes.ts`.

## Setup

This project was hand-authored to match the Angular CLI's standard output —
`node_modules` isn't included. From this folder:

```bash
npm install
npm start
```

Then open http://localhost:4200.

## Design tokens

`src/app/core/styles/_tokens.scss` mirrors the Figma file's variable
collections (`Rychlost/Color`, `Rychlost/Space`, `Rychlost/Radius`) as CSS
custom properties. If a color, spacing, or radius value changes in Figma,
update it here too so the two stay in sync.
