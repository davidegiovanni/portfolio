import { json, LoaderFunction, MetaFunction, redirect, SerializeFrom } from "@remix-run/node";
import { Link, NavLink, useLoaderData, useLocation, useParams, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { getSlug, isExternalLink } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { feed, fromPageSectionToUISection, page, safeGetFeed, safeGetPage, safeGetWebsite } from "~/api";
import { Page, Feed, UISection, UILink, BlockItem, Website, FeedItem } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { motion, MotionValue, useAnimate, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { StructuredData } from "~/utils/schema-data";

import itTranslations from "../../i18n/it-IT.json"
import enTranslations from "../../i18n/en-US.json"
import { newTranslate } from "~/utils/translate";
import { extractImagesFromContent, getContentWithoutImages } from "./utils";

// create the dynamicLinks function with the correct type
// note: loader type is optional
let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${location.pathname}` }];
};

// and export it through the handle, you could also create it inline here
// if you don't care about the type
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
  incomingLocale: string;

  title: string,
  description: string,
  image: string,

  sections: UISection[];
  content: string;

  meta: {
    title: string;
    description: string;
    image: string;
  };
  link: UILink | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (params.work === "random") {
    return redirect(`/${params.lang}/random`)
  }

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

  let sections = []

  let pageObject: Page = {} as Page
  const pageRes = await safeGetPage(params.work as string, params)
  if (typeof pageRes === "string") {
    throw new Response("Page not found", {
      status: 404,
    });
  }
  pageObject = pageRes

  let title = pageObject.title
  let description = pageObject.description
  let image = pageObject.imageUrl
  let link: UILink | null = null

  meta.title = pageObject.title
  meta.description = pageObject.description
  meta.image = pageObject.imageUrl

  let sectionItems: BlockItem[] = []

  pageRes.blocks.forEach(block => sectionItems.push(...block.items))

  if (sectionItems.length > 0) {
    title = sectionItems[0].title
    description = sectionItems[0].description
    image = sectionItems[0].attachment?.url || image
    if (sectionItems[0].link) link = {
      ...sectionItems[0].link,
      isExternal: isExternalLink(sectionItems[0].link.url)
    }
  }

  sections = sectionItems.slice(1).map(item => {
    return fromPageSectionToUISection(item)
  })

  const feedName = params.feed || "";

  let feedObject: Feed = {} as Feed
  const feedRes = await safeGetFeed("illos-works" as string, params)
  if (typeof feedRes === "string") {
    throw new Response("Page not found", {
      status: 404,
    });
  }
  feedObject = feedRes

  let slug = params.work as string
  let foundItem: FeedItem | undefined = feedObject.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundItem === undefined) {
    throw new Response(`Post do not exist`, {
      status: 404,
    });
  }
  let content = foundItem.content_html

  const loaderData: LoaderData = {
    translations,
    incomingLocale,
    title,
    description,
    image,
    sections: [],
    content,
    meta,
    link
  }
  return json(loaderData);
};

export default function FeedPage() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  const translate = newTranslate({ messages: loaderData.translations })

  const containerRef = useRef(null);

  const [images, setImages] = useState<string[]>([])
  const [content, setContent] = useState<string>("")

  useEffect(() => {
    const imagesStrings = extractImagesFromContent(loaderData.content)
    setImages(imagesStrings)

    const formattedContent = getContentWithoutImages(loaderData.content)
    setContent(formattedContent)
  }, [loaderData.content])

  const portofolioSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": loaderData.title,
    "description": loaderData.description,
    "url": `https://illos.davidegiovanni.com/${location.pathname}`,
    "itemListElement": [
      ...images.map(img => {
        return {
          "@type": "Portfolio",
          "name": loaderData.title,
          "description": loaderData.title,
          "image": img,
          "url": img
        }
      })
    ]
  }

  return (
    <div ref={containerRef} id="workpage" key={"workpage"} className="h-full w-full overflow-y-auto">
      <StructuredData schema={portofolioSchema} />
      <motion.div animate={{ translateY: "-100%", scaleY: 0.2, skewY: 20 }} initial={{ translateY: 0 }} transition={{ ease: "easeOut", duration: 0.8 }} className="h-full absolute inset-x-0 top-0 bg-white z-30 origin-top"></motion.div>
      <Link to={`/${params.lang}/works`} className="fixed bg-white top-0 left-0 z-50 p-4 text-sm uppercase">
        {translate({ key: "go_back" })}
      </Link>
      <div>
        <div className="w-screen h-screen sticky top-0 flex flex-col gap-4 items-center justify-center px-4">
          <div className="w-full h-fit overflow-hidden">
            <motion.h1 animate={{ translateY: 0, opacity: 1 }} initial={{ translateY: "100%", opacity: 0 }} transition={{ ease: [.64,.13,.58,1], duration: 0.5, delay: 0.2 }} className="font-semibold text-2xl lg:text-6xl max-w-screen-md mx-auto text-center uppercase">
              {loaderData.title}
            </motion.h1>
          </div>
          {
            loaderData.description !== "" &&
            <div className="w-full h-fit overflow-hidden">
              <motion.h2  animate={{ translateY: 0, opacity: 1 }} initial={{ translateY: "100%", opacity: 0 }} transition={{ ease: [.64,.13,.58,1], duration: 0.6, delay: 0.4 }} className="max-w-prose mx-auto text-center">
                {loaderData.description}
              </motion.h2>
            </div>
          }
          {
            loaderData.link !== null && (
              <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ ease: "easeInOut", duration: 0.5, delay: 1 }} className="inline-block rounded-full bg-neutral-200 px-6 py-1 hover:bg-black hover:text-white">
                {
                  loaderData.link.isExternal ? (
                    <a href={loaderData.link.url} >
                      {loaderData.link.title}
                    </a>
                  ) : (
                    <Link to={loaderData.link.url} >
                      {loaderData.link.title}
                    </Link>
                  )
                }
              </motion.div>
            )
          }
        </div>
        {
          images.length > 0 && images.map((i, index: any) => (
            <ScrollingImage key={index} image={i} index={index} container={containerRef} />
          ))
        }
      </div>
      {
        content !== "" && (
          <article className="prose text-center max-w-prose mx-auto py-8 lg:py-16 pb-16 lg:pb-24 px-4 lg:px-0" dangerouslySetInnerHTML={{ __html: content }}></article>
        )
      }
    </div>
  );
}

function ScrollingImage(props: { image: string; index: number, container: React.MutableRefObject<null> }) {
  const index = props.index
  const target = useRef(null);
  const { scrollYProgress } = useScroll({
    container: props.container,
    target,
    offset: ["start center", "start start"],
    layoutEffect: false,
  });
  let rotate = useTransform(scrollYProgress, [0, 1], [0, (index % 3 === 0 ? 10 : index % 3 === 1 ? -10 : 4) + index])
  rotate = useSpring(rotate)
  return (
    <div ref={target} className="w-screen h-screen max-w-screen-md mx-auto sticky top-0 inset-x-0 flex items-center justify-center">
      <motion.div
        data-index={index % 3}
        style={{ zIndex: index + 1, rotate }}
        className={`w-full h-[70%] origin-center will-change-transform`}>
        <Attachment attachment={{
          mediaType: "image/",
          url: props.image,
          description: "",
          metadata: {}
        }}></Attachment>
      </motion.div>
    </div>
  )
}
