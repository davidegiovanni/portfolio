import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { useState } from "react";

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://illos.davidegiovanni.com/it-it/works',}
  )
};

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { page } = data as LoaderData;
    title = (page.title !== '' ? page.title : "Lavori") + ' | Davide G. Steccanella'
    description = page.description !== '' ? page.description : "Le illustrazioni di Davide Giovanni Steccanella"
    image = page.image !== '' ? page.image : ''
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
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  mainSection: WebSectionModel;
  feeds: WebSectionModel[];
  logo: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang
  let url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Response(`Error loading website: ${websiteErr.message} ${websiteErr.code}`, {
      status: 404,
    });
  }
  const logo = websiteRes.website.theme.logoUrl

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageRes.message} ${pageRes.code}`, {
      status: 404,
    });
  }

  const page: WebPageModel = pageRes.page

  const mainSection: WebSectionModel = page.sections[0]

  const feeds = page.sections.length > 1 ? page.sections.splice(1) : []

  const loaderData: LoaderData = {
    i18n,
    page: page,
    mainSection,
    feeds,
    logo
  }

  return json(loaderData)
};

export default function Works() {
  const { mainSection, feeds } = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  const [isListView, setView] = useState(true)

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-4 py-2 h-12 flex items-center justify-between border-b border-black flex-none">
        <h1 className="uppercase" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 12, 300, 2400, 1.5).lineHeight }}>
          { mainSection.title }
        </h1>
        <div className="flex items-center justify-end">
          <button onClick={() => setView(true)} className={(isListView ? "pointer-events-none opacity-50 select-none " : "") + "bg-white border border-black border-r-0 group-hover:underline rounded-l-md p-2 uppercase inline-block w-fit mx-auto"}>
            <p className="sr-only">
              {'List view'}
            </p>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
</svg>

          </button>
          <button onClick={() => setView(false)} className={(!isListView ? "pointer-events-none opacity-50 select-none " : "") + "bg-white border border-black group-hover:underline rounded-r-md p-2 uppercase inline-block w-fit mx-auto"}>
            <p className="sr-only">
              {'Grid view'}
            </p>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
</svg>

          </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        <div className={(isListView ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3") + " grid border-l border-black w-full "}>
          {feeds.map((f, index) => (
            <div key={index} className="border-b border-r border-black last:border-b-0 relative group">
              <Link className={(isListView ? "flex items-center" : "") + ' text-center block w-full'} to={`/${params.lang}/works/${f.description}`}>
                <div className={(isListView ? "aspect-square w-1/2 lg:w-1/4 border-r border-black mr-4 lg:mr-12 " : "aspect-[3/4]") + " relative z-10 lg:grayscale lg:group-hover:grayscale-0"}>
                <Attachment size="object-cover" attachment={{
                    id: "",
                    mediaType: "image/",
                    url: f.image,
                    description: f.title
                  }}></Attachment>
                </div>
                <div className={(isListView ? "w-1/2 lg:w-3/4 " : "absolute inset-x-0 bottom-0 ") + " text-center z-20 px-2"}>
                  <p style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }} className="bg-white border border-black group-hover:underline rounded-md mb-4 px-4 py-2 uppercase inline-block w-10/12 lg:w-fit mx-auto">
                    {f.title}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      </div>
  );
}