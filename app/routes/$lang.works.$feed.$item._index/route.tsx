import { json, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useNavigate, useParams, V2_MetaFunction } from "@remix-run/react";
import queryString from 'query-string'

import metadata from '~/utils/metadata'
import { useRef, useState } from "react";
import { feed } from "~/api";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import ZoomableImage from "~/components/zommable";
import { Feed } from "~/models";
import { motion, AnimatePresence } from "framer-motion";

import itTranslations from "../../i18n/it-IT.json"
import enTranslations from "../../i18n/en-US.json"
import { newTranslate } from "~/utils/translate";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${location.pathname}` }];
};
export let handle = { dynamicLinks };

export const meta: V2_MetaFunction = ({ data, location }) => {
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
  translations: Record<any, any>;
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
  let translations = incomingLocale === "it-IT" ? itTranslations : enTranslations
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
    translations,
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
  const navigate = useNavigate()
  const [isImageVisible, toggleImageVisibility] = useState(true)

  function handleClick (direction: "previous" | "next") {
    toggleImageVisibility(false)

    setTimeout(() => {
      navigate(direction === "previous"
      ? `/${params.lang}/works/${params.feed}/${previous}`
      : `/${params.lang}/works/${params.feed}/${next}`)
    }, 300)
  }

  const constraintRef = useRef<HTMLDivElement>(null)
  const previous = loaderData.previous
  const next = loaderData.next
  const translate = newTranslate({ messages: loaderData.translations })

  return (
    <div id="details" key={"details"} ref={constraintRef} className={`fixed z-[120] inset-0 bg-black p-8 lg:p-24 overflow-hidden uppercase`}>
      <motion.div
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between flex-none m-2 text-sm text-white">
        <Link to={`/${params.lang}/works/${params.feed}`}>
          {translate({ key: "close_page" })}
        </Link>
        <p className="sr-only">
        {loaderData.title}
        </p>
        <Link to={`/${params.lang}/works/${params.feed}`} className="opacity-60">
          {translate({ key: "double_tap_to_zoom" })}
        </Link>
      </motion.div>
      <motion.div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between flex-none m-2 text-sm text-white">
          <button onClick={() => handleClick("previous")} className={(previous === "" ? "pointer-events-none opacity-50 select-none " : "")}>
            {translate({ key: "go_to_previous_image" })}
          </button>
          <button onClick={() => handleClick("next")} className={(next === "" ? "pointer-events-none opacity-50 select-none " : "")}>
            {translate({ key: "go_to_next_image" })}
          </button>
      </motion.div>
      <motion.div className='h-full w-full'>
        <AnimatePresence>
          {
            isImageVisible && (
              <motion.div
                key={loaderData.image}
                animate={{ translateY: 0, scale: 1, skewX: 0, opacity: 1 }}
                initial={{ translateY: "10%", scale: 0.9, skewX: 2, opacity: 0 }}
                exit={{ translateY: "10%", scale: 0.9, skewX: -2, opacity: 0 }}
                transition={{ ease: [.64,.13,.58,1], duration: 0.3, delay: 0.2 }} 
                className='h-full w-full origin-bottom'>
                  <ZoomableImage attachment={{
                  mediaType: "image/",
                  url: loaderData.image,
                  description: loaderData.title,
                  metadata: {}
                }} dragConstraints={constraintRef}></ZoomableImage>
                </motion.div>
            )
          }
        </AnimatePresence>
      </motion.div>
    </div>
  );
}