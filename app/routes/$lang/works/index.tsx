import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://holydavid.art/it-it',
      alternate: 'https://holydavid.art/en-en'
    }
  )
};

export const meta: MetaFunction = ({ location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://holydavid.art' + location.pathname

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
  i18n: Record<I18nKeys, any>
};

export const loader: LoaderFunction = async ({request, params}) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang === 'it-it' ? 'it-IT' : 'en-US'

  const loaderData: LoaderData = {
    i18n
  }

  return json(loaderData)
};

export default function WorksIndex() {
  const { i18n } = useLoaderData<LoaderData>();
  const params = useParams()

  const dynamicClass = `h-full w-full flex flex-col items-center justify-center`

  return (
    <div className={dynamicClass}>
      Seleziona una collezione per vedere i disegni
    </div>
  );
}