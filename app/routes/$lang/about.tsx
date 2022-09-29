import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";

const i18nKeys = [] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = 'https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png'
  let url = 'https://illos.davidegiovanni.com' + location.pathname
  
  if (data !== undefined) {
    const page = data.item
    title = (page.title !== '' ? page.title : "About") + ' | Davide G. Steccanella'
    description = page.summary !== '' ? page.summary : "Il CV e altre informazioni sull'illustratore Davide G. Steccanella"
    image = page.image !== '' ? page.image : "https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png"
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
  canonical: string;
  item: FeedItem;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/about/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes
  const slug = 'about'
  let foundNews = feed.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundNews === undefined) {
    throw new Error("News undefined");
  }
  const item: FeedItem = foundNews

  const canonical = `https://illos.davidegiovanni.com/${params.lang}/${params.feed}/${params.item}`

  const loaderData: LoaderData = {
    i18n,
    canonical: canonical,
    item: item as FeedItem
  }

  return json(loaderData);
};

export default function About() {
  const { i18n, item, canonical } = useLoaderData<LoaderData>();
  const params = useParams()

    return (
      <div className="h-full w-full overflow-y-auto lg:overflow-y-hidden">
        <div className="w-full h-full lg:flex items-stretch">
          <div className="w-full aspect-video md:aspect-[4/2] lg:h-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-black">
            <Attachment size="object-cover" attachment={{
                id: "",
                mediaType: "image/",
                url: item.image,
                description: ""
              }}></Attachment>
          </div>
          <div className="w-full lg:w-1/2 lg:overflow-y-auto">
            <div className="p-4 border-b border-black mb-2">
              <h1 style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }} className="w-full uppercase font-bold mb-2" >
                  {item.title}
                </h1>
                <h2 style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }} className="mb-2">
                  {item.summary}
                </h2>
            </div>
            { item.content_html !== "" && item.content_html !== undefined &&
                <article className="p-4 block prose max-w-none text-black prose-a:text-[blue] prose-a:underline-offset-4 prose-blockquote:bg-gray-100 prose-blockquote:p-8 prose-blockquote:border-0 prose-blockquote:prose-p:first-of-type:before:opacity-0 prose-a:visited:text-[purple] prose-li:marker:text-[black]">
                {parse(item.content_html)}
              </article>
              }
          </div>
        </div>
      </div>  
    )
}