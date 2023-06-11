import { json, LinksFunction, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType, isExternalLink } from '~/utils/helpers'
import { useRouteLoaderData } from "@remix-run/react";
import { Attachment } from "~/components/Attachment";
import { ChevronLeftIcon } from "@heroicons/react/outline";
import { page } from "~/api";
import { Page } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";

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

  return (
    <div className={"p-4 h-full w-full flex flex-col gap-2 text-center items-center justify-center uppercase scrollbar-hidden"}>
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