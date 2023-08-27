import { LoaderFunction } from "@remix-run/node";
import { safeGet } from "~/utils/safe-post";
import queryString from 'query-string'
import { WebPageModel, WebSectionModel, Feed } from "~/models";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)

  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  const pages: any = {
    'it-IT': [
      'it-IT/about',
      'it-IT/works',
      'it-IT/random',
      'it-IT/contacts'
    ]
  }
  
  const [defaultWebsiteRes, defaultWebsiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (defaultWebsiteErr !== null) {
    throw new Error(`Error: ${defaultWebsiteErr.message} ${defaultWebsiteErr.code}`);
  }

  const locales = defaultWebsiteRes.languageCodes

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
  
  const [randomFeedRes, randomFeedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/random/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (randomFeedRes !== null) {
    throw new Error(`${randomFeedRes.message} ${randomFeedRes.code}, feed: random`);
  }
  itFeeds.push(randomFeedRes)

  function getSlug (url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

const pagesList = locales.map((l: any) => (pages[l])?.map((p: any) =>
`<url>
  <loc>https://${host}/${p}</loc>
</url>
`).join("")
)

const itFeedItemsList = itFeeds.map((feed) => feed.items.map((item) =>
`<url>
  <loc>https://${host}/it-IT/works/${feed.title.toLowerCase().split(' ').join('-')}/${getSlug(item.id)}</loc>
</url>
`).join("")
).join("")

const itFeedsList = itFeeds.map((feed) =>
`<url>
  <loc>https://${host}/it-IT/works/${feed.title.toLowerCase().split(' ').join('-')}</loc>
</url>
`
).join("")

const indexesList = locales.map((l: any) =>
`<url>
  <loc>https://${host}/${l}</loc>
</url>
`).join("")
  

  const content = 
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
${indexesList}
${pagesList}
${itFeedItemsList} 
${itFeedsList}
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