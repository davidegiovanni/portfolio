import { json, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
import queryString from 'query-string'

import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate, makeDivDraggable } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, ViewGridAddIcon, ViewGridIcon, XIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";
import { useEffect, useRef, useState } from "react";
import { feed } from "~/api";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import ZoomableImage from "~/components/zommable";

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
    <div className={`h-full w-full overflow-hidden`}>
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between flex-none m-2 text-lg lg:text-base">
        <div className="flex items-center">
          <Link to={`/${params.lang}/works/${params.feed}`} >
            <p className="sr-only">
              Close
            </p>
            ✕
          </Link>
          <p className="sr-only">
          {loaderData.title}
          </p>
        </div>
        <div className="flex items-center justify-end gap-8">
          <Link to={`/${params.lang}/works/${params.feed}/${previous}`} className={(previous === "" ? "pointer-events-none opacity-50 select-none " : "")}>
            <p className="sr-only">
              {'Indietro'}
            </p>
            ←
          </Link>
          <Link to={`/${params.lang}/works/${params.feed}/${next}`} className={(next === "" ? "pointer-events-none opacity-50 select-none " : "")}>
            <p className="sr-only">
              {'Avanti'}
            </p>
            →
          </Link>
        </div>
      </div>
      <div className='h-full w-full'>
          <ZoomableImage attachment={{
          mediaType: "image/",
          url: loaderData.image,
          description: loaderData.title,
          metadata: {}
        }}></ZoomableImage>
        </div>
    </div>
  );
}