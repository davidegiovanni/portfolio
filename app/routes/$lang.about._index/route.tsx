import { json, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useLocation, useParams, V2_MetaFunction } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon, ChevronLeftIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";
import { feed } from "~/api";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { Feed, FeedItem } from "~/models";
import { StructuredData } from "~/utils/schema-data";
import { motion } from "framer-motion";

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
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}/about` }];
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
  html: string;
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

  const [feedRes, feedErr] = await feed("about", params)
  if (feedErr !== null) {
    throw new Response(`Feed do not exist: ${feedErr.message} ${feedErr.code}`, {
      status: 404,
    });
  }

  const feedObject: Feed = feedRes
  const slug = 'about'
  let foundNews = feedObject.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundNews === undefined) {
    throw new Response(`Page do not exist`, {
      status: 404,
    });
  }
  const item: FeedItem = foundNews

  let title = item.title
  let description = item.summary
  let image = item.image
  let date = formatDate(item.date_published, params.lang as string, 'short')
  let html = item.content_html

  meta.title = title
  meta.description = description
  meta.image = image

  const loaderData: LoaderData = {
    title,
    description,
    image,
    html,
    meta,
    translations
  }

  return json(loaderData);
};

export default function About() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()
  const translate = newTranslate({ messages: loaderData.translations })

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": loaderData.title,
    "description": loaderData.description,
    "url": `https://illos.davidegiovanni.com/${location.pathname}`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": `https://illos.davidegiovanni.com/${params.locale}`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": loaderData.title,
          "item": `https://illos.davidegiovanni.com/${location.pathname}`
        }
      ]
    },
    "image": {
      "@type": "ImageObject",
      "url": loaderData.image,
      "width": 800,
      "height": 600
    }
  }

    return (
      <div id="about" key={"about"} className="h-full w-full overflow-y-scroll lg:scrollbar-hidden">
        <StructuredData schema={webPageSchema}/>
        <motion.div animate={{ translateY: "-100%", scaleY: 0.2, skewY: 20 }} initial={{ translateY: 0 }} transition={{ ease: "easeOut", duration: 0.8 }} className="h-full absolute inset-x-0 top-0 bg-white z-30 origin-top"></motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full lg:h-full">
          <div className="w-full max-h-screen aspect-square lg:aspect-auto lg:sticky top-0 overflow-hidden p-4 flex items-center justify-center">
            <div className="relative aspect-square w-10/12 overflow-hidden flex items-center justify-center">
              <motion.div animate={{ skewY: 0, translateY: 0 }} initial={{  skewY: 8, translateY: 200 }} transition={{ ease: "easeOut", duration: 0.5 }} className="relative w-2/3 overflow-hidden">
                <motion.div animate={{ scale: 1.2 }} initial={{ scale: 1 }} transition={{ ease: "easeOut", duration: 10 }} className="w-full h-full">
                  <Attachment size="object-contain" attachment={{
                      mediaType: "image/",
                      url: loaderData.image,
                      description: "Davide Giovanni Steccanella",
                      metadata: {}
                    }}></Attachment>
                </motion.div>
              </motion.div>
            </div>
          </div>
          <div className="w-full lg:overflow-y-auto pb-4 flex flex-col items-stretch justify-start border-black border-t lg:border-t-0 lg:border-l">
            <div className="p-4 lg:py-12 text-2xl lg:text-5xl uppercase">
              <div className="w-full h-fit overflow-hidden">
                <motion.h1 animate={{ translateY: 0, opacity: 1, skewY: 0 }} initial={{ translateY: 40, opacity: 0, skewY: 2 }} transition={{ ease: "easeOut", duration: 0.4, delay: 0.5 }} className="max-w-xl mx-auto flex flex-col origin-top-left" >
                    <span className="uppercase text-xs">{translate({ key: "my_name_is" })}</span>
                    {loaderData.title}
                  </motion.h1>
              </div>
            </div>
            <motion.div animate={{ width: "100%" }} transition={{ ease: "easeOut", duration: 0.4, delay: 0.3 }} className="h-px border-t border-black w-0"></motion.div>
            <div className="p-4 lg:py-12 uppercase">
              <div className="w-full h-fit overflow-hidden">
                <motion.h2 animate={{ translateY: 0, opacity: 1, skewY: 0 }} initial={{ translateY: 60, opacity: 0, skewY: 2 }} transition={{ ease: "easeOut", duration: 0.4, delay: 0.6 }} className="max-w-xl mx-auto font-medium flex flex-col gap-2 origin-top-left">
                    <span className="uppercase text-xs font-normal">{translate({ key: "about_me" })}</span>
                    {loaderData.description}
                  </motion.h2>
              </div>
            </div>
            <motion.div animate={{ width: "100%" }} transition={{ ease: "easeOut", duration: 0.4, delay: 0.3 }} className="h-px border-t border-black w-0"></motion.div>
            { loaderData.html !== "" && loaderData.html !== undefined &&
                <motion.article animate={{ translateY: 0, opacity: 1, skewY: 0 }} initial={{ translateY: 20, opacity: 0, skewY: 2 }} transition={{ ease: "easeOut", duration: 0.4, delay: 0.7 }} className="p-4 pb-16 lg:pt-16 break-after-column block prose-sm prose-a:underline prose-a:underline-offset-2 max-w-xl mx-auto origin-top-left">
                {parse(loaderData.html)}
              </motion.article>
              }
          </div>
        </div>
      </div>  
    )
}