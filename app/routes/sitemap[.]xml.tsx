import { LoaderFunction } from "@remix-run/node";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
import { safeGet } from "~/utils/safe-post";
import queryString from 'query-string'

export const loader: LoaderFunction = async ({ request }) => {
  const url = request.url
  const host = new URL(url).host

  let websiteName = host.includes('localhost') ? 'illos.davidegiovanni.com' : host;

  const [workRes, workErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${websiteName}/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=it-IT`)
  if (workErr !== null) {
    throw new Error(`API Page Works: ${workErr.message} ${workErr.code}`);
  }
  const workPage: WebPageModel = workRes.page
  const workSections: WebSectionModel[] = workPage.sections
  let workFeeds: WebSectionModel[] = workSections.length > 1 ? workSections.splice(1) : [] as WebSectionModel[]
  const mappedWorkFeeds = workFeeds.map(wf => wf.description)

  let itFeeds: Feed[] = []

  for (let index = 0; index < mappedWorkFeeds.length; index++) {
    const mappedFeed = mappedWorkFeeds[index];
    const [itFeedRes, itFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/${mappedFeed}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
    if (itFeedErr !== null) {
      throw new Error(`${itFeedErr.message} ${itFeedErr.code}, feed: ${mappedFeed}`);
    }
    itFeeds.push(itFeedRes)
  }

  function getSlug (url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  const content = `<?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.w3.org/TR/xhtml11/xhtml11_schema.html http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/TR/xhtml11/xhtml11_schema.html">
            <url>
                <loc>https://${websiteName}/it-IT</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <xhtml:link rel="alternate" hreflang="en" href="https://${websiteName}/en-US"/>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://${websiteName}/it-IT/works</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://${websiteName}/it-IT/contacts</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://${websiteName}/it-IT/about</loc>
                <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                <priority>1.0</priority>
            </url>
            ${
              itFeeds.map((feed) =>
                  feed.items.map((item) => `<url>
                  <loc>https://${websiteName}/it-it/works/${feed.title.toLowerCase().split(' ').join('-')}/${getSlug(item.id)}</loc>
                  <lastmod>${item.date_published}</lastmod>
                  <priority>1.0</priority>
              </url>`)
              )
            }
            ${
              itFeeds.map((feed) =>`<url>
                  <loc>https://${websiteName}/it-it/works/${feed.title.toLowerCase().split(' ').join('-')}</loc>
                  <lastmod>2022-01-01T00:00:00+01:00</lastmod>
                  <priority>1.0</priority>
              </url>`
              )
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