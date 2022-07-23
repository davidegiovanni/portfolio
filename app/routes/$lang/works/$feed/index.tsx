import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType, formatDate } from '~/utils/helpers'
import queryString from 'query-string'

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://holydavid.art/it-it/newsroom',
      alternate: 'https://holydavid.art/en-us/newsroom'
    }
  )
};

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = 'https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png'
  let url = 'https://holydavid.art' + location.pathname

  if (data !== undefined) {
    const page = data.page
    title = (page.title !== '' ? page.title : "Newsroom") + ' | Holy David'
    description = page.description !== '' ? page.description : "Holy David art website where you can fin news, info and more"
    image = page.image !== '' ? page.image : "https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png"
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

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  sections: WebSectionModel[];
  feed: Feed;
  items: FeedItem[];
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

  const loaderData: LoaderData = {
    i18n,
    page: page,
    sections: sections,
    feed: feed,
    items: items
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
    <div>
      <h1 className="font-display uppercase" style={{ fontSize: fluidType(32, 100, 300, 2400, 1.5).fontSize, lineHeight: fluidType(24, 80, 300, 2400, 1.5).lineHeight }}>{feed.title}</h1>
      <div className="columns-3 gap-2">
        {
          items.map((i: FeedItem, index: any) => (
            <Link to={`/${params.lang}/works/${params.feed}/${getSlug(i.id)}`} className="block">
              <div className="mb-2">
                <img src={i.image} alt="" />
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="w-full h-full p-2">
      <div className="error-message">
        <div className="inner-container">
          <div className="card">
            <div className="p-8 column">
              <div className="item">
                <h1 className="inline-block text-sm font-medium text-red-600 bg-red-100 rounded-full px-2 py-0.5">Errore</h1>
              </div>
              <p className="item">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}