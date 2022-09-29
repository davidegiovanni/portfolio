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

const i18nKeys = [] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  sections: WebSectionModel[];
};

export const loader: LoaderFunction = async ({request, params}) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);
  const url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  let lang = params.lang

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/contacts?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error(`API Page: ${pageErr.message}, ${pageErr.code}`);
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
  const { sections } = useLoaderData<LoaderData>();

  return (
    <div className={"p-4 h-full w-full"}>
      <div className="max-w-screen-sm">
        <h1 style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }} className="w-full uppercase font-bold">{sections[0].title}</h1>
        <h2 className="my-4" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }}>
          {sections[0].description}
        </h2>
        <a href={sections[0].primaryLink.url} className="inline-block uppercase underline text-[blue] hover:text-[darkblue] visited:text-[purple]" style={{ fontSize: fluidType(16, 16, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
          {sections[0].primaryLink.title}
        </a>

      </div>
    </div>
  );
}