import { useEffect, useState } from "react";
import {
  createCookie,
  ErrorBoundaryComponent,
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
  useLocation,
  useMatches,
  useParams,
} from "@remix-run/react";

import tailwind from "./styles/tailwind.css"
import { loadTranslations, fallbackLocale, getMatchingLocale } from "./helpers/i18n";
import { fluidType } from "./utils/helpers";
import { safeGet } from "./utils/safe-post";
import { WebLinkModel } from "api/models";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwind }
  ];
};

export const meta: MetaFunction = ({data}) => {
  let theme = '#ffffff'
  if (data !== undefined) {
    theme = data.primary
  }
  return {
    'twitter:card': 'summary_large_image'
  };
};

const i18nKeys = [] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<any, any>;
  primary: string;
  favicon: string;
  incomingLocale: string;
  navbarLinks: WebLinkModel[];
  locales: string[];
  font: string;
  fontFamily: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""
  let url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  if (incomingLocale === "") {
    const [defaultWebsiteRes, defaultWebsiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
    if (defaultWebsiteErr !== null) {
      throw new Error(`defaultWebsiteErr: ${defaultWebsiteErr.message} ${defaultWebsiteErr.code}`);
    }
    const defaultLocale = defaultWebsiteRes.website.languageCode
    return redirect(`/${defaultLocale}`)
  }

  const [initialWebsiteRes, initialWebsiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${incomingLocale}`)
    if (initialWebsiteErr !== null) {
      const [defaultWebsiteRes, defaultWebsiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
      if (defaultWebsiteErr !== null) {
        throw new Error(`initialWebsiteErr website: ${defaultWebsiteErr.message} ${defaultWebsiteErr.code}`);
      }
      const defaultLocale = defaultWebsiteRes.website.languageCode
      return redirect(`/${defaultLocale}`)
    }
  
    const primary: string = initialWebsiteRes.website.theme.primaryColor
    const favicon: string = initialWebsiteRes.website.theme.faviconUrl
  
    const i18n = loadTranslations<I18nKeys>(incomingLocale, i18nKeys);

    const navbarLinks: WebLinkModel[] = initialWebsiteRes.website.headerNav.links
    const locales: string[] = initialWebsiteRes.languageCodes.filter((l: string) => l !== params.lang)
    const font = initialWebsiteRes.website.theme.fontFamilyUrl
    const fontFamily = initialWebsiteRes.website.theme.fontFamily

    const loaderData: LoaderData = {
      i18n,
      primary,
      favicon,
      font,
      incomingLocale,
      navbarLinks,
      locales,
      fontFamily
    }

  return json(loaderData)
};

export default function App() {
  const matches = useMatches();
  const match = matches.find((match) => match.data && match.data.canonical);
  const alternates = match?.data.alternates;
  const loaderData = useLoaderData<LoaderData>()
  const canonical = match?.data.canonical;
  const params = useParams()

  const favicon = loaderData.favicon || ""

  const [currentTime, setCurrentTime] = useState('-------')

  const getTimeDate = () => {
    var date = new Date();
    var current_date = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+ date.getDate();
    var current_time = `${date.getHours() < 10 ? '0': ''}${date.getHours()}`+":"+`${date.getMinutes() < 10 ? '0': ''}${date.getMinutes()}`+":"+ `${date.getSeconds()}${date.getSeconds() < 10 ? '0': ''}`;
    var date_time = current_date+" - "+current_time;
    setCurrentTime(date_time)
  }

  useEffect(
    () => {setTimeout(getTimeDate, 1000)}
  )

  function getPageSlug(url: string) {
    return url.replace('https://illos.davidegiovanni.com/', '')
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

  const style = {
    "--customfont": loaderData.fontFamily,
    fontFamily: loaderData.fontFamily,
    backgroundColor: loaderData.primary
  }

  return (
    <html lang={loaderData.incomingLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        {!!canonical && <link rel="canonical" href={canonical} />}
        {!!favicon && <link rel="icon" type="image/x-icon" href={favicon}></link>}
        <Links />
      </head>
      <body>
        <div style={style} className="fixed inset-0 overflow-hidden selection:bg-[blue] selection:text-[white] w-full h-full flex flex-col font-default">
          <div className="w-full flex-1 h-1 overflow-hidden">
            <Outlet />
          </div>
          <hr className="border-t border-black w-full" />
          {
            loaderData.navbarLinks.length > 0 &&
            <>
              <div className="w-full flex items-center justify-between bg-white px-4 py-2" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
                {loaderData.navbarLinks.length > 0 && loaderData.navbarLinks.map((f, index) => (
                  <Link to={`/${params.lang}/${getPageSlug(f.url)}`} className="hover:underline uppercase" key={index}>
                    {f.title}
                  </Link>
                ))}
              </div>
              <hr className="border-t border-black w-full" />   
            </>
          }
          <div style={{ fontSize: fluidType(12, 16, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }} className="flex items-center flex-wrap justify-start px-4 py-2 uppercase">
            {currentTime} | Copyright © <a href="https://davidegiovanni.com" target={'_blank'} rel="noopener">Davide Giovanni Steccanella | WEBSITE BUILT BY ME | </a> { loaderData.locales.length > 0 ? loaderData.locales.map(l => (<span><Link to={`/${l}`} reloadDocument className="ml-2 underline text-[blue] hover:text-[darkblue] visited:text-[purple]">
              { getLanguageName(l)}
              </Link></span> )) : null}
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href={loaderData.font} rel="stylesheet"></link>
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

export function CatchBoundary({ error }: { error: Error }) {
  const catchError = useCatch()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>(Ｔ▽Ｔ)</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="fixed inset-0 overflow-hidden bg-[#0827F5] text-white p-2 selection:bg-white selection:text-white">
          <div className="w-full h-full overflow-hidden safari-only">
            <h1 style={{ fontSize: fluidType(32, 120, 300, 2400, 1.5).fontSize, lineHeight: fluidType(24, 100, 300, 2400, 1.5).lineHeight }}>
              Error ಥ_ಥ
            </h1>
            <p className="text-white my-4">
              {catchError ? catchError.statusText : error.message} ((({catchError ? catchError.status : error.stack})))
            </p>
            <img src="https://c.tenor.com/1zi9Ppr4YDsAAAAj/travolta-lost.gif" alt="" />
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>(Ｔ▽Ｔ)</title>
        <Meta />
        <Links />
      </head>
      <body>
      <div className="fixed inset-0 overflow-hidden bg-[#0827F5] text-white p-2 selection:bg-yellow-500 selection:text-white">
          <div className="w-full h-full overflow-hidden safari-only">
            <h1 style={{ fontSize: fluidType(32, 120, 300, 2400, 1.5).fontSize, lineHeight: fluidType(24, 100, 300, 2400, 1.5).lineHeight }}>
              Error ಥ_ಥ
            </h1>
            <p className="text-white mt-4">
              {error.message} {error.stack}
            </p>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}