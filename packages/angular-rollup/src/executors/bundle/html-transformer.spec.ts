import { replaceChunkPreLoaders } from './html-transformer';
import { parse } from 'node-html-parser';

const OLD_CHUNKS = [
  'chunk-V52KIRWY.js',
  'chunk-YJ3CASID.js',
  'chunk-KVV53JO6.js'
];

const mockHTML = `
<!DOCTYPE html>
<html lang='en' data-critters-container>
  <head>
    <title>Mock index.html</title>
    <link rel='stylesheet' href='styles-BRCTWJ5D.css' media='print' onload="this.media='all'">
    <noscript><link rel='stylesheet' href='styles-BRCTWJ5D.css'></noscript>
    ${OLD_CHUNKS.map((chunk) => `<link rel='modulepreload' href='${chunk}'>`)}
  </head>
  <body>
    <app-root></app-root>
    <script src='polyfills-RT5I6R6G.js' type='module'></script>
    <script src='main-RGZBXGLS.js' type='module'></script>
  </body>
</html>
`;

describe('replaceChunkPreLoaders', () => {

  it('should return a valid html sting', () => {
    const result = replaceChunkPreLoaders(mockHTML, []);
    expect(() => parse(result)).not.toThrow();
  });

  it('should remove old chunk preload tags', () => {
    const result = replaceChunkPreLoaders(mockHTML, OLD_CHUNKS);
    OLD_CHUNKS.forEach((chunk) => expect(result).not.toContain(chunk));
  });

  // @TODO
  it.skip('should replace module preloader link tags', () => {
    const NEW_CHUNKS = ['chunks-new.js', 'vendor-X.js'];
    const result = replaceChunkPreLoaders(mockHTML, OLD_CHUNKS, NEW_CHUNKS);
    OLD_CHUNKS.forEach((chunk) => expect(result).not.toContain(chunk));
    NEW_CHUNKS.forEach((chunk) => expect(result).toContain(chunk));
  });
})
