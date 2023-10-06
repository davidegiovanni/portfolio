import { json, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useLocation, useParams, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { page } from "~/api";
import { Page } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { isExternalLink } from "~/utils/helpers";
import { StructuredData } from "~/utils/schema-data";

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
    <div className={"p-4 h-full w-full flex flex-col gap-2 text-center items-center justify-center uppercase scrollbar-hidden"}>
      <StructuredData schema={webPageSchema} />
      <h1 className="w-full max-w-screen-sm font-semibold">
        {loaderData.title}
      </h1>
      <h2 className="max-w-screen-sm ">
        {loaderData.description}
      </h2>
      <div className="inline-block text-[blue]">
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
      </div>
    </div>
  );
}