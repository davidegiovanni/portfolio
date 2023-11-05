import { json, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useLocation, useParams, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { page } from "~/api";
import { Page } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { isExternalLink } from "~/utils/helpers";
import { StructuredData } from "~/utils/schema-data";
import { motion } from "framer-motion";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}/contacts` }];
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

const i18nKeys = [] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  title: string;
  description: string;
  image: string;
  link: {
    title: string;
    url: string;
    isExternal: boolean;
  };
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

  const [pageRes, pageErr] = await page("contacts", params)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const pageObject: Page = pageRes.page

  let title = pageObject.blocks[0].items[0].title
  let description = pageObject.blocks[0].items[0].description
  let image = pageObject.blocks[0].items[0].attachment?.url || ""
  let link = {
    title: pageObject.blocks[0].items[0].link?.title as string,
    url: pageObject.blocks[0].items[0].link?.url as string,
    isExternal: isExternalLink(pageObject.blocks[0].items[0].link?.url as string)
  }
  meta.title = pageObject.title
  meta.description = pageObject.description
  meta.image = pageObject.imageUrl

  const loaderData: LoaderData = {
    title,
    description,
    image,
    link,
    meta
  }

  return json(loaderData)
};

export default function Contacts() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

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
    <div id="contacts" key={"contacts"} className={"p-4 h-full w-full flex flex-col gap-4 lg:gap-8 text-center items-center justify-center uppercase scrollbar-hidden"}>
      <StructuredData schema={webPageSchema} />
      <motion.div animate={{ translateY: "-100%", scaleY: 0.2, skewY: 20 }} initial={{ translateY: 0 }} transition={{ ease: "easeOut", duration: 0.8 }} className="h-full absolute inset-x-0 top-0 bg-white z-30 origin-top"></motion.div>
      <div className="w-full h-fit overflow-hidden">
        <motion.h1 animate={{ translateY: 0, opacity: 1 }} initial={{ translateY: "100%", opacity: 0 }} transition={{ ease: [.64,.13,.58,1], duration: 0.5, delay: 0.2 }} className="font-medium text-2xl lg:text-6xl max-w-screen-lg mx-auto text-center uppercase">
          {loaderData.title}
        </motion.h1>
      </div>
      {
        loaderData.description !== "" &&
        <div className="w-full h-fit overflow-hidden">
          <motion.h2  animate={{ translateY: 0, opacity: 1 }} initial={{ translateY: "100%", opacity: 0 }} transition={{ ease: [.64,.13,.58,1], duration: 0.6, delay: 0.4 }} className="max-w-prose mx-auto text-center text-sm lg:text-base">
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
  );
}