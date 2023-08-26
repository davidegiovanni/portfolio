import { json, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, useLoaderData, useParams, V2_MetaFunction } from "@remix-run/react";
 
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon, ChevronLeftIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";
import { feed } from "~/api";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { Feed, FeedItem } from "~/models";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}/about` }];
};
export let handle = { dynamicLinks };

export const meta: V2_MetaFunction = ({ data, location }) => {
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
      <div className="h-full w-full overflow-y-scroll lg:scrollbar-hidden uppercase">
        <div className="w-full h-full lg:flex items-stretch">
          <div className="relative w-full aspect-square md:aspect-[4/2] lg:h-full lg:w-1/2 ">
            <div className="relative h-full w-full overflow-hidden">
              <Attachment size="object-cover" attachment={{
                  mediaType: "image/",
                  url: loaderData.image,
                  description: "Davide Giovanni Steccanella",
                  metadata: {}
                }}></Attachment>
            </div>
          </div>
          <div className="w-full lg:w-1/2 lg:overflow-y-auto pb-4 flex flex-col items-stretch justify-start gap-4">
            <div className="p-4 text-center">
              <h1 className="w-full uppercase font-semibold mb-2 max-w-sm mx-auto" >
                  {loaderData.title}
                </h1>
                <h2 className="mb-2 max-w-lg mx-auto">
                  {loaderData.description}
                </h2>
            </div>
            <p className="text-center text-2xl">
            ✏︎ ✳︎ ✏︎
            </p>
            { loaderData.html !== "" && loaderData.html !== undefined &&
                <article className="p-4 lg:p-8 block prose-sm prose-a:underline prose-a:underline-offset-2 text-justify mx-auto">
                {parse(loaderData.html)}
              </article>
              }
          </div>
        </div>
      </div>  
    )
}