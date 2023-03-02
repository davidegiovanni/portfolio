import { json, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
import queryString from 'query-string'

import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, ViewGridAddIcon, ViewGridIcon, XIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";
import { useState } from "react";
import { feed } from "~/api";
import { DynamicLinksFunction } from "remix-utils";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}/works/${params.feed}/${params.item}` }];
};
export let handle = { dynamicLinks };

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { meta } = data as LoaderData;
    title = (meta.title !== '' ? meta.title : "Contatti") + ' | Davide G. Steccanella'
    description = meta.description !== '' ? meta.description : "Contatta Davide Giovanni Steccanella per le sue illustrazioni"
    image = meta.image !== '' ? meta.image : ''
    url = 'https://illos.davidegiovanni.com' + location.pathname
  }

  return metadata(
    {
      title: title,
      description: description,
      image: image,
      url: url,
      robots: 'all',
      type: 'website',
    }
  )
};

type LoaderData = {
  title: string;
  description: string;
  image: string;
  previous: string;
  current: number;
  next: string;
  feedTitle: string;
  meta: {
    title: string;
    description: string;
    image: string;
  };
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""
  let meta = {
    title: "",
    description: "",
    image: ""
  }

  const [feedRes, feedErr] = await feed(params.feed as string, params)
  if (feedErr !== null) {
    throw new Response(`Feed do not exist: ${feedErr.message} ${feedErr.code}`, {
      status: 404,
    });
  }

  const feedObject: Feed = feedRes
  const slug = params.item
  let foundImage = feedObject.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundImage === undefined) {
    throw new Response(`Page do not exist`, {
      status: 404,
    });
  }

  function getSlug(url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  const feedTitle = feedObject.title

  const feedItemsToShow = feedObject.items.length > 1 ? feedObject.items.slice(0, -1) : feedObject.items

  let indexOfItem = feedItemsToShow.indexOf(foundImage)
  let nextItemIndex = indexOfItem !== feedItemsToShow.length - 1 ? indexOfItem + 1 : -1
  let nextItemSlug = nextItemIndex !== -1 ? feedItemsToShow[nextItemIndex].id : ''
  let previousItemIndex = indexOfItem > 0 ? indexOfItem - 1 : -1
  let previousItemSlug = previousItemIndex !== -1 ? feedItemsToShow[previousItemIndex].id : ''
  nextItemSlug = nextItemSlug !== '' ? getSlug(nextItemSlug) as string : ''
  previousItemSlug = previousItemSlug !== '' ? getSlug(previousItemSlug) as string : ''

  const title = foundImage.title
  const description = foundImage.summary
  const image = foundImage.image

  meta.title = title
  meta.description = description
  meta.image = image

  const loaderData: LoaderData = {
    title,
    image,
    description,
    current: indexOfItem,
    next: nextItemSlug,
    previous: previousItemSlug,
    feedTitle,
    meta
  }

  return json(loaderData);
};

export default function ItemPage() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()

  const [isZoom, setZoom] = useState(false)
  const previous = loaderData.previous
  const next = loaderData.next

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between flex-none px-2 py-2 h-12 border-b border-black">
        <div className="flex items-center" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 12, 300, 2400, 1.5).lineHeight }}>
          <Link to={`/${params.lang}/works/${params.feed}`} style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }} className="uppercase bg-white border border-black group-hover:underline rounded-md pr-4 pl-2 py-1.5 inline-flex items-center lg:w-fit mx-auto mr-2">
            <p className="flex items-center">
              <ChevronLeftIcon className="h-4 w-4 mr-2"   />
              {loaderData.feedTitle}
            </p>
          </Link>
          <ChevronRightIcon className="hidden md:block w-4 h-4 mx-4" />
          <p className="hidden md:block  uppercase">
          {loaderData.title}
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
      <div className="flex-1 overflow-auto touch-pinch-zoom touch-manipulation touch-pan-x touch-pan-y">
        <div className={(isZoom ? "cursor-zoom-out " : "cursor-zoom-in ") + "h-full w-full"} onClick={() => setZoom(!isZoom)}>
          <div className={(isZoom ? "w-full h-auto origin-top-left scale-150 " : "w-full h-full") + ""}>
            <Attachment size={isZoom ? "object-cover" : "object-contain"} align="object-top " attachment={{
              id: "",
              mediaType: "image/",
              url: loaderData.image,
              description: loaderData.title
            }}></Attachment>
          </div>
        </div>
      </div>
    </div>
  );
}