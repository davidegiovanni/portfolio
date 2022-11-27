import { LoaderFunction } from "@remix-run/node";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
import { safeGet } from "~/utils/safe-post";
import queryString from 'query-string'

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)

  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  const pages: any = {
    'it-IT': [
      'it-IT/about',
      'it-IT/works',
      'it-IT/contacts'
    ]
  }
  
  const [defaultWebsiteRes, defaultWebsiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (defaultWebsiteErr !== null) {
    throw new Error(`Error: ${defaultWebsiteErr.message} ${defaultWebsiteErr.code}`);
  }

  const locales = defaultWebsiteRes.languageCodes

  function getAlternateLocales(locale: string): string[] {
    return defaultWebsiteRes.languageCodes.filter((l: any) => l !== locale)
  }

  const [itWorkRes, itWorkErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=it-IT`)
  if (itWorkErr !== null) {
    throw new Error(`Error: ${itWorkErr.message} ${itWorkErr.code}`);
  }
  const workPage: WebPageModel = itWorkRes.page
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
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${locales.map((l: any) => (
  `<url>
    <loc>https://${host}/${l}</loc>
    <lastmod>2022-01-01T00:00:00+01:00</lastmod>${getAlternateLocales(l).map(al => (`
    <xhtml:link
                rel="alternate"
                hreflang="${al}"
                href="https://${host}/${al}"/>`)).toString().split(',').join('')}
    <priority>1.0</priority>
  </url>`)).toString().split(',').join('')
  }
  <url>
    <loc>https://${host}/it-IT/works</loc>
    <lastmod>2022-01-01T00:00:00+01:00</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${host}/it-IT/contacts</loc>
    <lastmod>2022-01-01T00:00:00+01:00</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${host}/it-IT/about</loc>
    <lastmod>2022-01-01T00:00:00+01:00</lastmod>
    <priority>1.0</priority>
  </url>
  ${locales.map((l: any) => (pages[l]).map((p: any) => (
    `<url>
      <loc>https://${host}/${p}</loc>
      <lastmod>2022-01-01T00:00:00+01:00</lastmod>
      <priority>1.0</priority>
    </url>`)).toString().split(',').join('')
  )}
  ${itFeeds.map((feed) => feed.items.map((item) => (
    `<url>
      <loc>https://${host}/it-IT/works/${feed.title.toLowerCase().split(' ').join('-')}/${getSlug(item.id)}</loc>
      <lastmod>${item.date_published}</lastmod>
      <priority>1.0</priority>
    </url>`)).toString().split(',').join('')
  )} 
  ${itFeeds.map((feed) =>(
    `<url>
      <loc>https://${host}/it-IT/works/${feed.title.toLowerCase().split(' ').join('-')}</loc>
      <lastmod>2022-01-01T00:00:00+01:00</lastmod>
      <priority>1.0</priority>
    </url>`).toString().split(',').join('')
  )}
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