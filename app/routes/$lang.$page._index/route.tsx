import { LoaderFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { fluidType } from "~/utils/helpers";

export const loader: LoaderFunction = async () => {
    throw new Response(`Page not found`, {
        status: 404,
      });
  };

  export default function CatchAll() {
    return (
        <div></div>
    )
  }