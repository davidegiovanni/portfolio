import { describe, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { unstable_createRemixStub as createRemixStub } from "@remix-run/testing";

import type { LoaderData } from "~/services/api/feeds/feed-item-data-loader";
import { IndexComponent } from "./route";

describe("Feed item index", async () => {
  it("should render not found error when present", async () => {
    const loaderData: LoaderData = {
      errors: {
        pageNotFound: true
      },
      error: {
        code: 0,
        message: "Error"
      }
    } as LoaderData
    const RemixStub = createRemixStub([
      {
        path: "/",
        Component: () => <IndexComponent loaderData={loaderData} />,
      },
    ]);
    render(<RemixStub initialEntries={["/"]} />);

    screen.getByText("page_not_found")
    screen.getByText("page_does_not_exist")
  })
  it("should render page error when present", async () => {
    const loaderData: LoaderData = {
      errors: {
        getPage: true
      },
      error: {
        code: 0,
        message: "Error"
      }
    } as LoaderData
    const RemixStub = createRemixStub([
      {
        path: "/",
        Component: () => <IndexComponent loaderData={loaderData} />,
      },
    ]);
    render(<RemixStub initialEntries={["/"]} />);

    screen.getByText("error_loading_page")
    screen.getByText("wait_and_retry")
  })
  it("should render feed item", async () => {
    const loaderData: LoaderData = {
      meta: {
        title: "",
        description: "",
        imageUrl: ""
      },
      openGraphData: {
        title: "",
        description: "",
        imageUrl: ""
      },
      twitterMeta: {
        title: "",
        description: "",
        imageUrl: ""
      },
      canonicalUrl: "canonicalurl",

      metadata: {},
      feedTitle: "",
      feedPath: "",
      title: "Content title",
      description: "Content description",
      attachmentUrl: "",
      attachmentMediaType: "",
      attachmentDescription: "",
      attachmentCaption: "",
      attachmentMetadata: {},
      content: "",
      publishedOn: ""
    }
    const RemixStub = createRemixStub([
      {
        path: "/",
        Component: () => <IndexComponent loaderData={loaderData} />,
      },
    ]);
    render(<RemixStub initialEntries={["/"]} />);

    screen.getByText("Content title")
    screen.getByText("Content description")
  })
})