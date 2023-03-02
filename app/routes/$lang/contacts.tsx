import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
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
    <div className={"p-4 h-full w-full"}>
      <div className="max-w-screen-sm fade-slide-in">
        <Link to={`/${params.lang}`}>
          <p style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }} className="uppercase bg-white border border-black group-hover:underline rounded-md mb-4 pr-4 pl-2 py-2 inline-flex items-center lg:w-fit mx-auto">
            <span>
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
            </span>
            Homepage
          </p>
        </Link>
        <h1 style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }} className="w-full uppercase font-bold">
          {loaderData.title}
        </h1>
        <h2 className="my-4" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }}>
          {loaderData.description}
        </h2>
        <div className="inline-block uppercase underline text-[blue] hover:text-[darkblue] visited:text-[purple]" style={{ fontSize: fluidType(16, 16, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
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
    </div>
  );
}