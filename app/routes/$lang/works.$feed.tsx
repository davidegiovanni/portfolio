import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import parse from 'html-react-parser'
import { fluidType, formatDate } from '~/utils/helpers'
import queryString from 'query-string'
import { ArrowLeftIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";

const i18nKeys = [] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = data.canonical

  if (data !== undefined) {
    const feed = data.feed
    title = (feed.title !== '' ? feed.title : "Pagina") + ' | Davide G. Steccanella'
    description = feed.description !== '' ? feed.description : "Le illustrazioni di Davide G. Steccanella"
    image = data.pageImage !== '' ? data.pageImage : ""
    url = data.canonical

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
  feed: Feed;
  items: FeedItem[];
  canonical: string;
  pageImage: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang
  let url = new URL(request.url)
  const host = (url.host.includes('localhost') || url.host.includes('192.168')) ? 'illos.davidegiovanni.com' : url.host

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/${params.feed}/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes

  const items: FeedItem[] = feed.items

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites//${host}/pages/works?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error(`API Page: ${pageErr.message} ${pageErr.code}`);
  }

  const pageImage: string = pageRes.page.image

  const canonical = `https:///${host}/${lang}/${params.feed}`

  const loaderData: LoaderData = {
    i18n,
    feed: feed,
    items: items,
    canonical: canonical,
    pageImage
  }
  return json(loaderData);
};

export default function FeedPage() {
  const { feed, items } = useLoaderData<LoaderData>();
  const params = useParams()

  function getSlug (url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  return (
    <div className="overflow-y-auto h-full w-full">
      <div className="px-4 py-2 h-12 flex items-center">
        <h1 className="uppercase" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 12, 300, 2400, 1.5).lineHeight }}>
          { feed.title }
        </h1>
      </div>
      <hr className="border-t border-black w-full" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 relative z-20 border-l border-black">
        {
          items.map((i: FeedItem, index: any) => (
            <NavLink key={index} to={`/${params.lang}/works/${params.feed}/${getSlug(i.id)}`} className="border-b border-r last:border-b-0 border-black">
              <Attachment size="object-cover" attachment={{
                    id: "",
                    mediaType: "image/",
                    url: i.image,
                    description: i.title
                  }}></Attachment>
            </NavLink>
          ))
        }
      </div>
      <div className="text-center border-t border-black py-4 px-4">
      { feed.description !=="" && feed.description !== undefined && 
          <div className="max-w-screen-md mx-auto" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }}>
            { feed.description }
          </div>
        }
      </div>
    </div>
  );
}