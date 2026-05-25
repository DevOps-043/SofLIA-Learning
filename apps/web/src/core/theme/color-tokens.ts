export type HexColor = `#${string}`

type RgbTuple = readonly [red: number, green: number, blue: number]

export const DESIGN_COLOR_RGB = {
  primary: [10, 37, 64],
  primaryHover: [13, 47, 77],
  accent: [0, 212, 179],
  accentHover: [0, 184, 154],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  error: [239, 68, 68],
  info: [59, 130, 246],
  secondary: [139, 92, 246],
  bgDark: [15, 20, 25],
  bgLight: [255, 255, 255],
  gray50: [248, 250, 252],
  gray200: [233, 236, 239],
  gray500: [108, 117, 125],
  gray800: [30, 35, 41],
  gray950: [10, 13, 18],
  slate900: [15, 23, 42],
  slate800: [30, 41, 59],
  slate700: [51, 65, 85],
  muted: [136, 153, 166],
  black: [0, 0, 0],
  white: [255, 255, 255],
  blue400: [96, 165, 250],
  blue600: [37, 99, 235],
  blue800: [30, 64, 175],
  blue900: [30, 58, 138],
  amber400: [251, 191, 36],
} as const satisfies Record<string, RgbTuple>

export function rgbToHexColor(red: number, green: number, blue: number): HexColor {
  const toHexChannel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')

  return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`
}

function tokenToHexColor(token: keyof typeof DESIGN_COLOR_RGB): HexColor {
  const [red, green, blue] = DESIGN_COLOR_RGB[token]
  return rgbToHexColor(red, green, blue)
}

export const DESIGN_HEX_COLOR = {
  primary: tokenToHexColor('primary'),
  primaryHover: tokenToHexColor('primaryHover'),
  accent: tokenToHexColor('accent'),
  accentHover: tokenToHexColor('accentHover'),
  success: tokenToHexColor('success'),
  warning: tokenToHexColor('warning'),
  error: tokenToHexColor('error'),
  info: tokenToHexColor('info'),
  secondary: tokenToHexColor('secondary'),
  bgDark: tokenToHexColor('bgDark'),
  bgLight: tokenToHexColor('bgLight'),
  gray50: tokenToHexColor('gray50'),
  gray200: tokenToHexColor('gray200'),
  gray500: tokenToHexColor('gray500'),
  gray800: tokenToHexColor('gray800'),
  gray950: tokenToHexColor('gray950'),
  slate900: tokenToHexColor('slate900'),
  slate800: tokenToHexColor('slate800'),
  slate700: tokenToHexColor('slate700'),
  muted: tokenToHexColor('muted'),
  black: tokenToHexColor('black'),
  white: tokenToHexColor('white'),
  blue400: tokenToHexColor('blue400'),
  blue600: tokenToHexColor('blue600'),
  blue800: tokenToHexColor('blue800'),
  blue900: tokenToHexColor('blue900'),
  amber400: tokenToHexColor('amber400'),
} as const
