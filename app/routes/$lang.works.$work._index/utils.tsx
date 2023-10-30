type ExtractedGroups = [string, string[]];

function extractImagesFromContent(htmlString: string): string[] {
  const div = document.createElement('div');
  div.innerHTML = htmlString;

  const imageTags: HTMLImageElement[] = [];

  const allTags: NodeListOf<Element> = div.querySelectorAll('*');

  allTags.forEach((tag) => {
    if (tag.tagName.toLowerCase() === "img") imageTags.push(tag as HTMLImageElement)
  });

  if (imageTags.length > 0) {
    let imagesSrc: string[] = []
    imageTags.forEach(img => imagesSrc.push(img.src))
    return imagesSrc
  }

  return []
}

function getContentWithoutImages(htmlString: string): string {
  const div = document.createElement('div');
  div.innerHTML = htmlString;

  const tags: Element[] = [];
  const allTags: NodeListOf<Element> = div.querySelectorAll('p');

  allTags.forEach((tag) => {
    if (tag.querySelectorAll("img").length === 0) tags.push(tag)
  });
  const tagsString = tags.map(tag => `${tag.outerHTML}`).join('\n');
  return tagsString
}

function applyClassesToTags(div: HTMLDivElement): void {
  if (!div) return;

  const pTags = div.querySelectorAll('p');
  pTags.forEach((pTag) => {
    const hasImg = pTag.querySelector('img');
    const hasBlockquote = pTag.querySelector('blockquote');
    const isListItem = pTag.matches('li *');
    if (hasImg) {
      pTag.classList.add('page-content--image__base-size');
    } else if (hasBlockquote) {
      pTag.classList.add('page-content--blockquote__base-size');
    }  else {
      if (!isListItem) pTag.classList.add('page-content--p__base-size');
    }
  });

  const uListTags = div.querySelectorAll('ul');
  uListTags.forEach(tag => {
    tag.classList.add('page-content--ulist__base-size');
  })

  const oListTags = div.querySelectorAll('ol');
  oListTags.forEach(tag => {
    tag.classList.add('page-content--olist__base-size');
  })


  const allTags = div.querySelectorAll('*');
  allTags.forEach((tag) => {
    if(isHeadingTag(tag)) {
      tag.classList.add('page-content--title__base-size');
    }
  })

  const blockquoteTags = div.querySelectorAll('blockquote');
  blockquoteTags.forEach((blockquoteTag) => {
    blockquoteTag.classList.add('page-content--blockquote__base-size');
  });
}

function isHeadingTag(element: Element) {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6';
}

export {
  extractImagesFromContent,
  getContentWithoutImages,
  applyClassesToTags
}