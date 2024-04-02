export function removeTrailingMdUrl(text: string): string {
  return text.split('[')[0];
}

export type Reference = { link: string; text: string; };

export function extractTrailingMdUrl(text: string): Reference {
  const value = text.split(/\[(.*?)\]\((.*?)\)/);
  return { text: value[1] + '.', link: value[0] };
}

