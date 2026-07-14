const englishToUkrainianPairs: [string, string][] = [
  ["shch", "щ"],
  ["yo", "йо"],
  ["ye", "є"],
  ["yi", "ї"],
  ["yu", "ю"],
  ["ya", "я"],
  ["zh", "ж"],
  ["kh", "х"],
  ["ts", "ц"],
  ["ch", "ч"],
  ["sh", "ш"],
  ["a", "а"],
  ["b", "б"],
  ["v", "в"],
  ["h", "г"],
  ["g", "ґ"],
  ["d", "д"],
  ["e", "е"],
  ["z", "з"],
  ["y", "и"],
  ["i", "і"],
  ["j", "й"],
  ["k", "к"],
  ["l", "л"],
  ["m", "м"],
  ["n", "н"],
  ["o", "о"],
  ["p", "п"],
  ["r", "р"],
  ["s", "с"],
  ["t", "т"],
  ["u", "у"],
  ["f", "ф"],
  ["c", "к"],
  ["q", "к"],
  ["w", "в"],
  ["x", "кс"],
];

const ukrainianToEnglishPairs: [string, string][] = [
  ["щ", "shch"],
  ["є", "ye"],
  ["ї", "yi"],
  ["ю", "yu"],
  ["я", "ya"],
  ["ж", "zh"],
  ["х", "kh"],
  ["ц", "ts"],
  ["ч", "ch"],
  ["ш", "sh"],
  ["а", "a"],
  ["б", "b"],
  ["в", "v"],
  ["г", "h"],
  ["ґ", "g"],
  ["д", "d"],
  ["е", "e"],
  ["ё", "e"],
  ["з", "z"],
  ["и", "y"],
  ["і", "i"],
  ["ї", "i"],
  ["й", "i"],
  ["к", "k"],
  ["л", "l"],
  ["м", "m"],
  ["н", "n"],
  ["о", "o"],
  ["п", "p"],
  ["р", "r"],
  ["с", "s"],
  ["т", "t"],
  ["у", "u"],
  ["ф", "f"],
  ["ь", ""],
];

const englishToKeyboardUkrainian: Record<string, string> = {
  q: "й",
  w: "ц",
  e: "у",
  r: "к",
  t: "е",
  y: "н",
  u: "г",
  i: "ш",
  o: "щ",
  p: "з",
  "[": "х",
  "]": "ї",
  a: "ф",
  s: "і",
  d: "в",
  f: "а",
  g: "п",
  h: "р",
  j: "о",
  k: "л",
  l: "д",
  ";": "ж",
  "'": "є",
  z: "я",
  x: "ч",
  c: "с",
  v: "м",
  b: "и",
  n: "т",
  m: "ь",
  ",": "б",
  ".": "ю",
};

const ukrainianToKeyboardEnglish: Record<string, string> = Object.fromEntries(
  Object.entries(englishToKeyboardUkrainian).map(([english, ukrainian]) => [
    ukrainian,
    english,
  ])
);

const brandPronunciationAliases: Record<string, string[]> = {
  comfy: ["комфі", "комфи", "komfi"],
  rozetka: ["розетка", "розетка юа"],
  allo: ["алло", "ало"],
  eva: ["ева"],
  kfc: ["кфс"],
  mcdonalds: ["макдональдс", "мак", "макдоналдс"],
  bolt: ["болт"],
  uklon: ["уклон", "юклóн", "юклОн"],
  glovo: ["глово"],
  makeup: ["мейкап", "мейк ап"],
  foxtrot: ["фокстрот"],
  citrus: ["цитрус"],
  eldorado: ["ельдорадо"],
  epicentr: ["епіцентр", "эпицентр"],
  intertop: ["інтертоп", "интертоп"],
  answear: ["ансвер"],
  modivo: ["модіво", "модиво"],
};

export function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/ґ/g, "г")
    .replace(/[’'ʼ`]/g, "")
    .replace(/\s+/g, " ");
}

export function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/[^a-z0-9а-яіїєег]/gi, "");
}

export function splitSearchTokens(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function slugify(value: string) {
  const normalized = normalizeSearchText(value)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9а-яіїєег]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  const transliterated = transliterateUkrainianToEnglish(normalized)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return transliterated || "store";
}

export function transliterateEnglishToUkrainian(value: string) {
  let result = normalizeSearchText(value);

  for (const [english, ukrainian] of englishToUkrainianPairs) {
    result = result.replaceAll(english, ukrainian);
  }

  return normalizeSearchText(result);
}

