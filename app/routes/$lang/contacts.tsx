import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { ArrowLeftIcon } from '@heroicons/react/outline'

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://holydavid.art/it-it',
      alternate: 'https://holydavid.art/en-en'
    }
  )
};

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://holydavid.art' + location.pathname

  if (data !== undefined) {
    const { page } = data as LoaderData;
    title = (page.title !== '' ? page.title : "Homepage") + ' | Holy David'
    description = page.description !== '' ? page.description : "Holy David art website where you can fin news, info and more"
    image = page.image !== '' ? page.image : ''
    url = 'https://holydavid.art' + location.pathname
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

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  sections: WebSectionModel[];
};

export const loader: LoaderFunction = async ({request, params}) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang === 'it-it' ? 'it-IT' : 'en-US'

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/illustrations.davidegiovanni.com/pages/contacts?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error("Website didn't load correctly");
  }

  const page: WebPageModel = pageRes.page

  const sections: WebSectionModel[] = page.sections

  const loaderData: LoaderData = {
    i18n,
    page: page,
    sections: sections
  }

  return json(loaderData)
};

export default function Contacts() {
  const { i18n, sections } = useLoaderData<LoaderData>();
  const params = useParams()

  const feeds: WebSectionModel[] = sections.length > 1 ? sections.splice(1) : [] as WebSectionModel[]

  const theme = {
    primary: sections[0].secondaryLink.title || '#ffffff'
  }

  const dynamicClass = `bg-white text-black h-full w-full flex flex-col overflow-hidden items-stretch p-2`

  return (
    <div className={dynamicClass}>
      <div className="flex-1 w-full flex flex-col items-start justify-start">
        <div className="w-full lg:w-auto">
          <div className="mb-4">
          <Link to={`/${params.lang}`} className="underline">
            <p className="sr-only">
              Torna indietro
            </p>
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
        </div>
          <h1 style={{ fontSize: fluidType(24, 80, 300, 2400, 1.5).fontSize, lineHeight: fluidType(20, 76, 300, 2400, 1.5).lineHeight }} className="text-justify w-full">{sections[0].title}</h1>
          <div className="columns-2 gap-4 pt-4 pb-1 my-4 border-y border-black w-full">
            <h2 className="text-justify" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
              {sections[0].description}
            </h2>
          </div>
          <div className="w-full underline uppercase hover:opacity-50 flex items-center justify-between">
            <a href={sections[0].primaryLink.url} className="text-justify" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
              {sections[0].primaryLink.title}
            </a>
          </div>
        </div>
      </div>
      <div className={`w-full h-2/3 overflow-hidden relative flex items-stretch justify-end`}>
        <img src={sections[0].image} className="w-auto h-full object-cover" alt="" />
      </div>
    </div>
  );
}