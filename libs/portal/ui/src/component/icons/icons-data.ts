export const ICONS = {
  KEBAB_MENU: 'kebab-menu',
} as const;

export type Icon = (typeof ICONS)[keyof typeof ICONS];
