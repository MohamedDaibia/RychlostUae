# Rychlost UI (Angular)

Frontend for the Rychlost website — Angular standalone components, matching the
brand tokens and layout from the Figma homepage design
(https://www.figma.com/design/fxKNRFeOejIsI36JCSUZwj).

## What's built so far

**Homepage**: Header, Category Nav (mega-menu + mobile slide-out), Hero, Trust
Strip, Brand Video section, Product Categories, Why Rychlost, Wholesale CTA
banner, Footer.

**Other pages**: About, Products (list with filter/sort/search), Product
Details (`/products/:slug`), Wholesale & Trade Accounts, Clients, Contact
(form UI only — doesn't submit anywhere yet).

## ⚠️ Content to confirm before this goes live

- **Category Nav subcategories are DRAFT placeholders** (see the `TODO(content)`
  comment in `category-nav.component.ts`) — typical industry subcategory names,
  not Rychlost's real catalog. Replace them with the actual list.
- **"AC Connectivity"** — assumed to mean "Active Connectivity" (switches,
  connectors, patch cords). Confirm what this category is actually meant to
  cover.
- Contact details (phone/email/address) are bracketed placeholders in the
  footer and Contact page — swap in the real values.
- Client logos and case studies on `/clients` are not yet in — no real
  client names/logos have been confirmed for display (see the project's
  `site-content-plan-link.md`).
- Product catalog (28 items) is placeholder data with no pricing —
  `src/app/core/data/products.data.ts`.

## Setup

```bash
npm install
npm start
```

Then open http://localhost:4200. `ng serve`'s dev server already handles
client-side routing correctly (see the note below), so this is the easiest
way to click through every page.

## Previewing a production build (`npm run build`)

This is a client-rendered Angular SPA — the build produces exactly one real
HTML file (`dist/rychlost-ui/browser/index.html`); every other route
(`/about`, `/products`, `/contact`, etc.) only exists inside the Angular
router in the browser, not as a file on disk. **If you serve the `dist`
folder with a plain static file server (or open `index.html` directly),
`/` will work but every other route will 404** — the server has no file at
that path to return, so it never gets the chance to hand control to Angular.

To preview the build correctly, the server needs to fall back to
`index.html` for any path it doesn't recognize. Two easy options:

```bash
npm run build
npm run preview   # serves dist/rychlost-ui/browser with SPA fallback (npx serve -s)
```

or, if you have `http-server` installed:

```bash
npx http-server dist/rychlost-ui/browser -p 8080 -c-1 --proxy http://localhost:8080?
```

**This also applies to real hosting** — whatever serves this build in
production needs the same SPA-fallback rule, or visitors who refresh on
`/products` or follow a direct link to `/about` will get a 404 there too:

- **IIS** (if you're hosting this on IIS rather than through the .NET
  backend directly): a `web.config` with a URL Rewrite rule is already
  included at `public/web.config`, and `ng build` copies it into
  `dist/rychlost-ui/browser/web.config` automatically on every build — no
  extra step needed, as long as the IIS site's physical path is (or
  includes) that `dist/rychlost-ui/browser` folder. It requires the IIS
  **URL Rewrite module** (free, from Microsoft:
  https://www.iis.net/downloads/microsoft/url-rewrite) — if the site
  starts returning a 500 error instead of fixing the 404s after deploying
  this file, that's the sign the module isn't installed. After installing
  it or deploying the file, recycle the site's app pool and re-test.
- **ASP.NET Core** (once this is served through the .NET backend instead
  of IIS static hosting): `app.MapFallbackToFile("index.html");` after
  `UseStaticFiles()`.
- **nginx**: `try_files $uri $uri/ /index.html;` in the `location` block.

## Design tokens

`src/app/core/styles/_tokens.scss` mirrors the Figma file's variable
collections (`Rychlost/Color`, `Rychlost/Space`, `Rychlost/Radius`) as CSS
custom properties. If a color, spacing, or radius value changes in Figma,
update it here too so the two stay in sync.
