# Performance audit

## Bundle report

Production analyzer output is generated at `.next/analyze/client.html` with:

```bash
ANALYZE=true npm run build -- --webpack
```

Sizes below are parsed gzip sizes from that report. A package split across several
chunks is summed once per matching module group.

| Package | Gzip | Initial routes / loading behavior |
| --- | ---: | --- |
| `xlsx` | 136.2 KiB | No initial route; dynamically imported by export actions |
| `@mui/*` | 67.8 KiB | Product, category, cart, payment, policy/content routes |
| `react-icons` | 50.5 KiB | Shared layout and most interactive routes |
| `firebase` | 41.2 KiB | Dynamic only; no initial route |
| `framer-motion` | 36.8 KiB | Shared layout, auth, product, category, search, account |
| `swiper` | 30.7 KiB | Shared layout hero, cart, product details |
| `sweetalert2` | 20.0 KiB | Cart, payment, auth, contact, order and account routes |
| `dompurify` | 8.2 KiB | Product, category, search and favorites |
| `lucide-react` | 7.1 KiB | Shared layout, product, category, search and blogs |
| `next-auth` client | 5.4 KiB | Shared layout, auth, product, cart and account |
| `@tanstack/react-query` | 3.2 KiB | Shared layout through navbar search |
| `html-react-parser` | 1.6 KiB | Informational content routes |
| `@fortawesome/*` | 0 KiB | No client module found |

Largest application-related initial chunks are Framer Motion (36.8 KiB gzip)
and Swiper (30.7 KiB). Firebase is now split into four async assets and is not
initial for any entrypoint. `xlsx` is the largest route-specific chunk but is not initial.
SweetAlert2, payment UI, account UI, address forms, product gallery, filters and
password-reset code were not found in the homepage entrypoint.

## Provider tree

| Provider | Main consumers / routes | Before first paint? | Safe placement or deferral finding |
| --- | --- | --- | --- |
| `ThemeProvider` | Theme toggles on store UI | Theme itself yes | Keep global; the inline head script applies the theme before hydration |
| `LanguageProvider` | Navbar and nearly every localized route | Yes | Keep global until auth/store layouts are regression-tested |
| `DataProvider` | Logo, currency and footer settings | Navbar data is visible | Candidate for server initial data; do not move without layout tests |
| `AppProvider` | Navbar categories, footer, product, payment, quick buy | Categories are visible | Now accepts initial data, memoizes its value and defers supplementary requests |
| `ToastProvider` | Custom toast API | No | No live consumer was found in the audited imports; removal needs regression tests |
| `SessionProvider` | `AuthProvider`, login and product cards | Navbar user state is visible | Keep for the current global navbar |
| `QueryClientProvider` | `SearchComponent` | No | Navbar search makes it store-wide; move with a tested store route group |
| `AuthProvider` | Navbar, product, cart, login and account | Navbar user state is visible | Keep for the current global navbar |
| `FirebaseAuthProvider` | Firebase login and authenticated dropdown state | No for anonymous users | Best deferral candidate, but moving it must preserve dropdown and logout sync |
| `CartProvider` | Navbar cart, product, cart and checkout | Cart badge is visible | Keep for store routes; auth-only routes could exclude it after route grouping |
| `SearchHistoryProvider` | Navbar `SearchComponent` | No | Store-layout candidate; not needed by isolated auth pages |

The requested route-group conversion was intentionally not performed: the project
does not currently have complete route/deep-link/not-found regression coverage,
which the specification requires before moving routes.

## Motion and Swiper findings

- Lighthouse's four non-composited initial animations were reduced to zero by
  removing color/width transitions from the language trigger and hero pagination.
- A global `prefers-reduced-motion` fallback now shortens animations and transitions.
- The hero uses only `Pagination` and `Autoplay`; loop is disabled for one slide.
- Unneeded `observer` and `observeParents` were removed from the hero.
- Product gallery modules and CSS remain route-specific.
- Framer Motion remains shared because the navbar/drawers use interaction and exit
  animations. Replacing those was not attempted without visual regression coverage.

## Phase 11: image audit

The audit covered all 96 files in `public/images`. Large unreferenced assets were
left untouched. Referenced local fallbacks were converted while keeping the
originals for rollback:

| Source | Optimized file | Before | After | SSIM |
| --- | --- | ---: | ---: | ---: |
| `o1.jpg` | `o1.webp` | 374,190 B | 44,914 B | 0.9866 |
| `d4.jpg` | `d4-blog.webp` | 197,715 B | 25,414 B | 0.9800 |
| `not.jpg` | `not.webp` | 106,684 B | 1,072 B | 0.9974 |
| `cover.webp` | `cover-optimized.webp` | 262,672 B | 23,166 B | 0.9913 |
| `cat1.png` | `cat1.webp` | 72,014 B | 12,334 B | 0.9860 |
| `cat2.png` | `cat2.webp` | 93,632 B | 14,104 B | 0.9831 |
| `placeholder.png` | existing `placeholder.webp` | 424,958 B | 47,000 B | — |

Referenced fallback bytes dropped from 1,531,865 B to 168,004 B (89%). Alpha
was preserved for category images. All `next/image` fill usages now declare a
responsive `sizes` value. The shared fallback component records the failed
source and cannot recurse when the fallback itself fails.

## Phase 12: layout stability

The baseline shifts came from the ads row disappearing on request failure, the
logo rendering empty during provider loading, and auth/currency/theme controls
changing width after hydration. The ads row now keeps its 40 px reservation,
the logo has stable loading content, and the action slots have measured minimum
widths. Measured header geometry after the fix:

