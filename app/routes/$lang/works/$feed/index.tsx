import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType, formatDate } from '~/utils/helpers'
import queryString from 'query-string'
import { ArrowLeftIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const feed = data.feed
    const page = data.page
    title = (feed.title !== '' ? feed.title : "Pagina") + ' | Davide G. Steccanella'
    description = feed.description !== '' ? feed.description : "Le illustrazioni di Davide G. Steccanella"
    image = page.image !== '' ? page.image : ""
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

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  sections: WebSectionModel[];
  feed: Feed;
  items: FeedItem[];
  canonical: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  const lang = params.lang === 'it-it' ? 'it-IT' : 'en-US'
  const locale = params.lang === 'it-it' ? 'it' : 'en'

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/${params.feed}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes

  const items: FeedItem[] = feed.items

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/illustrations.davidegiovanni.com/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error(`API Page: ${pageErr.message} ${pageErr.code}`);
  }

  const page: WebPageModel = pageRes.page

  const sections: WebSectionModel[] = page.sections

  const canonical = `https://illos.davidegiovanni.com/${params.lang}/${params.feed}`

  const loaderData: LoaderData = {
    i18n,
    page: page,
    sections: sections,
    feed: feed,
    items: items,
    canonical: canonical
  }
  return json(loaderData);
};

export default function FeedPage() {
  const { i18n, sections, feed, items } = useLoaderData<LoaderData>();
  const params = useParams()

  function getSlug (url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  return (
    <div className="overflow-y-hidden h-full flex justify-end">
      <div className="bg-white w-full lg:w-11/12">
        <div className="grid grid-cols-2 h-full bg-white overflow-y-auto">
          <div className="p-2 lg:flex flex-col items-end justify-between">
            <Link to={`/${params.lang}/works`} className="w-full">
            <p className="sr-only">
              Torna indietro
            </p>
            <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <h1 className="sr-only">
              { feed.title }
            </h1>
            { feed.description !=="" && feed.description !== undefined && 
              <div style={{ fontSize: fluidType(12, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }} className="w-full lg:w-1/2 mt-4 lg:text-right">
                { feed.description }
              </div>
            }
            <div className="hidden lg:block h-12"></div>
          </div>

          {
            items.map((i: FeedItem, index: any) => (
              <Link key={index} to={`/${params.lang}/works/${params.feed}/${getSlug(i.id)}`} className={(((index + 1) % 2 === 0) ? 'border-r border-black ' : index === 0 ? 'border-l border-black ' : '') + "block p-2"}>
                <div className="">
                <Attachment attachment={{
                      id: "",
                      mediaType: "image/",
                      url: i.image,
                      description: i.title
                    }}></Attachment>
                </div>
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  );
}