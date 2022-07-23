import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { XIcon } from '@heroicons/react/outline'

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname
  
  if (data !== undefined) {
    const page = data.item
    title = (page.title !== '' ? page.title : "Page") + ' | Davide G. Steccanella'
    description = page.summary !== '' ? page.summary : "Le illustrazioni di Davide G. Steccanella"
    image = page.image !== '' ? page.image : ""
    url = 'https://illos.davidegiovanni.com' + location.pathname

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

  const canonical = `https://illos.davidegiovanni.com/${params.lang}/${params.feed}/${params.item}`

  const loaderData: LoaderData = {
    i18n,
    canonical: canonical,
    item: item as FeedItem
  }

  return json(loaderData);
};

export default function ItemPage() {
  const { i18n, item, canonical } = useLoaderData<LoaderData>();
  const params = useParams()

  return (
    <div className="overflow-y-hidden flex flex-col h-full relative">
      {/* <div className="flex-none absolute bottom-0 right-0 w-1/2 z-20 bg-white p-4">
        <div className="flex justify-start">
          <div style={{ fontSize: fluidType(16, 24, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 20, 300, 2400, 1.5).lineHeight }}>
            <h1>
              {item.title}
            </h1>
            <h2 className="my-2">
              {item.summary}
            </h2>
          </div>
        </div>
        { item.content_html !== "" && item.content_html !== undefined &&
          <div className="h-full w-full lg:w-2/3 max-w-screen-sm mb-2 columns-2 gap-2" style={{ fontSize: fluidType(8, 16, 300, 2400, 1.5).fontSize, lineHeight: fluidType(8, 16, 300, 2400, 1.5).lineHeight }}>
            <article className="prose prose-sm text-black">
              {parse(item.content_html)}
            </article>
          </div>
        }
      </div> */}
      <img src={item.image} className="absolute inset-0 w-full h-full object-contain" alt="" />
      <div className="absolute inset-x-0 bottom-0 w-full z-50 text-white bg-gradient-to-t from-black to-transparent p-2 text-center h-16 flex items-center justify-center">
        <Link to={`/${params.lang}/works/${params.feed}`}>
          <p className="sr-only">
            Torna indietro
          </p>
          <XIcon className="w-8 h-8 text-white"/>
        </Link>
      </div>
    </div>
  );
}