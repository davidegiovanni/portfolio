import { json, LoaderFunction, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useLocation, useParams, V2_MetaFunction } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { Attachment } from "~/components/Attachment";
import { useEffect, useRef, useState } from "react";
import { WebPageModel, WebSectionModel } from "~/models";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useScatterDivsRandomly } from "~/utils/helpers";
import { motion } from "framer-motion";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { StructuredData } from "~/utils/schema-data";

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
    const { page } = data as LoaderData;
    title = (page.title !== '' ? page.title : "Lavori") + ' | Davide G. Steccanella'
    description = page.description !== '' ? page.description : "Le illustrazioni di Davide Giovanni Steccanella"
    image = page.image !== '' ? page.image : ''
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
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  mainSection: WebSectionModel;
  feeds: WebSectionModel[];
  logo: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang
  let url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Response(`Error loading website: ${websiteErr.message} ${websiteErr.code}`, {
      status: 404,
    });
  }
  const logo = websiteRes.website.theme.logoUrl

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageRes.message} ${pageRes.code}`, {
      status: 404,
    });
  }

  const page: WebPageModel = pageRes.page

  const mainSection: WebSectionModel = page.sections[0]

  const feeds = page.sections.length > 1 ? page.sections.splice(1) : []

  const loaderData: LoaderData = {
    i18n,
    page: page,
    mainSection,
    feeds,
    logo
  }

  return json(loaderData)
};

export default function Works() {
  const { mainSection, feeds, page } = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  const constraintRef = useRef<HTMLDivElement>(null)

  const portofolioSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": page.title,
    "description": page.description,
    "url": `https://illos.davidegiovanni.com/${location.pathname}`,
    "itemListElement": [
      ...feeds.map(feed => {
        return {
          "@type": "Portfolio",
          "name": feed.title,
          "image": feed.image,
          "url": `https://illos.davidegiovanni.com/${params.locale}/works/${feed.description}`
        }
      })
    ]
  }

  useEffect(() => {
    useScatterDivsRandomly({parentRef: constraintRef})
  }, [location.pathname])
  

  return (
    <div ref={constraintRef} className="h-full w-full overflow-hidden scrollbar-hidden flex flex-col">
      <StructuredData schema={portofolioSchema} />
      <h1 className="sr-only">
        {mainSection.title}
      </h1>
      {feeds.map((f, index) => (
        <Link to={`/${params.lang}/works/${f.description}`}>
            <motion.div 
              drag={true}
              dragConstraints={constraintRef}
              whileDrag={{ pointerEvents: "none"}}
              whileHover={{
                zIndex: 90
              }}
              whileTap={{
                zIndex: 90
              }}
              className={"w-32 lg:w-full aspect-square max-w-md will-change-transform"}>
              <Attachment size="object-cover" attachment={{
                mediaType: "image/",
                url: f.image,
                description: f.title,
                metadata: {}
              }}></Attachment>
              <h2 className="sr-only">
                {f.title}
              </h2>
            </motion.div>
        </Link>
      ))}
    </div>
  );
}