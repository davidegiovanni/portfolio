import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { useEffect, useState } from "react";

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://illos.davidegiovanni.com/it-it',
      alternate: 'https://illos.davidegiovanni.com/en-en'
    }
  )
};

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { page } = data as LoaderData;
    title = (page.title !== '' ? page.title : "Homepage") + ' | Davide G. Steccanella'
    description = page.description !== '' ? page.description : "Illustrazioni di Davide Giovanni Steccanella"
    image = page.image !== '' ? page.image : ''
    url = 'https://illos.davidegiovanni.com' + location.pathname
  }

  return metadata(
    {
      title: title,
      description: description,
      image: image,
      url: url,
      robots: 'follow',
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
  logo: string;
  primary: string;
  secondary: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  let lang = params.lang

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Response(`Error loading website: ${websiteErr.message} ${websiteErr.code}`, {
      status: 404,
    });
  }
  const logo = websiteRes.website.theme.logoUrl
  const primary = websiteRes.website.theme.primaryColor
  const secondary = websiteRes.website.theme.invertedPrimaryColor

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/index?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const page: WebPageModel = pageRes.page

  const mainSection: WebSectionModel = page.sections[0]

  const loaderData: LoaderData = {
    i18n,
    page: page,
    mainSection,
    primary,
    secondary,
    logo
  }

  return json(loaderData)
};

export default function Index() {
  const { mainSection, logo, primary, secondary } = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  function buildSrcset(url: any, format: string): any {
    const u = url.replace('cdn.revas.app', 'static.eu1.revas-cdn.com')
    const sizes = [600, 800, 1024, 1280, 1536];
    const densities = [1, 2,3];
    const urls = densities.map(
      (density) => `url("${u}?format=${format}&size=${density === 1 ? '1024' : density === 2 ? '1280' : '1536'}w") ${density}x`
    );
    return urls.join(",");
  }

  function getLanguageName (lang: string) {
    switch (lang) {
      case 'it-IT':
        return 'Italiano'
      case 'en-US':
        return 'English'
      case 'fr-FR':
        return 'Français'
      case 'es-ES':
        return 'Espanol'
      case 'de-DE':
        return 'Deutsch'
      default:
        break;
    }
  }

  const outletHeight: string = location.pathname.includes('works') 
    ? 'border-t border-black h-full '
    : location.pathname.includes('about')
      ? 'border-t border-black h-[50vh] md:h-[60vh] '
      : 'border-t border-black h-[30vh] '


  return (
    <div className="h-full w-full relative">
      <div>
        <Link to={`/${params.lang}`}>
          <div className="h-16 lg:h-32 w-56 lg:w-80 inline-block m-4 absolute top-0 left-0 z-20">
            <div className="h-full w-auto">
              <Attachment attachment={{
                id: "",
                mediaType: "image/",
                url: logo,
                description: "Davide Giovanni Steccanella"
              }}></Attachment>
            </div>
          </div>
        </Link>
        <div className="absolute inset-0 w-full h-full z-10 flex flex-col overflow-hidden">
          <div style={{ backgroundImage: `-webkit-image-set(${buildSrcset(mainSection.image, 'webp')})`, backgroundSize: '100% 100%'}} className="w-full h-8 flex-1">
          </div>
          <>
            <div className={((location.pathname.includes('works') || location.pathname.includes('about') || location.pathname.includes('contacts')) ? outletHeight : "h-0 ") + "relative z-30 w-full bg-white transition-all ease-in-out duration-500 max-h-[60vh] md:max-h-[70vh] "}>
              <Outlet />
            </div>
          </>
        </div>
      </div>
    </div>
  );
}