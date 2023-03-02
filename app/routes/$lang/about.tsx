import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon, ChevronLeftIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";
import { feed } from "~/api";

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { meta } = data as LoaderData;
    title = (meta.title !== '' ? meta.title : "Contatti") + ' | Davide G. Steccanella'
    description = meta.description !== '' ? meta.description : "Contatta Davide Giovanni Steccanella per le sue illustrazioni"
    image = meta.image !== '' ? meta.image : ''
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

type LoaderData = {
  title: string;
  description: string;
  image: string;
  html: string;
  meta: {
    title: string;
    description: string;
    image: string;
  };
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""
  let meta = {
    title: "",
    description: "",
    image: ""
  }

  const [feedRes, feedErr] = await feed("about", params)
  if (feedErr !== null) {
    throw new Response(`Feed do not exist: ${feedErr.message} ${feedErr.code}`, {
      status: 404,
    });
  }

  const feedObject: Feed = feedRes
  const slug = 'about'
  let foundNews = feedObject.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundNews === undefined) {
    throw new Response(`Page do not exist`, {
      status: 404,
    });
  }
  const item: FeedItem = foundNews

  let title = item.title
  let description = item.summary
  let image = item.image
  let date = formatDate(item.date_published, params.lang as string, 'short')
  let html = item.content_html

  meta.title = title
  meta.description = description
  meta.image = image

  const loaderData: LoaderData = {
    title,
    description,
    image,
    html,
    meta
  }

  return json(loaderData);
};

export default function About() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()

    return (
      <div className="h-full w-full overflow-y-auto lg:overflow-y-hidden fade-slide-in">
        <div className="w-full h-full lg:flex items-stretch">
          <div className="relative w-full aspect-video md:aspect-[4/2] lg:h-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-black">
          <Link to={`/${params.lang}`}>
            <p style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }} className="uppercase bg-white border border-black group-hover:underline rounded-md pr-4 pl-2 py-2 inline-flex items-center w-fit absolute m-2 z-20">
              <span>
                <ChevronLeftIcon className="h-4 w-4 mr-2"   />
              </span>
              Homepage
            </p>
          </Link>
            <Attachment size="object-cover" attachment={{
                id: "1",
                mediaType: "image/",
                url: loaderData.image,
                description: "Davide Giovanni Steccanella"
              }}></Attachment>
          </div>
          <div className="w-full lg:w-1/2 lg:overflow-y-auto fade-slide-in">
            <div className="p-4 border-b border-black mb-2">
              <h1 style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }} className="w-full uppercase font-bold mb-2" >
                  {loaderData.title}
                </h1>
                <h2 style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }} className="mb-2">
                  {loaderData.description}
                </h2>
            </div>
            { loaderData.html !== "" && loaderData.html !== undefined &&
                <article className="p-4 block prose max-w-none text-black prose-a:text-[blue] prose-a:underline-offset-4 prose-blockquote:bg-gray-100 prose-blockquote:p-8 prose-blockquote:border-0 prose-blockquote:prose-p:first-of-type:before:opacity-0 prose-a:visited:text-[purple] prose-li:marker:text-[black]">
                {parse(loaderData.html)}
              </article>
              }
          </div>
        </div>
      </div>  
    )
}