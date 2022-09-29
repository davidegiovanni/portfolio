import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";

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
  mainSection: WebSectionModel;
  feeds: WebSectionModel[];
  logo: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang
  let url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illustrations.davidegiovanni.com' : url.host

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Error(`API website: ${websiteErr.message} ${websiteErr.code}`);
  }
  const logo = websiteRes.website.theme.logoUrl

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/${host}/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error(`API Page: ${pageErr.message}, ${pageErr.code}`);
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

  return (
    <div className="h-full w-full overflow-y-auto">
        <ul className="grid grid-cols-2 md:grid-cols-3 border-l border-black h-full">
          {feeds.map((f, index) => (
            <div className="border-b border-r border-black last:border-b-0 relative group">
              <Link className={'text-center'} to={`/${params.lang}/works/${f.description}`}>
                <div className="aspect-[3/4] relative z-10">
                <Attachment size="object-cover" attachment={{
                    id: "",
                    mediaType: "image/",
                    url: f.image,
                    description: f.title
                  }}></Attachment>
                </div>
                <div className="absolute inset-x-0 bottom-0 text-center z-20">
                  <p style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }} className="bg-white border border-black group-hover:underline rounded-md mb-4 px-4 py-2 uppercase inline-block w-fit mx-auto">
                    {f.title}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </ul>
      </div>
  );
}