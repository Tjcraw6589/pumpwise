export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  /** Main buttons: ink in light mode, signal amber in dark mode. */
  primary: string;
  onPrimary: string;
  /** Brand amber, for marks and highlights. */
  accent: string;
  /** Amber dark enough to read as text on the light background. */
  accentText: string;
  accentSoft: string;
  /** Low prices. */
  cheap: string;
  cheapSoft: string;
  /** High prices. */
  pricey: string;
  priceySoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  overlay: string;
  tabBar: string;
  input: string;
  /** The forecourt price sign: always a dark panel with lit digits, in both themes. */
  sign: string;
  signBorder: string;
  signDigits: string;
  signCheap: string;
  signLabel: string;
  mapCircle: string;
  mapCircleFill: string;
}

// Pumpwise palette: forecourt at night. Warm concrete and ink, signal amber, LED green for a bargain.
export const lightColors: ThemeColors = {
  background: '#F4F1EA',
  surface: '#FFFFFF',
  surfaceAlt: '#EBE6DA',
  text: '#121B26',
  textMuted: '#5A6372',
  textFaint: '#99A0AB',
  border: '#E0D9CB',
  primary: '#121B26',
  onPrimary: '#FFFFFF',
  accent: '#FFB000',
  accentText: '#9A5B00',
  accentSoft: '#FFF0CC',
  cheap: '#0B8A4C',
  cheapSoft: '#DCF4E6',
  pricey: '#C2363A',
  priceySoft: '#FBE3E3',
  warning: '#A95A06',
  warningSoft: '#FCEBD2',
  danger: '#C2363A',
  overlay: 'rgba(18, 27, 38, 0.5)',
  tabBar: '#FFFFFF',
  input: '#FFFFFF',
  sign: '#101820',
  signBorder: '#26313D',
  signDigits: '#FFB000',
  signCheap: '#3BE38C',
  signLabel: '#8C97A4',
  mapCircle: 'rgba(18, 27, 38, 0.55)',
  mapCircleFill: 'rgba(255, 176, 0, 0.08)',
};

export const darkColors: ThemeColors = {
  background: '#0A0F15',
  surface: '#131B24',
  surfaceAlt: '#1B2530',
  text: '#F3F0E8',
  textMuted: '#A4ACB7',
  textFaint: '#6B7480',
  border: '#24303C',
  primary: '#FFB000',
  onPrimary: '#0A0F15',
  accent: '#FFB000',
  accentText: '#FFC54D',
  accentSoft: '#33270A',
  cheap: '#3BE38C',
  cheapSoft: '#0F2C1E',
  pricey: '#FF7A7A',
  priceySoft: '#3A1719',
  warning: '#FBBF24',
  warningSoft: '#33270C',
  danger: '#FF7A7A',
  overlay: 'rgba(0, 0, 0, 0.62)',
  tabBar: '#0E151D',
  input: '#17202A',
  sign: '#05090D',
  signBorder: '#1F2A35',
  signDigits: '#FFB000',
  signCheap: '#3BE38C',
  signLabel: '#7E8996',
  mapCircle: 'rgba(255, 176, 0, 0.7)',
  mapCircleFill: 'rgba(255, 176, 0, 0.08)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 } as const;

/** Barlow Condensed: road-sign lettering for prices, distances and headings. */
export const fonts = {
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
} as const;

export const typography = {
  title: { fontSize: 34, fontFamily: fonts.display, letterSpacing: 0.2, lineHeight: 38 },
  h2: { fontSize: 24, fontFamily: fonts.display, letterSpacing: 0.2, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  /** Upper-case section labels. */
  overline: { fontSize: 12, fontFamily: fonts.displaySemi, letterSpacing: 1.4, lineHeight: 16, textTransform: 'uppercase' },
  stat: { fontSize: 20, fontFamily: fonts.displaySemi, letterSpacing: 0.2, lineHeight: 24 },
  price: { fontSize: 28, fontFamily: fonts.display, letterSpacing: 0.5, lineHeight: 30 },
  priceXL: { fontSize: 64, fontFamily: fonts.display, letterSpacing: 1, lineHeight: 64 },
} as const;

export type TypographyVariant = keyof typeof typography;
