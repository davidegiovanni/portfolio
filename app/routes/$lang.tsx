import { json, LinksFunction, LoaderFunction, MetaFunction, redirect, SerializeFrom } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { useEffect, useState } from "react";
import { page, website } from "~/api";
import { Page, Website } from "~/models";
import { DynamicLinksFunction } from "remix-utils";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return location.pathname.endsWith(`/${params.lang}`) ? [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}` }] : [];
};
export let handle = { dynamicLinks };

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { meta } = data as LoaderData;
    title = (meta.title !== '' ? meta.title : "Homepage") + ' | Davide G. Steccanella'
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
  title: string;
  description: string;
  image: string;
  meta: {
    title: string;
    description: string;
    image: string;
  };
  logoUrl: string;
  mainColor: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""
  const [webRes, webErr] = await website(request, params, incomingLocale);
  if (webErr !== null) {
    if (webErr.code === 5) {
      const [fullWebRes, fullWebErr] = await website(request, params, "");
      if (fullWebErr !== null) {
        throw new Response("Website: " + fullWebErr.message, {
          status: 404,
        });
      }
      return redirect(`/${fullWebRes.website.languageCode}`);
    }
    throw new Response("Website: " + webErr.message, {
      status: 404,
    });
  }
  const websiteObject: Website = webRes.website
  
  const logoUrl = websiteObject.theme.logoUrl
  const mainColor = websiteObject.theme.accentColor

  let meta = {
    title: "",
    description: "",
    image: ""
  }

  const [pageRes, pageErr] = await page("index", params)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const pageObject: Page = pageRes.page

  let title = pageObject.blocks[0].items[0].title
  let description = pageObject.blocks[0].items[0].description
  let image = pageObject.blocks[0].items[0].attachment?.url || ""

  meta.title = pageObject.title
  meta.description = pageObject.description
  meta.image = pageObject.imageUrl

  const loaderData: LoaderData = {
    title, 
    description,
    image,
    meta,
    mainColor,
    logoUrl
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  const outletHeight: string = 'border-t border-black h-full '


  return (
    <div className="h-full w-full relative">
      <div>
        {
          loaderData.logoUrl !== "" && 
          <Link to={`/${params.lang}`}>
            <div className="h-16 lg:h-32 w-56 lg:w-80 inline-block m-4 absolute top-0 left-0 z-20">
              <div className="h-full w-auto">
                <Attachment attachment={{
                  id: "",
                  mediaType: "image/",
                  url: loaderData.logoUrl ,
                  description: "Davide Giovanni Steccanella"
                }}></Attachment>
              </div>
            </div>
          </Link>
        }
        <div className="absolute inset-0 w-full h-full flex flex-col overflow-hidden">
          <div className="absolute inset-0 w-full h-full fade-in">
            <Attachment size="object-fill" attachment={{
              id: "",
              mediaType: "image/",
              url: loaderData.image ,
              description: "Davide Giovanni Steccanella"
            }}></Attachment>
          </div>
          <div className="w-full h-0 flex-1">
          </div>
          <>
            <div className={((location.pathname.includes('works') || location.pathname.includes('about') || location.pathname.includes('contacts') || location.pathname.includes('random')) ? outletHeight : "h-0 " ) + "relative z-30 w-full bg-white transition-all ease-in-out duration-500 max-h-full"}>
              <Outlet />
            </div>
          </>
        </div>
      </div>
    </div>
  );
}