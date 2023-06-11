import { json, LinksFunction, LoaderFunction, MetaFunction, redirect, SerializeFrom } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import { fluidType, getSlug, isExternalLink } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { feed, page } from "~/api";
import { Page, Feed } from "~/models";
import { ChevronLeftIcon } from "@heroicons/react/outline";
import { DynamicLinksFunction } from "~/utils/dynamic-links";

// create the dynamicLinks function with the correct type
// note: loader type is optional
let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}/works/${params.feed}` }];
};

// and export it through the handle, you could also create it inline here
// if you don't care about the type
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
  link: {
    title: string;
    url: string;
    isExternal: boolean;
  } | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (params.feed === "random") {
    return redirect(`/${params.lang}/random`)
  }

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

  const [pageRes, pageErr] = await page(params.feed as string, params)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const pageObject: Page = pageRes.page

  let title = pageObject.blocks.length > 0 ? pageObject.blocks[0].items[0].title : ""
  let description = pageObject.blocks.length > 0 ? pageObject.blocks[0].items[0].description : ""
  let image = pageObject.blocks.length > 0
    ? pageObject.blocks[0].items[0].attachment
      ? pageObject.blocks[0].items[0].attachment?.url
      : ""
    : ""

  let link = (pageObject.blocks.length > 0 && pageObject.blocks[0].items[0].link) ? {
    title: pageObject.blocks[0].items[0].link?.title as string,
    url: pageObject.blocks[0].items[0].link?.url as string,
    isExternal: isExternalLink(pageObject.blocks[0].items[0].link?.url as string)
  } : null

  sections = pageObject.blocks.length > 1
    ? pageObject.blocks.slice(1).map(b => {
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

  const feedName = params.feed || "";

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
      slug: `/${incomingLocale}/works/${params.feed}/${getSlug(i.id)}`
    }
  })

  const loaderData: LoaderData = {
    title,
    description,
    image,
    sections,
    works,
    meta,
    link
  }
  return json(loaderData);
};

export default function FeedPage() {
  const loaderData = useLoaderData<LoaderData>();
  const params = useParams()

  return (
    <div className="h-full w-full overflow-y-auto text-center uppercase scrollbar-hidden flex flex-col gap-4">
      <Link to={`/${params.lang}/works`} className="absolute top-0 left-0 z-20 m-2">
        <p className="sr-only">
          Close
        </p>
          ✕
        </Link>
      <h1 className="font-semibold pt-4">
        {loaderData.title}
      </h1>
      {
        loaderData.description !== "" &&
        <h2 className="max-w-prose mx-auto">
          {loaderData.description}
        </h2>
      }
      {
        loaderData.link !== null && (
          <div className="inline-block text-[blue]">
            {
              loaderData.link.isExternal ? (
                <a href={loaderData.link.url} >
                  {loaderData.link.title}
                </a>
              ) : (
                <Link to={loaderData.link.url} >
                  {loaderData.link.title}
                </Link>
              )
            }
          </div>
        )
      }
      <div className="w-full h-full mx-auto">
        {
          loaderData.works.map((i, index: any) => (
            <NavLink key={index} to={`${i.slug}`} className={'block aspect-video'}>
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
    </div>
  );
}
