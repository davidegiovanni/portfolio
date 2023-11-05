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
import { AnimatePresence, motion } from "framer-motion";
import itTranslations from "./i18n/it-IT.json"
import enTranslations from "./i18n/en-US.json"
import { newTranslate } from "~/utils/translate";

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
  translations: Record<any, any>;
  englishVersion: string;
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
  let translations = incomingLocale === "it-IT" ? itTranslations : enTranslations
  let englishVersion = ""

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

  const otherLangs: string[] = webRes.languageCodes.filter((l: string) => l !== incomingLocale)
  const websiteObject: Website = webRes.website

  if (otherLangs.length !== 0) englishVersion = otherLangs.filter(l => l.toLowerCase() === "en-us")[0]

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
    translations,
    englishVersion,
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
  const translate = newTranslate({ messages: loaderData.translations })

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
  }

  const [isMenuOpen, togglemenuOpen] = useState<boolean>(false)
  const [isNavVisible, toggleNavOpen] = useState<boolean>(false)

  function togglePresence() {
    if (isMenuOpen) {
      toggleNavOpen(false)
      setTimeout(() => {
        togglemenuOpen(false)
      }, 500)
    }
    if (!isMenuOpen) {
      togglemenuOpen(true)
      setTimeout(() => {
        toggleNavOpen(true)
      }, 500)
    }
  }

  function closeAll() {
    toggleNavOpen(false)
    setTimeout(() => {
      togglemenuOpen(false)
    }, 500)
  }

  const followerDivRef = useRef<HTMLDivElement>(null);
  const { x, y } = useFollowPointer(followerDivRef)

  const cursor = loaderData.cursor
  return (
    <Document lang={loaderData.incomingLocale} favicon={loaderData.favicon} fontUrl={loaderData.fontUrl}>
      {
        cursor === "" &&
        <motion.div
          ref={followerDivRef}
          animate={{ x, y }}
            transition={{
              type: "tween",
              ease: "linear",
              duration: 0
            }}
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
      <div style={style} className="fixed inset-0 overflow-hidden selection:bg-slate-100 w-full h-full flex flex-col-reverse font-default cursor-none">
        {(navigationStart || navigationEnd) && (
          <div
            data-navigation-start={navigationStart}
            data-navigation-end={navigationEnd}
            className="loading-bar"
          />
        )}
        <div data-disabled={isShowingCanvas} className="relative z-[100] data-[disabled=true]:translate-y-16 transition-all duration-200 ease-in-out w-full px-2 pb-2 text-sm lg:text-base bg-white flex flex-col gap-2">
          <div className="flex items-center justify-center">
            <motion.div animate={{ width: "50%" }} transition={{ ease: "easeOut", duration: 0.5 }} className="h-px border-t border-black w-0"></motion.div>
            <motion.div animate={{ width: "50%" }} transition={{ ease: "easeOut", duration: 0.5 }} className="h-px border-t border-black w-0"></motion.div>
          </div>
          <div className="flex items-center justify-between uppercase">
            <Link to={`/${params.lang}`} onClick={closeAll} className="block lg:hidden lg:hover:-rotate-45 transition-all ease-in-out duration-300 pl-2 overflow-hidden">
              {loaderData.logoUrl === "" && `✻`}
              {loaderData.logoUrl !== "" && <motion.img animate={{ translateY: 0 }} initial={{ translateY: 36 }} transition={{ ease: "easeOut", duration: 0.1, delay: 0.5 }} src={loaderData.logoUrl} className="block h-4 lg:h-8" />}
            </Link>
            <Link to={`/${params.lang}`} className="hidden lg:block lg:hover:-rotate-45 transition-all ease-in-out duration-300 pl-2 overflow-hidden">
              {loaderData.logoUrl === "" && `✻`}
              {loaderData.logoUrl !== "" && <motion.img animate={{ translateY: 0 }} initial={{ translateY: 36 }} transition={{ ease: "easeOut", duration: 0.1, delay: 0.5 }} src={loaderData.logoUrl} className="block h-4 lg:h-8" />}
            </Link>
            <p className="w-48 whitespace-nowrap absolute inset-x-0 mx-auto text-center">
              {currentTime}
            </p>
            <nav className="hidden lg:block">
              <ul className="w-full flex gap-1 lg:gap-2 items-center justify-end ">
                {loaderData.links.map((link, index) => (
                  <motion.li animate={{ translateY: 0 }} initial={{ translateY: 36 }} transition={{ ease: "easeOut", duration: 0.1, delay: index / 10 }} data-active={location.pathname.endsWith(link.url)} key={index} onClick={() => togglemenuOpen(false)} className={"inline-block group rounded-full bg-neutral-100 px-3 py-1 overflow-hidden relative data-[active=true]:pointer-events-none data-[active=true]:bg-black data-[active=true]:text-white hover:text-white text-sm transition-all duration-500 will-change-contents"}>
                    {
                      link.isExternal ? (
                        <a href={link.url} className={"relative z-10"}>
                          {link.title}
                        </a>
                      ) : (
                        <NavLink to={link.url} className={"relative z-10"}>
                          {link.title}
                        </NavLink>
                      )
                    }
                    <div className="absolute origin-center inset-0 aspect-square rounded-full scale-0 group-hover:scale-[2] transition-all duration-1000 bg-black"></div>
                  </motion.li>
                ))}
                {loaderData.englishVersion !== "" && (
                  <motion.li animate={{ translateY: 0 }} initial={{ translateY: 36 }} transition={{ ease: "easeOut", duration: 0.1, delay: loaderData.links.length - 1 / 10 }} onClick={() => togglemenuOpen(false)} className={"inline-block group rounded-full bg-neutral-100 px-3 py-1 overflow-hidden relative data-[active=true]:pointer-events-none data-[active=true]:bg-black data-[active=true]:text-white hover:text-white text-sm transition-all duration-500 will-change-contents"}>
                    <Link to={`/${loaderData.englishVersion}`} className={"relative z-10"} reloadDocument>
                      {translate({ key: `language_${loaderData.englishVersion.toLowerCase()}` })}
                    </Link>
                    <div className="absolute origin-center inset-0 aspect-square rounded-full scale-0 group-hover:scale-[3] transition-all duration-1000 bg-black"></div>
                  </motion.li>
                )}
              </ul>
            </nav>
            <button onClick={togglePresence} className={"lg:hidden rounded-full bg-neutral-100 px-3 py-1 hover:bg-black hover:text-white text-sm flex items-center justify-center gap-1 uppercase"}>
              Menu
              <svg data-menuopen={isMenuOpen} className="data-[menuopen=true]:rotate-45 transition-all duration-300 ease-in-out -tranlate-y-1 block" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            </button>
          </div>
        </div>
        <div key={location.pathname} className="bg-white relative w-full flex-1 overflow-hidden">
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                animate={{ scaleY: 1 }}
                initial={{ scaleY: 0 }}
                exit={{ scaleY: 0 }}
                transition={{ ease: "easeOut", duration: 0.2 }}
                className="absolute origin-bottom overflow-hidden inset-0 z-50 p-2 flex flex-col gap-4 items-stretch justify-end bg-white">
                <ul className="w-full flex flex-col gap-4 items-start justify-start ">
                  {loaderData.links.map((link, index) => (
                    <div className="w-full flex flex-col gap-4 items-stretch justify-start">
                      <div className="w-full h-fit overflow-hidden">
                        <AnimatePresence>
                          {
                            isNavVisible && (
                              <motion.li
                                animate={{ translateY: 0 }}
                                initial={{ translateY: "100%" }}
                                exit={{ translateY: "-100%" }}
                                transition={{ ease: "easeOut", duration: 0.3, delay: index / 5 }} data-active={location.pathname.endsWith(link.url)} key={index} onClick={togglePresence} className={"uppercase text-xl w-full flex items-center justify-between"}>
                                {
                                  link.isExternal ? (
                                    <a href={link.url} className={"relative z-10 inline-flex items-start justify-start gap-2 w-full"}>
                                      <span className="text-xs translate-y-1">{index + 1}</span>
                                      {link.title}
                                    </a>
                                  ) : (
                                    <NavLink to={link.url} className={"relative z-10 inline-flex items-start justify-start gap-2 w-full"}>
                                      <span className="text-xs translate-y-1">{index + 1}</span>
                                      {link.title}
                                    </NavLink>
                                  )
                                }
                                <span
                                  className="w-4 h-4 overflow-hidden">
                                  {
                                    isNavVisible && (
                                      <motion.svg
                                        animate={{ translateY: 0, rotate: 0 }}
                                        initial={{ translateY: "100%", rotate: -45 }}
                                        exit={{ translateY: "-100%", rotate: 45 }}
                                        transition={{ ease: "easeOut", duration: 0.3, delay: index / 3 }}
                                        width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></motion.svg>
                                    )
                                  }
                                </span>
                              </motion.li>
                            )
                          }
                        </AnimatePresence>
                      </div>
                      {index !== loaderData.links.length - 1 && (
                        <AnimatePresence>
                          {
                            isNavVisible && (
                              <motion.div
                                animate={{ width: "100%" }}
                                initial={{ width: 0 }}
                                exit={{ width: 0 }}
                                transition={{ ease: "easeOut", duration: 0.2, delay: index / 10 }} className="h-px border-t border-black w-0"></motion.div>
                            )
                          }
                        </AnimatePresence>
                      )}
                    </div>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          <Outlet />
        </div>
      </div>
      {

      }
      <MSPaint isShowingCanvas={isShowingCanvas} />
      {!isMenuOpen && location.pathname.endsWith(loaderData.incomingLocale) && (
        <motion.button
          animate={{ translateY: 0 }} initial={{ translateY: -100 }} transition={{ ease: "easeOut", duration: 0.1, delay: 1 }}
          className="fixed top-0 right-0 m-4 z-50 group rounded-full px-3 py-1 overflow-hidden data-[active=true]:pointer-events-none data-[active=true]:bg-black data-[active=true]:text-white hover:text-white text-sm transition-all duration-500 will-change-contents" onClick={() => setShowCanvas(!isShowingCanvas)}>
          <p className="relative z-10 inline-flex items-center justify-center gap-1">
            {
              isShowingCanvas ? (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              )
            }
            {translate({ key: isShowingCanvas ? `close_canvas` : `draw_on_canvas` })}
          </p>
          <div className="absolute origin-center -translate-y-8 inset-0 aspect-square rounded-full scale-0 group-hover:scale-[3] transition-all duration-1000 bg-black"></div>
        </motion.button>
      )}
    </Document>
  )
}

export function ErrorBoundary() {
  const followerDivRef = useRef<HTMLDivElement>(null);
  const { x, y } = useFollowPointer(followerDivRef)
  const params = useParams()
  const error = useRouteError();
  const isErrorBig = isRouteErrorResponse(error)

  const incomingLocale = params.lang || ""
  const translate = newTranslate({ messages: incomingLocale === "it-IT" ? itTranslations : enTranslations })

  return (
    <Document
      lang={incomingLocale}
      favicon={"/error-favicon.png"}
      fontUrl={"https://use.typekit.net/beq1tyu.css"}>
        <motion.div
        animate={{ x, y }}
        transition={{
          type: "tween",
          ease: "linear",
          duration: 0,
          delay: 0.01,
        }}
        ref={followerDivRef}
        className="hidden xl:block fixed top-0 left-0 w-4 h-4 z-[1000] border border-black rounded-full pointer-events-none select-none origin-top-left cursor-none" />
      <div className="fixed inset-0 overflow-hidden bg-white text-black">
        <div className="w-full h-full overflow-hidden flex flex-col items-center justify-center text-center gap-4 lg:gap-8 p-4 lg:p-8">
          <div className="w-full h-fit overflow-hidden">
            <motion.h1 animate={{ translateY: 0, opacity: 1 }} initial={{ translateY: "100%", opacity: 0 }} transition={{ ease: [.64, .13, .58, 1], duration: 0.5, delay: 0.2 }} className="font-medium text-2xl lg:text-6xl max-w-screen-lg mx-auto text-center uppercase">
              {translate({ key: "there_was_an_error" })}
            </motion.h1>
          </div>
          <div className="w-full h-fit overflow-hidden">
            <motion.h2 animate={{ translateY: 0, opacity: 1 }} initial={{ translateY: "100%", opacity: 0 }} transition={{ ease: [.64, .13, .58, 1], duration: 0.6, delay: 0.4 }} className="max-w-screen-sm uppercase mx-auto text-center text-sm lg:text-base">
              {translate({ key: "this_page_did_not_load_correctly_wait_and_retry" })}
            </motion.h2>
          </div>
          <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ ease: "easeInOut", duration: 0.5, delay: 1 }}>
            <Link to={'/'} className="inline-block rounded-full bg-neutral-200 px-6 py-1 hover:bg-black hover:text-white" reloadDocument>
              {translate({ key: "go_to_homepage" })}
            </Link>
          </motion.div>
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
      <body className="font-default">
        {props.children}
        <Scripts />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link rel="stylesheet" href={props.fontUrl}></link>
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  )
}