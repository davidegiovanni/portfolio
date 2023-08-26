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
  useNavigation,
  useParams,
  useRouteError,
} from "@remix-run/react";
import { cssBundleHref } from "@remix-run/css-bundle";

import tailwind from "./styles/tailwind.css"
import { createMouseFollower, fluidType, getContrast, isExternalLink } from "./utils/helpers";
import { page, website } from "./api";
import { Page, Website } from "./models";
import { DynamicLinks } from "./utils/dynamic-links";
import defaultCss from "./default.css";

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
    const supportsHover = window.matchMedia("(hover: hover)").matches;

    if (!supportsHover || !followerDivRef.current) {
      return; // Exit the useEffect hook if hover is not supported or the ref is not available
    }

    if (followerDivRef.current) {
      createMouseFollower(followerDivRef.current);
    }
  }, []);

  const cursor = loaderData.cursor
  return (
    <Document lang={loaderData.incomingLocale} favicon={loaderData.favicon} fontUrl={loaderData.fontUrl}>
      <div style={style} className="fixed inset-0 overflow-hidden selection:bg-slate-100 w-full h-full flex flex-col-reverse font-default cursor-none">
        {(navigationStart || navigationEnd) && (
          <div
            data-navigation-start={navigationStart}
            data-navigation-end={navigationEnd}
            className="loading-bar"
          />
        )}
        {
          cursor === "" ? (
            <div ref={followerDivRef} className="hidden xl:block fixed top-0 left-0 w-12 h-12 z-[1000] bg-black rounded-full pointer-events-none select-none origin-top-left cursor-none" />
          ) : (
            <div ref={followerDivRef} className="hidden xl:block fixed top-0 left-0 w-12 h-12 z-[1000] pointer-events-none select-none origin-top-left cursor-none">
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
          <div data-visible={isMenuOpen} className="absolute opacity-0 h-0 overflow-hidden data-[visible=true]:h-full data-[visible=true]:opacity-100 inset-0 w-full z-40 flex items-center justify-center p-[1.5vmin] bg-white bg-opacity-50 backdrop-blur-2xl">
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
          <Outlet />
        </div>
      </div>
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