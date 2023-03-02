import queryString from 'query-string'

const fluidType = (minType: number, maxType: number, minScreen: number, maxScreen: number, lineHeightMultiplier: number) => {
  // 32px + (96 - 32) * ((100vw - 300px) / (2400 - 300))
  const fontSize = `calc(${minType}px + (${maxType} - ${minType}) * ((100vw - ${minScreen}px) / (${maxScreen} - ${minScreen})))`
  const lineHeight = `calc((${minType}px + (${maxType} - ${minType}) * ((100vw - ${minScreen}px) / (${maxScreen} - ${minScreen}))) * ${lineHeightMultiplier})`
  return {
    fontSize,
    lineHeight
  }
}

function getSlug (url: string): string {
  const parsed = queryString.parse(url)
  return parsed.content as string
}

const formatDate = (date: any, locale: string, short?: string) => {
  if (short) {
    return new Date(date).toLocaleString(locale, { 'month': 'numeric', 'year': 'numeric' })
  }
  return new Date(date).toLocaleString(locale, { 'month': 'long', 'day': '2-digit', 'year': 'numeric' })
}

const isExternalLink = (url: string) => {
  const EXTERNAL_URL_RE = /^[a-z]+:/i;
  return EXTERNAL_URL_RE.test(url)
}

export {
  fluidType,
  formatDate,
  isExternalLink,
  getSlug
}