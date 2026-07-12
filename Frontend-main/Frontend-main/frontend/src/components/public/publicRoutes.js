// Routes whose first section is a dark mesh hero — the fixed navbar may sit
// transparent on top of these. Everything else gets the solid navbar plus a
// top offset so content isn't hidden behind the fixed bar.
const DARK_HERO_PATHS = [
  /^\/$/,
  /^\/people\/?$/,
  /^\/chairman\/?$/,
  /^\/admission-hub\/?$/,
  /^\/curriculum\/?$/,
  /^\/apply\/?$/,
  /^\/notice-board\/?$/,
  /^\/meetings\/?$/,
];

export function hasDarkHero(pathname) {
  return DARK_HERO_PATHS.some((re) => re.test(pathname));
}
