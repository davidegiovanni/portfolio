import { useEffect, useRef, useState } from "react";
import {
  createCookie,
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
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useMatches,
  useParams,
} from "@remix-run/react";

import tailwind from "./styles/tailwind.css"
import { loadTranslations, fallbackLocale, getMatchingLocale } from "./helpers/i18n";
import { createMouseFollower, fluidType, getContrast, isExternalLink } from "./utils/helpers";
import { safeGet } from "./utils/safe-post";
import { WebLinkModel } from "api/models";
import { page, website } from "./api";
import { Page, Website } from "./models";
import { DynamicLinks } from "./utils/dynamic-links";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwind }
  ];
};

export const meta: MetaFunction = ({ data }) => {
  return {
    'twitter:card': 'summary_large_image'
  };
};

type LoaderData = {
  primaryColor: string;
  favicon: string;
  links: {
    title: string;
    url: string;
    isExternal: boolean;
  }[];
  incomingLocale: string;
  locales: { code: string; title: string; }[];
  fontUrl: string;
  fontFamily: string;
  logoUrl: string;
  cursor: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""

  function getLanguageName(lang: string) {
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
        return "";
    }
  }

  let links: {
    title: string;
    url: string;
    isExternal: boolean;
  }[] = []
  let locales: {
    code: string;
    title: string;
  }[] = []

  if (incomingLocale === "") {
    const [fullWebRes, fullWebErr] = await website(request, params, "");
    if (fullWebErr !== null) {
      throw new Response("Website: " + fullWebErr.message, {
        status: 404,
      });
    }
    return redirect(`/${fullWebRes.website.languageCode}`);
  }

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

  const primaryColor: string = websiteObject.theme.accentColor

  const favicon = websiteObject.theme.iconUrl
  const fontUrl = websiteObject.theme.fontFamilyUrl
  const fontFamily = websiteObject.theme.fontFamily
  const logoUrl = websiteObject.theme.logoUrl

  links = websiteObject.navigation.map(l => {
    return {
      title: l.title,
      url: l.url,
      isExternal: isExternalLink(l.url)
    }
  })
  const availableLocales: string[] = webRes.languageCodes.filter((l: string) => l !== params.lang)
  locales = availableLocales.map(al => {
    return {
      code: al,
      title: getLanguageName(al)
    }
  })

  const [pageRes, pageErr] = await page("index", params)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const pageObject: Page = pageRes.page

  const cursor = pageObject.blocks[1].items[0].attachment?.url || ""


  const loaderData: LoaderData = {
    primaryColor,
    favicon,
    fontUrl,
    incomingLocale,
    links,
    locales,
    fontFamily,
    logoUrl,
    cursor
  }

  return json(loaderData)
};

export default function App() {
  const loaderData = useLoaderData<LoaderData>()
  const params = useParams()

  const [currentTime, setCurrentTime] = useState('✻☯︎')

  const getTimeDate = () => {
    var date = new Date();
    var current_date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    var current_time = `${date.getHours() < 10 ? '0' : ''}${date.getHours()}` + ":" + `${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}` + ":" + `${date.getSeconds()}${date.getSeconds() < 10 ? '0' : ''}`;
    var date_time = current_date + " ✶ " + current_time;
    setCurrentTime(date_time)
  }

  useEffect(
    () => { setTimeout(getTimeDate, 1000) }
  )

  const style = {
    "--customfont": loaderData.fontFamily,
    fontFamily: loaderData.fontFamily,
    backgroundColor: "white",
  }

  const style2 = {
    color: getContrast("#ffffff")
  }

  const [isMenuOpen, togglemenuOpen] = useState<boolean>(false)

  const followerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (followerDivRef.current) {
      createMouseFollower(followerDivRef.current);
    }
  }, []);

  const cursor = loaderData.cursor

  return (
    <html lang={loaderData.incomingLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <link rel="icon" type="image/x-icon" href={loaderData.favicon} />
        <Links />
        <DynamicLinks />
      </head>
      <body className="cursor-none">
        <div style={style} className="fixed inset-0 overflow-hidden selection:bg-[blue] selection:text-[white] w-full h-full flex flex-col-reverse font-default">
          {
            cursor === "" ? (
              <div ref={followerDivRef} className="fixed top-0 left-0 w-3 h-3 z-[1000] bg-black rounded-full pointer-events-none select-none origin-center cursor-none" />
            ) : (
              <div ref={followerDivRef} className="fixed top-0 left-0 w-3 h-3 z-[1000] pointer-events-none cursor-none select-none origin-center cursor-none">
                <img src={cursor} alt="Cursor" />
              </div>
            )
          }
          <div style={style2} className="fixed bottom-0 z-50 inset-x-0 w-full flex items-center justify-between uppercase px-2 text-lg lg:text-base">
            <Link to={`/${params.lang}`} onClick={() => togglemenuOpen(false)} className="hover:rotate-45 transition-all ease-in-out duration-300">
              ✻
            </Link>
            <p className="w-48 whitespace-nowrap absolute inset-x-0 mx-auto text-center">
              {currentTime}
            </p>
            <button onClick={() => togglemenuOpen(!isMenuOpen)} className={`${isMenuOpen ? "rotate-45" : ""} relative z-50 transition-all ease-in-out duration-300`}>
              <p className="sr-only">
                Menu
              </p>
              ＋
            </button>
          </div>
          <div className="relative z-10 w-full flex-1 overflow-hidden">
            <Outlet />
            {
              isMenuOpen && (
                <div className="absolute inset-0 w-full h-full z-40 flex items-center justify-center p-[1.5vmin] bg-white bg-opacity-50 backdrop-blur-2xl">
                  {
                    loaderData.links.length > 0 &&
                    <nav className="flex flex-col gap-[6vmin] lg:gap-[2vmin] items-center h-full justify-between uppercase">
                      <p className="text-xs">
                        Copyright © <a href="https://davidegiovanni.com" target={'_blank'} rel="noopener">Davide Giovanni Steccanella </a>
                      </p>
                      <ul className="w-full flex flex-col gap-[6vmin] lg:gap-[2vmin] items-center justify-center h-full" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
                        {loaderData.links.map((link, index) => (
                          <li key={index} onClick={() => togglemenuOpen(false)}>
                            {
                              link.isExternal ? (
                                <a href={link.url} className="block">
                                  {link.title}
                                </a>
                              ) : (
                                <NavLink to={link.url} className={({ isActive }) =>
                                  `${isActive ? "opacity-50" : "hover:opacity-50"} opacity-100 block`
                                }>
                                  {link.title}
                                </NavLink>
                              )
                            }
                          </li>
                        ))}
                      </ul>
                      <div></div>
                    </nav>
                  }
                </div>
              )
            }
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href={loaderData.fontUrl} rel="stylesheet"></link>
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

export function CatchBoundary() {

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
              This page did not load correctly
            </p>
            <Link to={'/'} className="block underline mb-4 text-white" reloadDocument>
              Go to homepage
            </Link>
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
            <p className="text-white my-4">
              {error.message} {error.stack}
            </p>
            <Link to={'/'} className="block underline mb-4 text-white" reloadDocument>
              Go to homepage
            </Link>
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