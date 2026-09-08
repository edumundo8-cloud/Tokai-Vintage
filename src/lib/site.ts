// Canonical public origin of the deployed site. Used for <link rel="canonical">,
// structured data, and the generated sitemap.
//
// If the production domain ever changes, update it in THREE places:
//   1. here
//   2. index.html  (og:url, twitter:url, canonical, JSON-LD)
//   3. public/robots.txt  (Sitemap: line)
// The Netlify functions read it from process.env.URL and don't need editing.
export const SITE_URL = 'https://tokaivintage.com';

export const SITE_NAME = 'Tokai Vintage';
