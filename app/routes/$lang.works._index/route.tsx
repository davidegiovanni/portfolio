import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useLocation, useParams, V2_MetaFunction } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { Attachment } from "~/components/Attachment";
import { useState } from "react";
import { WebPageModel, WebSectionModel } from "~/models";
import { ArrowRightIcon } from "@radix-ui/react-icons";

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://illos.davidegiovanni.com/it-it/works',
    }
  )
};

export const meta: V2_MetaFunction = ({ data, location }) => {
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

  const [isListView, setView] = useState(false)

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-hidden flex flex-col">
      <div className="p-4 border-b border-black aspect-square lg:aspect-[3/1] uppercase">
        <h1>
          {mainSection.title}
        </h1>
      </div>
      {feeds.map((f, index) => (
        <Link className={'relative group flex items-center justify-between w-full border-b border-black last:border-0 p-4 uppercase'} to={`/${params.lang}/works/${f.description}`}>
          <div className="flex items-center justify-start gap-4">
            <div className={"w-32 aspect-video rounded-full overflow-hidden"}>
              <Attachment size="object-cover" attachment={{
                mediaType: "image/",
                url: f.image,
                description: f.title,
                metadata: {}
              }}></Attachment>
            </div>
            <h2>
              {f.title}
            </h2>
          </div>
          <div className="w-10 h-10 flex rounded-full border border-black group-hover:bg-black group-hover:text-white">
          <ArrowRightIcon className="w-6 h-6 m-auto" />
          </div>
        </Link>
      ))}
    </div>
  );
}