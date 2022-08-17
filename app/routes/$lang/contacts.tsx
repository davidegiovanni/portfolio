import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { ArrowLeftIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://illos.davidegiovanni.com/it-it/contacts'
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
    title = (page.title !== '' ? page.title : "Contatti") + ' | Davide G. Steccanella'
    description = page.description !== '' ? page.description : "Contatta Davide Giovanni Steccanella per le sue illustrazioni"
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

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  sections: WebSectionModel[];
  primary: string;
};

export const loader: LoaderFunction = async ({request, params}) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang === 'it-it' ? 'it-IT' : 'en-US'

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/illustrations.davidegiovanni.com/pages/contacts?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error(`API Page: ${pageErr.message}, ${pageErr.code}`);
  }

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/illustrations.davidegiovanni.com?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Error(`API website: ${websiteErr.message} ${websiteErr.code}`);
  }

  const primary = websiteRes.website.theme.primaryColor

  const page: WebPageModel = pageRes.page

  const sections: WebSectionModel[] = page.sections

  const loaderData: LoaderData = {
    i18n,
    page: page,
    sections: sections,
    primary
  }

  return json(loaderData)
};

export default function Contacts() {
  const { primary, sections } = useLoaderData<LoaderData>();
  const params = useParams()

  const dynamicClass = `bg-black text-black h-full w-full flex flex-col lg:flex-row overflow-hidden items-stretch p-2`

  return (
    <div className={dynamicClass}>
      <div style={{ backgroundColor: primary}} className="h-1/3 lg:h-full w-full lg:w-1/2 flex-none p-2">
        <div className="flex-1 lg:p-8 flex flex-col justify-end lg:justify-center items-start lg:items-center h-full relative">
          <div className="m-4 absolute top-0 left-0">
          <Link to={`/${params.lang}`} className="underline">
            <p className="sr-only">
              Torna indietro
            </p>
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          </div>
          <h1 style={{ fontSize: fluidType(24, 64, 300, 2400, 1.5).fontSize, lineHeight: fluidType(20, 48, 300, 2400, 1.5).lineHeight }} className="w-full lg:text-center">{sections[0].title}</h1>
          <h2 className="text-center w-3/4 mx-auto my-4" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 12, 300, 2400, 1.5).lineHeight }}>
            {sections[0].description}
          </h2>
          <a href={sections[0].primaryLink.url} className="lg:text-center inline-block uppercase underline" style={{ fontSize: fluidType(16, 16, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
            {sections[0].primaryLink.title}
          </a>
        </div>
      </div>
      <div className={`bg-white flex flex-col h-2/3 lg:h-full p-4 items-center justify-center`}>
            <div className="w-full max-w-screen-md h-full lflex-1 object-cover">
                <Attachment attachment={{
                id: "",
                mediaType: "image/",
                url: sections[0].image,
                description: ""
              }}></Attachment>
            </div>
      </div>
    </div>
  );
}