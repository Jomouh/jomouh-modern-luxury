# Jomouh Group website

A static website, ready to deploy on Vercel. No build step.

## Pages

| URL | File | What it is |
|---|---|---|
| `/` | `index.html` | Jomouh Group homepage (live marble hero, 3D business scenes) |
| `/marketing` | `marketing.html` | Jomouh Media (replaces the current marketing homepage) |
| `/kitchen-supply` | `kitchen-supply.html` | Jomouh Kitchen Supply |
| `/stone` | `stone.html` | Jomouh Stone |
| `/contact` | `contact.html` | Contact form routed by division |
| any other URL | `404.html` | Page not found |

`vercel.json` gives clean URLs (no `.html`), caching, and basic security headers.

## Important before you deploy

Deploying this **replaces** the current jomouh.com homepage. The marketing agency content now lives at **jomouh.com/marketing** in the new group design.

## Deploy to Vercel

**Option A: through GitHub (recommended)**
1. Open the GitHub repository your current jomouh.com site deploys from (Vercel dashboard → your project → Settings → Git).
2. Replace the repository's files with the contents of this folder and commit.
3. Vercel redeploys automatically. Check the preview, then it goes live on jomouh.com.

**Option B: with the Vercel CLI**
1. Install Node.js, then run `npm i -g vercel`.
2. In this folder run `vercel link` and choose your existing jomouh.com project.
3. Run `vercel --prod`.

## Make the forms deliver to your inbox

Right now every form opens the visitor's email app with the message pre-filled and addressed to the right division (info@, media@, kitchen@, stone@). To receive submissions directly instead:

1. Create a free form at https://formspree.io (or any service that accepts form POSTs).
2. Copy its endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
3. Open `assets/js/site.js` and paste it into `const FORM_ENDPOINT = '';`.
4. Redeploy. Each submission includes a `division` field so you can filter by business.

Also make sure the four addresses exist as aliases in your email provider: info@, media@, kitchen@, and stone@jomouh.com.

## After launch

1. Test every form once on desktop and on a phone.
2. Run https://pagespeed.web.dev on each page.
3. Add jomouh.com to Google Search Console and submit `https://jomouh.com/sitemap.xml`.

## Editing

All text is plain HTML in the page files. Styles live in `assets/css/site.css`. The 3D scenes are in `assets/js/scene3d.js` (built with three.js r128, MIT licence, included in `assets/js`). The marble hero is `assets/js/marble.js`.