| Viewport | Navbar | Ads | Search row | Category row |
| --- | ---: | ---: | ---: | ---: |
| 360/390 px | 110 px | 40 px | 69 px | 0 px |
| 768 px | 123.5 px | 40 px | 82.5 px | 0 px |
| 1366/1440 px | 184.0 px | 40 px | 82.5 px | 60.5 px |

Final median CLS is 0.001573 mobile and 0.001696 desktop. The remaining tiny
shift is the theme control/icon hydration; it is well below the 0.1 target.

## Phase 13–14: main thread and JavaScript

- The homepage slider no longer waits for `window.load` plus idle time before
  hydration. Its server-rendered first slide remains the LCP image and the
  interactive slider starts without replacing the LCP several seconds later.
- App context no longer copies home categories into effect-driven state.
  Provider values are memoized.
- Firebase runtime and analytics are deferred. Even Next's automatic prefetch
  of `/login` cannot initialize Firebase: the SDK is imported only when the
  user clicks Google login or when a real persisted Firebase session exists.
- Final clean-profile runs made zero Firebase, Google API, GTM, or Analytics
  requests and created no Firebase IndexedDB databases.
- MUI barrel imports in product/cart/sticker code were replaced with direct
  icon imports. `xlsx` remains action-loaded and has no initial entrypoint.

## Phase 15: CSS and fonts

- The full `flag-icons` stylesheet was replaced by a route-level CSS Module
  containing only the 51 country codes used by the application. The separate
  30,727 B stylesheet is gone; the subset is 3,095 B.
- Homepage CSS no longer includes flag CSS.
- Tailwind output is minified. `optimizeCss` was tested both on and off; it was
  retained because builds were stable and it caused no stylesheet or rendering
  regression.
- Cairo remains served by `next/font` with `display: swap`. Removing the
  declared 300 weight did not reduce the emitted variable/subset font file, so
  the existing visual weight contract was preserved.

## Phase 16: delivery and caching

- Production uses `output: "standalone"`, compression, and the Next image
  optimizer with AVIF/WebP support.
- `postbuild` now copies `public` and `.next/static` into the generated
  standalone application. This is required by Next's standalone deployment
  format and prevents production image/script/font 404s.
- `_next/static` is served with one-year immutable caching.
- `/images/*` and `/logo/*` use one-day caching plus seven-day
  `stale-while-revalidate`.
- HTML/auth-sensitive responses keep private `no-store`.
- Public homepage categories and banners use a five-minute server revalidation
  window; authenticated API requests remain `no-store`.
- Next's server provides gzip. Brotli should be enabled at the production
  reverse proxy/CDN.

## Phase 17–18 findings

Lighthouse reports only these bfcache blockers, both marked `Not actionable`:

1. `MainResourceHasCacheControlNoStore`
2. `JsNetworkRequestReceivedCacheControlNoStoreResource`

There are no `unload` or `beforeunload` handlers. The `no-store` behavior was
not weakened because it protects personalized/auth-related state.

The baseline user-timing entries appeared only when Firebase Analytics loaded
and were named `GTM-G-325Y2PG15D:*`. They are third-party GTM measurements, not
application `performance.mark()` calls. Final clean runs contain zero
user-timing entries because anonymous navigation no longer initializes Firebase.

## Final production results

Lighthouse 12.8.2 was run three times for each mode against the complete
standalone build. Values below are medians.

| Metric | Mobile before | Mobile final | Desktop before | Desktop final |
| --- | ---: | ---: | ---: | ---: |
| Performance | 75 | **83** | 95 | **97** |
| FCP | 1,661 ms | **1,513 ms** | 411 ms | **411 ms** |
| LCP | 6,385 ms | **4,469 ms** | 1,367 ms | **1,033 ms** |
| TBT | 86 ms | **40 ms** | 0 ms | **0 ms** |
| CLS | 0.009763 | **0.001573** | 0.015240 | **0.001696** |
| Speed Index | 3,124 ms | **2,891 ms** | 1,247 ms | 1,426 ms |
| Main-thread work | 2,766 ms | **2,382 ms** | 763 ms | **717 ms** |
| Transfer bytes | 969,533 B | **663,058 B** | 1,013,763 B | **874,602 B** |

The mobile LCP is the eager hero image, present in initial HTML with
`fetchpriority="high"` and a responsive `srcset`; Lighthouse confirms it is
discoverable by the parser and is not lazy-loaded. Final mobile TBT is below
the requested 200 ms limit.

## Validation

- Next.js 16.1.1 Turbopack production build: passed.
- Standalone server: 22 homepage/core-route/static/image-optimizer checks, all 200.
- Clean browser: no failed same-origin asset requests, no hydration errors, and
  no anonymous Firebase requests. Direct backend API calls still emit CORS errors on
  localhost because the remote API does not allow the local origin.
- Arabic RTL, English LTR, French LTR, light mode, and dark mode: passed.
- Visual checks: 360×800, 390×844, 768×1024, 1366×768, and 1440×900 passed.
  Expected differences are the now-stable mobile logo/menu and the carousel's
  active slide timing.
- `git diff --check`: passed.
- Targeted ESLint for the new image, Firebase, app-context, login deferral, and
  standalone packaging code: passed.
- No test runner or test files exist in the repository.
- Full ESLint remains red on pre-existing debt: 631 findings (354 errors,
  277 warnings). This is one fewer error than the audited baseline and no new
  lint class was introduced by the performance work.
- Webpack analyzer compiles and emits the client report, then the repository's
  pre-existing invalid `authOptions` route export stops Webpack type validation.
  The normal Turbopack production build passes.
