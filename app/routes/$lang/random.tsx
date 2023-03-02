import { json, LinksFunction, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import { fluidType, getSlug, isExternalLink } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { feed, page } from "~/api";
import { Page, Feed } from "~/models";
import { ChevronLeftIcon } from "@heroicons/react/outline";
import { DynamicLinksFunction } from "remix-utils";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}/random` }];
};
export let handle = { dynamicLinks };

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

type UILink = {
  title: string;
  url: string;
  isExternal: boolean;
}

type LoaderData = {
  title: string,
  description: string,
  image: string,
  sections: {
    title: string,
    description: string,
    image: string;
    link: UILink;
    slug: string;
  }[];
  works: {
    image: string;
    slug: string;
  }[];
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

  let sections: {
    title: string,
    description: string,
    image: string;
    link: UILink;
    slug: string;
  }[] = []

  let works: {
    image: string;
    slug: string;
  }[] = []

  const [pageRes, pageErr] = await page("random", params)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const pageObject: Page = pageRes.page

  let title = pageObject.blocks.length > 0 ? pageObject.blocks[0].items[0].title : ""
  let description = pageObject.blocks.length > 0 ?  pageObject.blocks[0].items[0].description : ""
  let image = pageObject.blocks.length > 0 
    ? pageObject.blocks[0].items[0].attachment 
      ? pageObject.blocks[0].items[0].attachment?.url
      : "" 
    : ""

  sections = pageObject.blocks.length > 1 
    ? pageObject.blocks.slice(1).map(b =>{
      return {
        title: b.items[0].title,
        description: b.items[0].description,
        image: b.items[0].attachment
          ? b.items[0].attachment?.url 
          : "",
        link: {
          title: b.items[0].link?.title as string,
          url: b.items[0].link?.url as string,
          isExternal: isExternalLink(b.items[0].link?.url as string)
        },
        slug: b.items[0].description
      }
    })
    : []

  meta.title = pageObject.title
  meta.description = pageObject.description
  meta.image = pageObject.imageUrl

  const feedName = "random";

  const [feedRes, feedErr] = await feed(feedName, params)
  if (feedErr !== null) {
    throw new Response(`Feed do not exist: ${feedErr.message} ${feedErr.code}`, {
      status: 404,
    });
  }

  const feedObject: Feed = feedRes

  works = feedObject.items.map((i, index) => {
    return {
      image: i.image || "",
      slug: `/${params.lang}/works/random/${getSlug(i.id)}`
    }
  })

  const loaderData: LoaderData = {
    title,
    description,
    image,
    sections,
    works,
    meta
  }
  return json(loaderData);
};

export default function FeedPage() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-2 py-2 h-12 flex items-center border-b border-black flex-none">
        <Link to={`/${params.lang}`}>
          <p style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }} className="uppercase bg-white border border-black group-hover:underline rounded-md pr-4 pl-2 py-1.5 inline-flex items-center lg:w-fit mx-auto mr-2">
            <span>
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
            </span>
            Homepage
          </p>
        </Link>
        <h1 className="uppercase" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 12, 300, 2400, 1.5).lineHeight }}>
          {loaderData.title}
        </h1>
      </div>
      <div className="overflow-y-auto flex-1 fade-slide-in">
        {
          loaderData.description !== "" &&
          <div className="text-center py-4 px-4 border-b border-black">
            <div className="max-w-screen-md mx-auto" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }}>
              {loaderData.description}
            </div>
          </div>
        }
        {
          loaderData.image !== "" &&
          <div className="w-full aspect-[5/2] border-b border-black">
            <Attachment size="object-cover" attachment={{
              id: "",
              mediaType: "image/",
              url: loaderData.image,
              description: loaderData.title
            }}></Attachment>
          </div>
        }
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 relative z-20 border-l border-black fade-slide-in">
          {
            loaderData.works.map((i, index: any) => (
              <NavLink key={index} to={`${i.slug}`} className="border-b border-r last:border-b-0 border-black lg:grayscale lg:hover:grayscale-0 aspect-square p-2 lg:p-4">
                <Attachment size="object-contain" attachment={{
                  id: "",
                  mediaType: "image/",
                  url: i.image,
                  description: i.slug
                }}></Attachment>
              </NavLink>
            ))
          }
        </div>
        {
          loaderData.sections.length > 0 && loaderData.sections.map(s => (
            <div className="border-t border-black py-4 px-4">
            {
              s.description !== "" &&
              <div className="text-center pb-4">
                <div className="max-w-screen-md mx-auto" style={{ fontSize: fluidType(16, 20, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }}>
                  {s.description}
                </div>
              </div>
            }
            {
              s.image !== "" &&
              <div className="w-full aspect-[5/2] border-y border-black">
                <Attachment size="object-cover" attachment={{
                  id: "",
                  mediaType: "image/",
                  url: s.image,
                  description: s.title
                }}></Attachment>
              </div>
            }
            {
               s.link.title !== "" && (
                  <div>
                    <div className="bg-white border border-black hover:underline rounded-md px-4 py-2 uppercase w-fit mx-auto block">
                    {
                      s.link.isExternal ? (
                        <a href={s.link.url} >
                          {s.link.title}
                        </a>
                      ) : (
                        <Link to={s.link.url} >
                          {s.link.title}
                        </Link>
                      )
                    }
                    </div>
                  </div>
                )
              }
            </div>
          ))
        }
      </div>
    </div>
  );
}
