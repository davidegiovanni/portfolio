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
  feeds: WebSectionModel[];
};

export const loader: LoaderFunction = async ({request, params}) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang === 'it-it' ? 'it-IT' : 'en-US'

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/illustrations.davidegiovanni.com/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error("Website didn't load correctly");
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

export default function Index() {
  const { i18n, sections, feeds } = useLoaderData<LoaderData>();
  const params = useParams()

  const dynamicClass = `bg-white text-black h-full w-full overflow-y-hidden flex p-2`

  return (
    <div className={dynamicClass}>
      <div className="w-1/3">
        <div>
          <Link to={`/${params.lang}`}>
            Home
          </Link>
        </div>
        <div>
          { feeds.map((f, index) => (
              <Link to={`/${params.lang}/works/${f.description}`} className="block pt-8">
                <p style={{ fontSize: fluidType(16, 48, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 32, 300, 2400, 1.5).lineHeight }} className="pb-4 border-b-2 border-black w-full">
                  {f.title}
                </p>
              </Link>
            ))}
        </div>
      </div>
      <div className="overflow-y-hidden flex-1 p-2 bg-gray-100">
        <Outlet />
      </div>
    </div>
  );
}