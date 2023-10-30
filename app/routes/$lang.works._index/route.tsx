import { json, LoaderFunction, redirect, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useLocation, useParams, V2_MetaFunction } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { Attachment } from "~/components/Attachment";
import { useEffect, useRef, useState } from "react";
import { Block, BlockItem, BlockUI, Feed, Page, UIItem, UISection, WebPageModel, WebSectionModel, Website } from "~/models";
import { useScatterDivsRandomly } from "~/utils/helpers";
import { motion } from "framer-motion";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { StructuredData } from "~/utils/schema-data";
import { fromFeedItemToUIItem, fromPageSectionToUISection, safeGetFeed, safeGetPage, safeGetWebsite, website } from "~/api";

import itTranslations from "../../i18n/it-IT.json"
import enTranslations from "../../i18n/en-US.json"

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}: any) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}/works` }];
};
export let handle = { dynamicLinks };

export const meta: V2_MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { meta } = data as LoaderData;
    title = (meta.title !== '' ? meta.title : "Homepage") + ''
    description = meta.description !== '' ? meta.description : "Illustrazioni di Davide Giovanni Steccanella"
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

const i18nKeys = [] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  translations: Record<I18nKeys, any>;

  title: string;
  description: string;
  image: string;

  incomingLocale: string;
  meta: {
    title: string;
    description: string;
    image: string;
  };

  portfolioItems: UIItem[];
  
  items: UISection[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""
  let translations = incomingLocale === "it-IT" ? itTranslations : enTranslations


  let websiteObject: Website = {} as Website
  const websiteRes = await safeGetWebsite(request, params, incomingLocale);
  if (typeof websiteRes === "string") {
    if (websiteRes === "error") {
      throw new Response("Website not found", {
        status: 404,
      });
    }
    return redirect(websiteRes)
  }
  websiteObject = websiteRes.website

  let meta = {
    title: websiteObject.title,
    description: websiteObject.title,
    image: websiteObject.theme?.logoUrl || ""
  }

  let pageObject: Page = {} as Page
  const pageRes = await safeGetPage("works", params)
  if (typeof pageRes === "string") {
    throw new Response("Page not found", {
      status: 404,
    });
  }
  pageObject = pageRes

  let feedObject: Feed = {} as Feed
  const feedRes = await safeGetFeed("illos-works", params)
  if (typeof feedRes === "string") {
    throw new Response("Page not found", {
      status: 404,
    });
  }
  feedObject = feedRes

  let title = pageObject.title
  let description = pageObject.description
  let image = pageObject.imageUrl

  meta.title = pageObject.title
  meta.description = pageObject.description
  meta.image = pageObject.imageUrl

  let portfolioItems: UIItem[] = feedRes.items.map(item => {
    return fromFeedItemToUIItem(item, incomingLocale)
  })

  let sectionItems: BlockItem[] = []

  pageRes.blocks.forEach(block => sectionItems.push(...block.items))

  if (sectionItems.length > 0) {
    title = sectionItems[0].title
    description = sectionItems[0].title
    image = sectionItems[0].attachment?.url || image
  }

  let items: UISection[] = sectionItems.slice(1).map(item => {
    return fromPageSectionToUISection(item)
  })

  const loaderData: LoaderData = {
    translations,
    title,
    description,
    image,
    incomingLocale,
    meta,
    portfolioItems,
    items
  }

  return json(loaderData)
};

export default function Works() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  const constraintRef = useRef<HTMLDivElement>(null)

  const [randomKey, setRandomKey] = useState<number>(0)

  const portofolioSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": loaderData.title,
    "description": loaderData.description,
    "url": `https://illos.davidegiovanni.com${location.pathname}`,
    "itemListElement": [
      ...loaderData.portfolioItems.map(item => {
        return {
          "@type": "Portfolio",
          "name": item.title,
          "image": item.image,
          "url": `https://illos.davidegiovanni.com/${loaderData.incomingLocale}/works/${item.slug}`
        }
      })
    ]
  }

  useEffect(() => {
    useScatterDivsRandomly({parentRef: constraintRef})
    setTimeout(() => {
      setRandomKey(1)
    }, 100)
  }, [location.pathname])
  

  return (
    <div className="h-full w-full overflow-hidden">
      <div id="works" key={"works"} ref={constraintRef} className="h-full w-full overflow-hidden">
        <StructuredData schema={portofolioSchema} />
        <h1 className="sr-only">
          {loaderData.title}
        </h1>
        {loaderData.portfolioItems.map((f, index) => (
          <Link key={randomKey + index} to={`/${loaderData.incomingLocale}/works/${f.slug}`}>
              <motion.div
                id={`image-card-${index}`}
                key={randomKey + index} 
                drag={true}
                dragConstraints={constraintRef}
                whileDrag={{ pointerEvents: "none"}}
                whileHover={{
                  zIndex: 90,
                  transition: {
                    duration: 0.3,
                    delay: 0.1,
                    ease: "easeInOut",
                    mass: 20,
                  }
                }}
                whileTap={{
                  zIndex: 90,
                  transition: {
                    duration: 0.3,
                    delay: 0.1,
                    ease: "easeInOut",
                    mass: 20,
                  }
                }}
                className={"w-48 lg:w-full aspect-square max-w-md will-change-transform"}>
                <Attachment size="object-cover" attachment={{
                  mediaType: "image/",
                  url: f.image.url,
                  description: f.image.description,
                  metadata: {}
                }}></Attachment>
                <h2 className="sr-only">
                  {f.title}
                </h2>
              </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}