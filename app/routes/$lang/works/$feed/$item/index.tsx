import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = 'https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png'
  let url = 'https://holydavid.art' + location.pathname
  
  if (data !== undefined) {
    const page = data.item
    title = (page.title !== '' ? page.title : "News") + ' | Holy David'
    description = page.summary !== '' ? page.summary : "Holy David art website where you can fin news, info and more"
    image = page.image !== '' ? page.image : "https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png"
    url = 'https://holydavid.art' + location.pathname

  }
  
  return metadata(
    {
      title: title,
      description: description,
      image: image,
      url: url,
      robots: 'follow',
      type: 'website',
    }
  )
};

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  canonical: string;
  item: FeedItem;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  const lang = params.lang === 'it-it' ? 'it-IT' : 'en-US'
  const locale = params.lang === 'it-it' ? 'it' : 'en'

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/${params.feed}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes
  const slug = params.item
  let foundNews = feed.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundNews === undefined) {
    throw new Error("News undefined");
  }
  const item: FeedItem = foundNews

  const canonical = `https://holydavid.art/${params.lang}/${params.feed}/${params.item}`

  const loaderData: LoaderData = {
    i18n,
    canonical: canonical,
    item: item as FeedItem
  }

  return json(loaderData);
};

export default function NewsPage() {
  const { i18n, item, canonical } = useLoaderData<LoaderData>();
  const params = useParams()

  return (
    <div>
      <div>
        <h1 className="font-display uppercase" style={{ fontSize: fluidType(32, 80, 300, 2400, 1.5).fontSize, lineHeight: fluidType(24, 64, 300, 2400, 1.5).lineHeight }}>
          {item.title}
        </h1>
        <h2 className="mb-4" style={{ fontSize: fluidType(16, 12, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
          {item.summary}
        </h2>
        <p style={{ fontSize: fluidType(16, 12, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
          {formatDate(item.date_published, params.lang as string, 'short')}
        </p>
        <div className="h-full w-full lg:w-2/3 max-w-screen-sm" style={{ fontSize: fluidType(8, 16, 300, 2400, 1.5).fontSize, lineHeight: fluidType(8, 16, 300, 2400, 1.5).lineHeight }}>
          <article className="prose prose-sm text-black">
            {parse(item.content_html)}
          </article>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="w-full h-full p-2">
      <div className="error-message">
        <div className="inner-container">
          <div className="card">
            <div className="p-8 column">
              <div className="item">
                <h1 className="inline-block text-sm font-medium text-red-600 bg-red-100 rounded-full px-2 py-0.5">Errore</h1>
              </div>
              <p className="item">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}