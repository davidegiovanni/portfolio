import { json, LinksFunction, LoaderFunction, MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import { fluidType, getSlug, isExternalLink, makeDivDraggable, reduceOpacityOnHover, scatterDivsRandomly } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { feed, page } from "~/api";
import { Page, Feed } from "~/models";
import { ChevronLeftIcon } from "@heroicons/react/outline";
import { DynamicLinksFunction } from "~/utils/dynamic-links";
import { useEffect, useRef } from "react";

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

  // const draggableDivRefs = useRef(Array(loaderData.works.length).fill(null));

  useEffect(() => {
    scatterDivsRandomly("scattered")

    // draggableDivRefs.current.forEach((ref) => {
    //   if (ref) {
    //     makeDivDraggable(ref);
    //   }
    // });

    //nel div: ref={(ref) => (draggableDivRefs.current[index] = ref)}
  }, [])

  return (
    <div className="h-full w-full flex flex-col bg-white gap-4 overflow-y-auto relative text-center py-1 scrollbar-hidden">
        <h1 className="sr-only">
          {loaderData.title}
        </h1>
        {
          loaderData.description !== "" &&
          <h2>
            {loaderData.description}
          </h2>
        }
        {
          loaderData.image !== "" &&
          <div className="w-full aspect-[5/2]">
            <Attachment size="object-contain" attachment={{
              id: "",
              mediaType: "image/",
              url: loaderData.image,
              description: loaderData.title
            }}></Attachment>
          </div>
        }
        <div id="scattered">
          {
            loaderData.works.map((i, index: any) => (
              <div key={index} id={`id-${index}`}  className="absolute hover:z-[90] hover:scale-110 hover:shadow-2xl transition-transform ease-in-out duration-300">
                <NavLink to={`${i.slug}`} className="aspect-square overflow-hidden">
                  <div className="w-32 mx-auto">
                    <Attachment size="object-contain" attachment={{
                      id: "",
                      mediaType: "image/",
                      url: i.image,
                      description: i.slug
                    }}></Attachment>
                  </div>
                </NavLink>
              </div>
            ))
          }
        </div>
    </div>
  );
}
