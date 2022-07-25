import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, Outlet, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'

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

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  sections: WebSectionModel[];
  feeds: WebSectionModel[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang === 'it-it' ? 'it-IT' : 'en-US'

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/illustrations.davidegiovanni.com/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error(`API Page: ${pageErr.message}, ${pageErr.code}`);
  }

  const page: WebPageModel = pageRes.page

  const sections: WebSectionModel[] = page.sections

  const loaderData: LoaderData = {
    i18n,
    page: page,
    sections: sections,
    feeds: sections.length > 1 ? sections.splice(1) : [] as WebSectionModel[]
  }

  return json(loaderData)
};

export default function Works() {
  const { i18n, sections, feeds } = useLoaderData<LoaderData>();
  const params = useParams()
  const location = useLocation()

  const isFeedPage = location.pathname.includes('/works/')

  const dynamicClass = `bg-black text-black h-full w-full overflow-y-hidden flex flex-col lg:flex-row p-4 justify-between`

  return (
    <div className={dynamicClass}>
      <div className="w-full h-full lg:h-auto lg:w-1/4 flex flex-col items-center justify-start text-center overflow-y-auto transform rotate-3 shadow-2xl relative z-40">
        <div className="w-full lg:w-10/12 h-full bg-white p-2 flex flex-col justify-between">
          <div className="p-4">
            {feeds.map((f, index) => (
              <NavLink className={({ isActive }) =>
                isActive ? 'block uppercase line-through decoration-black decoration-wavy decoration-4' : 'uppercase'
              } to={`/${params.lang}/works/${f.description}`}>
                <p style={{ textDecorationLine: 'none'}}>
                  0{index + 1}.
                </p>
                <p style={{ fontSize: fluidType(16, 32, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 28, 300, 2400, 1.5).lineHeight }} className="mb-4">
                  {f.title}
                </p>
              </NavLink>
            ))}
          </div>
          <div style={{ fontSize: fluidType(12, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(8, 16, 300, 2400, 1.5).lineHeight }}>
            <p className="mb-2">
              Seleziona una collezione per vedere i disegni
            </p>
            <Link to={`/${params.lang}`} className="underline">
              Homepage
            </Link>
          </div>
        </div>
      </div>
      <div className={(isFeedPage ? 'fixed fixed lg:relative inset-0 ' : '') + " overflow-y-auto flex-1 h-full bg-black z-50"}>
        <Outlet />
      </div>
    </div>
  );
}