export function transliterateUkrainianToEnglish(value: string) {
  let result = normalizeSearchText(value);

  for (const [ukrainian, english] of ukrainianToEnglishPairs) {
    result = result.replaceAll(ukrainian, english);
  }

  return normalizeSearchText(result);
}

export function convertEnglishKeyboardToUkrainian(value: string) {
  return normalizeSearchText(value)
    .split("")
    .map((character) => englishToKeyboardUkrainian[character] || character)
    .join("");
}

export function convertUkrainianKeyboardToEnglish(value: string) {
  return normalizeSearchText(value)
    .split("")
    .map((character) => ukrainianToKeyboardEnglish[character] || character)
    .join("");
}

export function getHostName(url: string | null | undefined) {
  if (!url) return null;

  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    return new URL(normalizedUrl).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function normalizeUrl(url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) return "";

  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function addAlias(set: Set<string>, value: string | null | undefined) {
  if (!value) return;

  const normalized = normalizeSearchText(value);
  const compact = compactSearchText(value);

  if (normalized) {
    set.add(normalized);
  }

  if (compact && compact !== normalized) {
    set.add(compact);
  }
}

export function generateSearchAliases({
  name,
  slug,
  websiteUrl,
  customAliases = [],
}: {
  name: string;
  slug?: string | null;
  websiteUrl?: string | null;
  customAliases?: string[];
}) {
  const aliases = new Set<string>();

  const normalizedName = normalizeSearchText(name);
  const normalizedSlug = normalizeSearchText(slug || slugify(name));
  const host = getHostName(websiteUrl);
  const hostWithoutUa = host?.replace(/\.ua$/i, "");

  addAlias(aliases, normalizedName);
  addAlias(aliases, normalizedSlug);
  addAlias(aliases, normalizedName.replace(/\s+/g, ""));
  addAlias(aliases, normalizedSlug.replace(/-/g, " "));
  addAlias(aliases, normalizedSlug.replace(/-/g, ""));
  addAlias(aliases, host);
  addAlias(aliases, hostWithoutUa);

  addAlias(aliases, transliterateEnglishToUkrainian(normalizedName));
  addAlias(aliases, transliterateEnglishToUkrainian(normalizedSlug));
  addAlias(aliases, transliterateUkrainianToEnglish(normalizedName));
  addAlias(aliases, transliterateUkrainianToEnglish(normalizedSlug));

  addAlias(aliases, convertEnglishKeyboardToUkrainian(normalizedName));
  addAlias(aliases, convertEnglishKeyboardToUkrainian(normalizedSlug));
  addAlias(aliases, convertUkrainianKeyboardToEnglish(normalizedName));
  addAlias(aliases, convertUkrainianKeyboardToEnglish(normalizedSlug));

  const brandKey = compactSearchText(normalizedName);
  const slugKey = compactSearchText(normalizedSlug);

  for (const alias of brandPronunciationAliases[brandKey] || []) {
    addAlias(aliases, alias);
  }

  for (const alias of brandPronunciationAliases[slugKey] || []) {
    addAlias(aliases, alias);
  }

  for (const alias of customAliases) {
    addAlias(aliases, alias);
    addAlias(aliases, transliterateEnglishToUkrainian(alias));
    addAlias(aliases, transliterateUkrainianToEnglish(alias));
    addAlias(aliases, convertEnglishKeyboardToUkrainian(alias));
    addAlias(aliases, convertUkrainianKeyboardToEnglish(alias));
  }

  return Array.from(aliases)
    .map((alias) => normalizeSearchText(alias))
    .filter(Boolean)
    .filter((alias, index, array) => array.indexOf(alias) === index)
    .slice(0, 50);
}

export function parseAliases(value: string) {
  const aliases = value
    .split(/[\n,;]/g)
    .map((alias) => normalizeSearchText(alias))
    .filter(Boolean);

  return Array.from(new Set(aliases));
}

export function aliasesToText(aliases: string[] | null | undefined) {
  return (aliases || []).join(", ");
}

export function matchesSearch(haystackParts: string[], query: string) {
  const tokens = splitSearchTokens(query);

  if (tokens.length === 0) return true;

  const haystack = normalizeSearchText(haystackParts.join(" "));
  const compactHaystack = compactSearchText(haystackParts.join(" "));

  return tokens.every((token) => {
    const normalizedToken = normalizeSearchText(token);
    const compactToken = compactSearchText(token);

    return (
      haystack.includes(normalizedToken) ||
      Boolean(compactToken && compactHaystack.includes(compactToken))
    );
  });
}