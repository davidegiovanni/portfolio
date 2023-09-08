import { LoaderFunction } from "@remix-run/node";
import { safeGetFeed } from "~/api";
import { getSlug } from "~/utils/helpers";

const ALL_PAGES = [
  {
    locale: "it-IT",
    pages: [
      "works",
      "works/ux-tales",
      "works/facing-my-faces-project",
      "works/erotic-art",
      "about",
      "contacts",
      "random"
    ],
    feeds: [
      {
        key: "random",
        value: "random"
      },
      {
        key: "ux-tales",
        value: "works/ux-tales"
      },
      {
        key: "facing-my-faces-project",
        value: "works/facing-my-faces-project"
      },
      {
        key: "erotic-art",
        value: "works/erotic-art"
      }
    ]
  }
]

const HOST = "illos.davidegiovanni.com"

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)

  let pagesUrl: string[] = []

  async function processPages() {
    for (const page of ALL_PAGES) {
      pagesUrl.push(`https://${HOST}/${page.locale}`);
      
      if (page.pages.length > 0) {
        pagesUrl.push(...getAllPagesUrl(HOST, page.pages, page.locale));
      }
      
      if (page.feeds.length > 0) {
        const feedUrls = await getAllFeedsItemsUrl(HOST, page.feeds, page.locale);
        pagesUrl.push(...feedUrls);
      }
    }
  }

  await processPages();

  const content =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
${pagesUrl.map(page =>
`<url>
  <loc>${page}</loc>
</url>`
).join("")
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

// Helpers functions


function getAllPagesUrl(host: string, pages: string[], lang: string): string[] {
  const pagesUrl: string[] = []
  pages.map(page => {
    pagesUrl.push(`https://${host}/${lang}/${page}`)
  })
  return pagesUrl
}

async function getAllFeedsItemsUrl(host: string, feeds: { key: string; value: string; }[], lang: string): Promise<string[]> {
  const itemsUrl: string[] = []
  for (const feed of feeds) {
    const feedRes = await safeGetFeed(feed.key, {})
    if (typeof feedRes === "string" && feedRes === "error") {
      itemsUrl.push(`https://${host}/${lang}/${feed.value}`)
    } else if (typeof feedRes !== "string") {
      const itemsSlugs: string[] = feedRes.items.map(item => getSlug(item.id) as string)
      itemsUrl.push(...itemsSlugs.map(slug => `https://${host}/${lang}/${feed.value}/${slug}`))
    }
  }
  return itemsUrl
}