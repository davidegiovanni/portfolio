export const headersDecoder = (request: Request) => {
  return {
    websiteName: request.headers.get("Revas-Authority") || process.env.REVAS_OS_WEB_UI_WEBSITE_NAME || "01htht6y7643ty0ztaweztdgr0",
    publicKey: request.headers.get("Revas-Public-Key") || process.env.REVAS_OS_WEB_UI_PUBLIC_KEY || "01exy3y9j9pdvyzhchkpj9vc5w",
  };
};
