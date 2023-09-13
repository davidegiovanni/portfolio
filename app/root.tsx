import { ReactNode, useEffect, useRef, useState } from "react";
import {
  json,
  LinksFunction,
  LoaderFunction,
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
  V2_MetaFunction,
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useNavigation,
  useParams,
  useRouteError,
} from "@remix-run/react";
import { cssBundleHref } from "@remix-run/css-bundle";

import tailwind from "./styles/tailwind.css"
import { createMouseFollower, fluidType, getContrast, isExternalLink, useFollowPointer } from "./utils/helpers";
import { page, website } from "./api";
import { Page, Website } from "./models";
import { DynamicLinks } from "./utils/dynamic-links";
import defaultCss from "./default.css";
import MSPaint from "./components/PaintCanvas";
import { motion } from "framer-motion";

export const meta: V2_MetaFunction = () => {
  return [
    {
      name: "twitter:card",
      content:
        "summary_large_image",
    },
  ];
};

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  {
    rel: "stylesheet",
    href: tailwind,
  },
  {
    rel: "stylesheet",
    href: defaultCss,
  },
];

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
  const location = useLocation()

  const navigation = useNavigation();

  const [navigationStart, setNavigationStart] = useState<boolean>(false);
  const [navigationEnd, setNavigationEnd] = useState<boolean>(false);

  useEffect(() => {
    if (navigation.state === "loading") {
      setNavigationStart(true);
      setNavigationEnd(false);
    }
    if (navigation.state === "idle" && navigationStart) {
      setNavigationEnd(true);
      setNavigationStart(false);
      setTimeout(() => {
        setNavigationEnd(false);
      }, 700);
    }
  }, [navigation.state]);

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

  const [isShowingCanvas, setShowCanvas] = useState<boolean>(false)

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
  const { x, y } = useFollowPointer(followerDivRef)

  const cursor = loaderData.cursor
  return (
    <Document lang={loaderData.incomingLocale} favicon={loaderData.favicon} fontUrl={loaderData.fontUrl}>
      {
        cursor === "" && 
          <motion.div
            ref={followerDivRef}
            className="hidden xl:block fixed top-0 left-0 w-12 h-12 z-[1000] bg-black rounded-full pointer-events-none select-none origin-top-left cursor-none" />
      }
      {
        cursor !== "" && (
          <motion.div
            ref={followerDivRef}
            animate={{ x, y }}
            transition={{
              type: "tween",
              ease: "linear",
              duration: 0
            }}
            className="hidden fixed top-0 left-0 xl:block w-12 h-12 z-[1000] pointer-events-none select-none cursor-none will-change-transform">
            <img className="translate-x-[50%] translate-y-[50%]" src={cursor} alt="Cursor" />
          </motion.div>
        )
      }
      <div style={style} className="fixed inset-0 overflow-hidden  selection:bg-slate-100 w-full h-full flex flex-col-reverse font-default cursor-none">
        {(navigationStart || navigationEnd) && (
          <div
            data-navigation-start={navigationStart}
            data-navigation-end={navigationEnd}
            className="loading-bar"
          />
        )}
        <div style={style2} data-disabled={isShowingCanvas} className="fixed bottom-0 z-50 data-[disabled=true]:translate-y-8 transition-all duration-200 ease-in-out inset-x-0 w-full flex items-center justify-between uppercase px-2 text-lg lg:text-base">
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
        <div data-visible={isMenuOpen} className="fixed opacity-0 h-0 p-0 overflow-hidden data-[visible=true]:h-full data-[visible=true]:opacity-100 inset-0 w-full z-40 flex items-center justify-center data-[visible=true]:p-[1.5vmin] bg-white bg-opacity-50">
          {
            loaderData.links.length > 0 &&
            <nav className="flex flex-col gap-[6vmin] lg:gap-[2vmin] items-center h-full justify-between uppercase">
              <p className="text-xs">
                Copyright © <a href="https://davidegiovanni.com" target={'_blank'} rel="noopener">Davide Giovanni Steccanella </a>
              </p>
              <ul className="w-full flex flex-col gap-[6vmin] lg:gap-[2vmin] items-center justify-center h-full" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
                  <NavLink to={`/${params.lang}`} onClick={() => togglemenuOpen(false)} className={({ isActive }) =>
                    `block`
                  }>
                    HOME
                  </NavLink>
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
        <div data-visible={isMenuOpen} data-disabled={isShowingCanvas} className="w-full flex-1 overflow-hidden data-[visible=true]:blur-2xl data-[disabled=true]:pointer-events-none">
          <Outlet />
        </div>
      </div>
      {

      }
      <MSPaint isShowingCanvas={isShowingCanvas} />
      {!isMenuOpen && location.pathname.endsWith(loaderData.incomingLocale) && (
          <button className="fixed top-0 right-0 m-4 z-50" onClick={() => setShowCanvas(!isShowingCanvas)}>
            {
              isShowingCanvas ? (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              )
            }
          </button>
        )}
    </Document>
  )
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isErrorBig = isRouteErrorResponse(error)

  return (
    <Document lang={"en-US"} favicon={""} fontUrl={""}>
      <div className="fixed inset-0 overflow-hidden bg-[#0827F5] text-white p-2 selection:bg-yellow-500 selection:text-white">
        <div className="w-full h-full overflow-hidden safari-only">
          <h1 style={{ fontSize: fluidType(32, 120, 300, 2400, 1.5).fontSize, lineHeight: fluidType(24, 100, 300, 2400, 1.5).lineHeight }}>
            Error ಥ_ಥ
          </h1>
          <p className="text-white my-4">
            {isErrorBig && (
              <>
                {error.status} {error.statusText}
              </>
            )}
            {!isErrorBig && error instanceof Error && (
              <>
                {error.message} {error.name}
              </>
            )}
          </p>
          <Link to={'/'} className="block underline mb-4 text-white" reloadDocument>
            Go to homepage
          </Link>
          <img src="https://c.tenor.com/1zi9Ppr4YDsAAAAj/travolta-lost.gif" alt="" />
        </div>
      </div>
    </Document>
  );
}

function Document(props: { children: ReactNode; lang: string; favicon: string; fontUrl: string; }) {
  return (
    <html>
      <head lang={props.lang}>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <link rel="icon" type="image/x-icon" href={props.favicon} />
        <Links />
        <DynamicLinks />
      </head>
      <body>
        {props.children}
        <Scripts />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href={props.fontUrl} rel="stylesheet"></link>
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  )
}