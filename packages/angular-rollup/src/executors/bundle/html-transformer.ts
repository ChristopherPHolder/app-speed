import { parse } from 'node-html-parser';

export function replaceChunkPreLoaders(html: string, oldChunks: string[], newChunks: string[] = []): string {
  const htmlParser = parse(html);
  htmlParser.querySelectorAll('link[rel="modulepreload"]').filter((el) => {
    const href = el.getAttribute('href');
    return href && oldChunks.includes(href)
  }).forEach((el, index) => {
    if (index === 0) {
      // @TODO FEAT -> Add new preload link tags
    }
    // @TODO FIX BUG -> seems to be leaving comas after removing items
    el.remove();
  });
  return htmlParser.toString();
}
