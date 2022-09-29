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

const i18nKeys = [] as const;
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
  feedTitle: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

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

  const feedTitle = feed.title

  let indexOfItem = feed.items.indexOf(foundNews)
  let nextItemIndex = indexOfItem !== feed.items.length - 1 ? indexOfItem + 1 : -1
  let nextItemSlug = nextItemIndex !== -1 ? feed.items[nextItemIndex].id : ''
  let previousItemIndex = indexOfItem > 0 ? indexOfItem - 1 : -1
  let previousItemSlug = previousItemIndex !== -1 ? feed.items[previousItemIndex].id : ''
  nextItemSlug = nextItemSlug !== '' ? getSlug(nextItemSlug) as string : ''
  previousItemSlug = previousItemSlug !== '' ? getSlug(previousItemSlug) as string : ''

  const item: FeedItem = foundNews

  let url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  const canonical = `${host}/${params.lang}/${params.feed}/${params.item}`

  const loaderData: LoaderData = {
    i18n,
    canonical: canonical,
    item: item as FeedItem,
    current: indexOfItem,
    next: nextItemSlug,
    previous: previousItemSlug,
    feedTitle
  }

  return json(loaderData);
};

export default function ItemPage() {
  const { item, feedTitle, next, previous } = useLoaderData<LoaderData>();
  const params = useParams()

  return (
    <div className="overflow-y-hidden h-full w-full flex flex-col">
      <div className="flex items-center justify-between flex-none px-4 py-2 h-12 border-b border-black">
        <div className="flex items-center" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 12, 300, 2400, 1.5).lineHeight }}>
          <Link to={`/${params.lang}/works/${params.feed}`} className="underline uppercase">
            <p className="flex items-center">
              {feedTitle}
            </p>
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="hidden md:block w-4 h-4 mx-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <p className="hidden md:block  uppercase">
          {item.title}
          </p>
        </div>
        <div className="flex items-center justify-end">
          <Link to={`/${params.lang}/works/${params.feed}/${previous}`} className={(previous === "" ? "pointer-events-none opacity-50 select-none " : "") + "bg-white border border-black border-r-0 group-hover:underline rounded-l-md p-2 uppercase inline-block w-fit mx-auto"}>
            <p className="sr-only">
              {'Indietro'}
            </p>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 rotate-180">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
          <Link to={`/${params.lang}/works/${params.feed}/${next}`} className={(next === "" ? "pointer-events-none opacity-50 select-none " : "") + "bg-white border border-black group-hover:underline rounded-r-md p-2 uppercase inline-block w-fit mx-auto"}>
            <p className="sr-only">
              {'Avanti'}
            </p>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
      <div className="flex-1 h-4">
        <Attachment size="object-contain" align="object-center " attachment={{
          id: "",
          mediaType: "image/",
          url: item.image,
          description: item.title
        }}></Attachment>
      </div>
    </div>
  );
}