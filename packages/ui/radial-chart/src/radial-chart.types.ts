export const RADIAL_CHART_SIZE = {
  SMALL: 'sm',
  MEDIUM: 'md',
  LARGE: 'lg',
} as const;

export type RadialChartSize = typeof RADIAL_CHART_SIZE[keyof typeof RADIAL_CHART_SIZE];

export const RADIAL_CHART_COLOR = {
  GREEN: 'green',
  ORANGE: 'orange',
  RED: 'red'
} as const;

export type RadialChartColor = typeof RADIAL_CHART_COLOR[keyof typeof RADIAL_CHART_COLOR];
