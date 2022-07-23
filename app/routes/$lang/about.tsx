import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon } from '@heroicons/react/outline'

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = 'https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png'
  let url = 'https://illos.davidegiovanni.com' + location.pathname
  
  if (data !== undefined) {
    const page = data.item
    title = (page.title !== '' ? page.title : "About") + ' | Davide G. Steccanella'
    description = page.summary !== '' ? page.summary : "Il CV e altre informazioni sull'illustratore Davide G. Steccanella"
    image = page.image !== '' ? page.image : "https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png"
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

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/about/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes
  const slug = 'about'
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

export default function About() {
  const { i18n, item, canonical } = useLoaderData<LoaderData>();
  const params = useParams()

    return (
      <div className="overflow-y-auto lg:overflow-y-hidden flex flex-col lg:flex-row h-full relative">
        <div className="absolute top-0 left-0 m-4">
          <Link to={`/${params.lang}`} className="underline text-white">
            <p className="sr-only">
              Torna indietro
            </p>
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
        </div>
        <div className="w-full lg:w-2/5 p-4 flex items-center justify-center bg-black">
          <img src={item.image} className="w-2/3 lg:w-1/2 h-auto" alt="" />
        </div>
        <div className="flex-1 flex flex-col justify-center items-end py-4 lg:py-16 lg:overflow-y-auto px-4">
          <div className="flex justify-start w-full w-full lg:w-9/12 mx-auto">
            <div className="w-full">
              <h1 style={{ fontSize: fluidType(20, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 32, 300, 2400, 1.5).lineHeight }}>
                {item.title}
              </h1>
              <h2 className="w-full my-4 columns-2 gap-2 pt-4 pb-1 border-y border-black" style={{ fontSize: fluidType(16, 24, 300, 2400, 1.5).fontSize, lineHeight: fluidType(8, 16, 300, 2400, 1.5).lineHeight }}>
                {item.summary}
              </h2>
            </div>
          </div>
          { item.content_html !== "" && item.content_html !== undefined &&
            <div className="h-full w-10/12 lg:w-2/3 max-w-screen-md mb-2">
              <article className="prose prse-sm md:prose-lg text-black">
                {parse(item.content_html)}
              </article>
            </div>
          }
        </div>
      </div>  
    )
}