import { json, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { NavLink, useLoaderData, useLocation, useParams, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { getSlug, isExternalLink, scatterDivsRandomly } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { feed, page } from "~/api";
import { Page, Feed } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { useEffect, useRef } from "react";
import { motion, animate } from "framer-motion"
import { StructuredData } from "~/utils/schema-data";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}/random` }];
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

type UILink = {
  title: string;
  url: string;
  isExternal: boolean;
}

type LoaderData = {
  title: string,
  description: string,
  image: string,
  sections: {
    title: string,
    description: string,
    image: string;
    link: UILink;
    slug: string;
  }[];
  works: {
    image: string;
    slug: string;
  }[];
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

  let sections: {
    title: string,
    description: string,
    image: string;
    link: UILink;
    slug: string;
  }[] = []

  let works: {
    image: string;
    slug: string;
  }[] = []

  const [pageRes, pageErr] = await page("random", params)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const pageObject: Page = pageRes.page

  let title = pageObject.blocks.length > 0 ? pageObject.blocks[0].items[0].title : ""
  let description = pageObject.blocks.length > 0 ?  pageObject.blocks[0].items[0].description : ""
  let image = pageObject.blocks.length > 0 
    ? pageObject.blocks[0].items[0].attachment 
      ? pageObject.blocks[0].items[0].attachment?.url
      : "" 
    : ""

  sections = pageObject.blocks.length > 1 
    ? pageObject.blocks.slice(1).map(b =>{
      return {
        title: b.items[0].title,
        description: b.items[0].description,
        image: b.items[0].attachment
          ? b.items[0].attachment?.url 
          : "",
        link: {
          title: b.items[0].link?.title as string,
          url: b.items[0].link?.url as string,
          isExternal: isExternalLink(b.items[0].link?.url as string)
        },
        slug: b.items[0].description
      }
    })
    : []

  meta.title = pageObject.title
  meta.description = pageObject.description
  meta.image = pageObject.imageUrl

  const feedName = "random";

  const [feedRes, feedErr] = await feed(feedName, params)
  if (feedErr !== null) {
    throw new Response(`Feed do not exist: ${feedErr.message} ${feedErr.code}`, {
      status: 404,
    });
  }

  const feedObject: Feed = feedRes

  works = feedObject.items.map((i, index) => {
    return {
      image: i.image || "",
      slug: `/${params.lang}/works/random/${getSlug(i.id)}`
    }
  })

  const loaderData: LoaderData = {
    title,
    description,
    image,
    sections,
    works,
    meta
  }
  return json(loaderData);
};

export default function FeedPage() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  const constraintRef = useRef<HTMLDivElement>(null)

  // const draggableDivRefs = useRef(Array(loaderData.works.length).fill(null));

  useEffect(() => {
    scatterDivsRandomly("scattered")
    loaderData.works.forEach((work, index) => {
      const imageCard = document.getElementById(`image-card-${index}`)
      if (imageCard) {
        animate(imageCard, { opacity: 100 }, { duration: 0.5, delay: 1, ease: "circOut"})
      }
    })
  }, [])

  const portofolioSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": loaderData.title,
    "description": loaderData.description,
    "url": `https://illos.davidegiovanni.com/${location.pathname}`,
    "itemListElement": [
      ...loaderData.works.map(item => {
        return {
          "@type": "Portfolio",
          "name": item.slug,
          "image": item.image,
          "url": `https://illos.davidegiovanni.com/${params.locale}/random/${item.slug}`
        }
      })
    ]
  }

  return (
    <div id="scattered" ref={constraintRef} className="h-full w-full flex flex-col bg-white gap-4 overflow-hidden relative text-center py-1 scrollbar-hidden">
        <StructuredData schema={portofolioSchema} />
        <h1 className="sr-only">
          {loaderData.title}
        </h1>
        {
          loaderData.description !== "" &&
          <h2>
            {loaderData.description}
          </h2>
        }
        <div>
          {
            loaderData.works.map((i, index: any) => (
              <motion.div
                key={index}
                id={`image-card-${index}`}
                drag={true}
                dragConstraints={constraintRef}
                whileDrag={{ pointerEvents: "none"}}
                initial={{ filter: "drop-shadow(0 0 #0000)"}}
                whileHover={{
                  scale: 1.1,
                  filter: "drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))",
                  zIndex: 90,
                  transition: {
                    duration: 0.3,
                    delay: 0.1,
                    ease: "easeInOut",
                    mass: 20,
                  }
                }}
                whileTap={{
                  scale: 1.1,
                  filter: "drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))",
                  zIndex: 90,
                  transition: {
                    duration: 0.3,
                    delay: 0.1,
                    ease: "easeInOut",
                    mass: 20,
                  }
                }}
                className="w-32 absolute h-32 opacity-0 will-change-transform">
                <NavLink to={`${i.slug}`} className="w-32 h-32 overflow-hidden block" >
                    <Attachment size="object-contain" attachment={{
                      mediaType: "image/",
                      url: i.image,
                      description: i.slug,
                      metadata: {}
                    }}></Attachment>
                </NavLink>
              </motion.div>
            ))
          }
        </div>
    </div>
  );
}
