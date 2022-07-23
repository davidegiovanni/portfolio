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
      canonical: 'https://illos.davidegiovanni.com/it-it'
    }
  )
};

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<I18nKeys, any>,
  logo: string
};

export const loader: LoaderFunction = async ({request, params}) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang === 'it-it' ? 'it-IT' : 'en-US'

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/illustrations.davidegiovanni.com?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Error(`API website: ${websiteErr.message} ${websiteErr.code}`);
  }
  const logo = websiteRes.website.theme.borderRadius

  const loaderData: LoaderData = {
    i18n,
    logo
  }

  return json(loaderData)
};

export default function WorksIndex() {
  const { i18n, logo } = useLoaderData<LoaderData>();
  const params = useParams()

  const dynamicClass = `h-full w-full flex flex-col items-center justify-center`

  return (
    <div className={dynamicClass}>
      <img src={logo} alt="" className="w-1/2 hidden lg:block" />
    </div>
  );
}