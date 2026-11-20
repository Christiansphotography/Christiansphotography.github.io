# Christian's Photography

Portfolio site for Christian (C-Jay) Bender — Fresno sports, wedding, and portrait photographer.

Live: [christiansphotography.github.io](https://christiansphotography.github.io/)

## Run locally

```bash
npm install
npm run dev
```

Then open the URL printed in the terminal (defaults to port `8743`).

Or without Node:

```bash
python3 -m http.server 8743 --bind 127.0.0.1
```

## Edit the site

- **Copy & contact:** `index.html` (hero text, About, Inquire phone/email/socials)
- **Look & layout:** `css/site.css`
- **Behavior:** `js/site.js` (slideshow, portfolio tabs, sports filters, lightbox)
- **Photos:** `photos/` — keep the `-800` / `-1600` naming when adding gallery images

Category shortcuts (`sports.html`, `weddings.html`, `portraits.html`) redirect into the matching gallery on the home page.
