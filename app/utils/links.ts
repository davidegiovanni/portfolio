export default ({ canonical, alternate } : { canonical:string, alternate:string }) => {
    const links: any = [
      {
        rel: 'canonical',
        href: canonical,
      },
      {
        rel: 'alternate',
        href: alternate,
      }
    ]
    return links
}