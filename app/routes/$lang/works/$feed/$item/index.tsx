import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
import queryString from 'query-string'

import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon, ArrowRightIcon, ViewGridAddIcon, ViewGridIcon, XIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";

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
    description = page.summary !== '' ? page.summary : page.title !== '' ? page.title : "Le illustrazioni di Davide G. Steccanella"
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
  previous: string;
  current: number;
  next: string;
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

  function getSlug(url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  let indexOfItem = feed.items.indexOf(foundNews)
  let nextItemIndex = indexOfItem !== feed.items.length - 1 ? indexOfItem + 1 : -1
  let nextItemSlug = nextItemIndex !== -1 ? feed.items[nextItemIndex].id : ''
  let previousItemIndex = indexOfItem > 0 ? indexOfItem - 1 : -1
  let previousItemSlug = previousItemIndex !== -1 ? feed.items[previousItemIndex].id : ''
  nextItemSlug = nextItemSlug !== '' ? getSlug(nextItemSlug) as string : ''
  previousItemSlug = previousItemSlug !== '' ? getSlug(previousItemSlug) as string : ''

  const item: FeedItem = foundNews

  const canonical = `https://illos.davidegiovanni.com/${params.lang}/${params.feed}/${params.item}`

  const loaderData: LoaderData = {
    i18n,
    canonical: canonical,
    item: item as FeedItem,
    current: indexOfItem,
    next: nextItemSlug,
    previous: previousItemSlug
  }

  return json(loaderData);
};

export default function ItemPage() {
  const { item, current, next, previous } = useLoaderData<LoaderData>();
  const params = useParams()

  return (
    <div className="overflow-y-hidden flex flex-col h-full relative">
      <div className="flex-1 w-full relative flex flex-col overflow-y-hidden">
        <div className="w-full h-full">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: item.image,
              description: item.title
            }}></Attachment>
          </div>
      </div>
      <div className="flex items-center justify-between flex-none h-10 mt-4 mb-4 lg:mb-0 w-10/12 lg:w-1/2 mx-auto text-white bg-gradient-to-t from-black to-transparent text-center">
        {
          previous !== '' ?
            <Link to={`/${params.lang}/works/${params.feed}/${previous}`}>
              <p className="sr-only">
                Precedente
              </p>
              <ArrowLeftIcon className="w-8 h-8 text-white" />
            </Link> :
            <div className="w-8 h-8"></div>
        }
        <Link to={`/${params.lang}/works/${params.feed}`}>
          <p className="sr-only">
            Torna indietro
          </p>
          <ViewGridIcon className="w-8 h-8 text-white" />
        </Link>
        {
          next !== '' ?
            <Link to={`/${params.lang}/works/${params.feed}/${next}`}>
              <p className="sr-only">
                Successivo
              </p>
              <ArrowRightIcon className="w-8 h-8 text-white" />
            </Link> :
            <div className="w-8 h-8"></div>
        }
      </div>
    </div>
  );
}