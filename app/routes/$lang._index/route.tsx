import { json, LoaderFunction, MetaFunction, redirect, SerializeFrom } from "@remix-run/node";
import { useLoaderData, V2_MetaFunction } from "@remix-run/react";
import metadata from '~/utils/metadata'
import { makeDivDraggable } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import { useEffect, useRef, useState } from "react";
import { page, website } from "~/api";
import { Page, Website } from "~/models";
import { DynamicLinksFunction } from "~/utils/dynamic-links";

let dynamicLinks: DynamicLinksFunction<SerializeFrom<typeof loader>> = ({
  id,
  data,
  params,
  location,
  parentsData,
}) => {
  return location.pathname.endsWith(`/${params.lang}`) ? [{ rel: "canonical", href: `https://illos.davidegiovanni.com/${params.lang}` }] : [];
};
export let handle = { dynamicLinks };

export const meta: V2_MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://illos.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { meta } = data as LoaderData;
    title = (meta.title !== '' ? meta.title : "Homepage") + ' | Davide G. Steccanella'
    description = meta.description !== '' ? meta.description : "Illustrazioni di Davide Giovanni Steccanella"
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

const i18nKeys = [] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  title: string;
  description: string;
  image: string;
  meta: {
    title: string;
    description: string;
    image: string;
  };
  logoUrl: string;
  mainColor: string;
  backImage: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const incomingLocale = params.lang || ""
  const [webRes, webErr] = await website(request, params, incomingLocale);
  if (webErr !== null) {
    if (webErr.code === 5) {
      const [fullWebRes, fullWebErr] = await website(request, params, "");
      if (fullWebErr !== null) {
        throw new Response("Website: " + fullWebErr.message, {
          status: 404,
        });
      }
      return redirect(`/${fullWebRes.website.languageCode}`);
    }
    throw new Response("Website: " + webErr.message, {
      status: 404,
    });
  }
  const websiteObject: Website = webRes.website
  
  const logoUrl = websiteObject.theme.logoUrl
  const mainColor = websiteObject.theme.accentColor

  let meta = {
    title: "",
    description: "",
    image: ""
  }

  const [pageRes, pageErr] = await page("index", params)
  if (pageErr !== null) {
    throw new Response(`Page do not exist: ${pageErr.message} ${pageErr.code}`, {
      status: 404,
    });
  }

  const pageObject: Page = pageRes.page

  let title = pageObject.blocks[0].items[0].title
  let description = pageObject.blocks[0].items[0].description
  let image = pageObject.blocks[0].items[0].attachment?.url || ""

  const backImage = pageObject.blocks[2].items[0].attachment?.url || ""

  meta.title = pageObject.title
  meta.description = pageObject.description
  meta.image = pageObject.imageUrl

  const loaderData: LoaderData = {
    title, 
    description,
    image,
    meta,
    mainColor,
    logoUrl,
    backImage
  }

  return json(loaderData)
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();

  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draggableDiv = divRef.current;

    if (draggableDiv) {
      const { handleMouseDown, handleMouseMove, handleMouseUp } = makeDivDraggable(draggableDiv);

      draggableDiv.addEventListener('mousedown', handleMouseDown);
      draggableDiv.addEventListener('touchstart', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);

      return () => {
        draggableDiv.removeEventListener('mousedown', handleMouseDown);
        draggableDiv.removeEventListener('touchstart', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }

  }, []);

  return (
    <div className="h-full w-full relative flex items-center justify-center scrollbar-hidden">
      <div className="w-full max-w-2xl fade-in absolute z-20 bg-gray-100" ref={divRef}>
        <Attachment size="object-contain" attachment={{
          mediaType: "image/",
          url: loaderData.image ,
          description: "Davide Giovanni Steccanella",
          metadata: {}
        }}></Attachment>
      </div>
      {
        loaderData.backImage !== "" && (
          <div className="relative z-10 w-24 lg:w-32 fade-in">
            <img src={loaderData.backImage} alt="Davide Giovanni Steccanella" />
          </div>
        )
      }
    </div>
  );
}