import type { LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useMatches, useParams } from "@remix-run/react";
import { loadTranslations, locales } from "~/helpers/i18n";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://holydavid.art/it-it',
      alternate: 'https://holydavid.art/en-en'
    }
  )
};

export const meta: MetaFunction = ({ data, location }) => {
  const title = data.i18n.shared.translate
  const description = 'Select website language'
  const url = 'https://holydavid.art' + location.pathname

  return metadata(
    {
      title: title,
      description: description,
      image: 'https://cdn.revas.app/v0/01f9ekbw2n7m4sfc4xhtftyarv/01fv5pkdatk6nkxdmkhprnwxpz/01fv89a184detgp575h5zenqvq/holy-david-full-logo-png.png',
      url: url,
      robots: 'follow',
      type: 'website',
    }
  )
};

type LoaderData = {
  i18n: Record<I18nKeys, any>;
};

export const loader: LoaderFunction = async ({request, params}) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  return {
    i18n: i18n
  };
};

export default function Index() {
  const { i18n } = useLoaderData<LoaderData>();
  const matches = useMatches();
  const params = useParams()

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <nav className="w-full flex-1 flex items-center justify-center p-4">
        <div>
          <h2 className="font-display uppercase text-center" style={{ fontSize: fluidType(32, 120, 300, 2400, 1.5).fontSize, lineHeight: fluidType(24, 100, 300, 2400, 1.5).lineHeight }}>
            {i18n.shared.translate}
          </h2>
          <div className="flex items-center justify-center">
            <div>
              <a
                className={params.lang === 'en-us' ? "inline-block line-through px-4 py-2" : "inline-block hover:line-through px-4 py-2"}
                onClick={(event) => {
                  event.preventDefault();
                  window.sessionStorage.setItem(
                    "locale-recommendation-hidden",
                    "1"
                  );
                  window.location.href = '/en-us';
                }}
                key='en-us'
                href='/en-us'
                aria-current={params.lang === 'en-us' ? "page" : "false"}
                style={{ fontSize: fluidType(16, 12, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}
              >
                English
              </a>
              <a
                className={params.lang === 'it-it' ? "inline-block line-through px-4 py-2" : "inline-block hover:line-through px-4 py-2"}
                onClick={(event) => {
                  event.preventDefault();
                  window.sessionStorage.setItem(
                    "locale-recommendation-hidden",
                    "1"
                  );
                  window.location.href = '/it-it';
                }}
                key='it-it'
                href='/it-it'
                aria-current={params.lang === 'it-it' ? "page" : "false"}
                style={{ fontSize: fluidType(16, 12, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}
              >
                Italiano
              </a>
            </div>
          </div>
        </div>
      </nav>
      <Link to={`/${params.lang}/`} className="lg:flex-1">
        <div className="bg-red-600 h-full flex flex-col items-center justify-end pt-8 group">
          <p className="transform lg:translate-y-8 group-hover:underline" style={{ fontSize: fluidType(16, 12, 300, 2400, 1.5).fontSize, lineHeight: fluidType(12, 16, 300, 2400, 1.5).lineHeight }}>
            {i18n.shared.back}
          </p>
          <img className="transform translate-y-1/3 w-full max-w-screen-lg h-auto object-cover" src="/holy-david.svg" alt="" />
        </div>
      </Link>
    </div>
  );
}