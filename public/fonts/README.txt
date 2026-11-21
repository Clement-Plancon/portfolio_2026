Newsreader (Production Type), Geist (Vercel), Instrument Sans (Rodrigo Fuenzalida, Jordan Egstad) and
Mona Sans (GitHub) are licensed under the SIL Open Font License 1.1: https://openfontlicense.org

Public site (art direction « Sommaire »):
- Newsreader: from the Fontsource package @fontsource-variable/newsreader, subset to Latin-1 and French
  punctuation. The roman keeps the wght (300-500) and opsz (14-72) axes; the italic keeps opsz only.
  Also used by the administration.
- Geist (geist.woff2): from Google Fonts (variable, wght 100-900), subset with fontTools to Latin-1, œ/Œ,
  French punctuation (– — ‘ ’ “ ” „ … • and thin spaces) and €. Layout features kept: kern, liga, calt,
  locl, mark, mkmk, case, tnum, ss01. It has no arrows: the site draws them in SVG.

Administration only: Instrument Sans (Fontsource, Latin-1). Mona Sans (mona-sans.woff2) is no longer used
by the site; it is kept so that pages cached by browsers before the redesign still find it.
