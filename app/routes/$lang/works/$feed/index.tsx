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

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const page = data.page
    title = (page.title !== '' ? page.title : "Pagina") + ' | Davide G. Steccanella'
    description = page.description !== '' ? page.description : "Le illustrazioni di Davide G. Steccanella"
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
    throw new Error(`${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes

  const items: FeedItem[] = feed.items

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/holydavid.art/pages/newsroom?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error("Website didn't load correctly");
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
      <div className="bg-white w-full lg:w-2/3">
        {/* { feed.description !=="" && feed.description !== undefined && 
          <div style={{ fontSize: fluidType(12, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(8, 16, 300, 2400, 1.5).lineHeight }} className="w-1/2 mb-4 lg:mb-16">
            { feed.description }
          </div>
        } */}
        <div className="grid grid-cols-2 h-full bg-white overflow-y-auto">
          <div className="p-2">
            <Link to={`/${params.lang}/works`}>
            <p className="sr-only">
              Torna indietro
            </p>
            <ArrowLeftIcon className="w-6 h-6" />
            </Link>
          </div>
          {
            items.map((i: FeedItem, index: any) => (
              <Link to={`/${params.lang}/works/${params.feed}/${getSlug(i.id)}`} className={((index + 1) % 2 !== 0 ? 'border-l border-black ' : '') + "block p-2"}>
                <div className="">
                  <img src={i.image} alt="" />
                </div>
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  );
}