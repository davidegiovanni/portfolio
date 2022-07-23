import { LoaderFunction } from "@remix-run/node";
import { Feed, FeedItem } from "api/models";
import { safeGet } from "~/utils/safe-post";
import queryString from 'query-string'

export const loader: LoaderFunction = async ({ request }) => {
  const feeds: string[] = []
  const [itFeedRes, itFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/newsroom-it/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (itFeedErr !== null) {
    throw new Error("Website didn't load correctly");
  }
  const itFeed: Feed = itFeedRes
  const itItems: FeedItem[] = itFeed.items


  const [enFeedRes, enFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/newsroom-en/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (enFeedErr !== null) {
    throw new Error("Website didn't load correctly");
  }
  const enFeed: Feed = enFeedRes
  const enItems: FeedItem[] = enFeed.items

  function getSlug (url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  const content = `
          <urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.w3.org/TR/xhtml11/xhtml11_schema.html http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/TR/xhtml11/xhtml11_schema.html">
            <url>
                <loc>https://holydavid.art/it-it</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="en" href="https://holydavid.art/en-us"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/it-it/events</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="en" href="https://holydavid.art/en-us/events"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/it-it/contacts</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="en" href="https://holydavid.art/en-us/contacts"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/it-it/newsroom</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="en" href="https://holydavid.art/en-us/newsroom"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/it-it/private-viewings</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="en" href="https://holydavid.art/en-us/private-viewings"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/en-us</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="en" href="https://holydavid.art/it-it/private-viewings"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/en-us/events</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="it" href="https://holydavid.art/it-it/events"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/en-us/contacts</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="it" href="https://holydavid.art/it-it/contacts"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/en-us/newsroom</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="it" href="https://holydavid.art/it-it/newsroom"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://holydavid.art/en-us/private-viewings</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="it" href="https://holydavid.art/it-it/private-viewings"/>
                <priority>1.0</priority>
            </url>
            ${
              enItems.map((item) => `<url>
              <loc>https://holydavid.art/en-us/newsroom/${getSlug(item.id)}}</loc>
              <lastmod>${new Date(item.date_published).toUTCString()}</lastmod>
              <priority>1.0</priority>
          </url>`)
            }
            ${
              itItems.map((item) => `<url>
              <loc>https://holydavid.art/it-it/newsroom/${getSlug(item.id)}</loc>
              <lastmod>${item.date_published}</lastmod>
              <priority>1.0</priority>
          </url>`)
            }
        </urlset>
      `.trim()

  // Return the response with the content, a status 200 message, and the appropriate headers for an XML page
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "xml-version": "1.0",
      "encoding": "UTF-8"
    }
  });
};