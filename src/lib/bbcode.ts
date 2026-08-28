const supportedBbcodeTagPattern = /\[(?:\/?)(?:b|i|u|s|h2|h3|center|right|quote|code|spoiler|color|size|url|img)(?:=[^\]]*)?\]|\[hr\]/gi;

export function stripBbcode(value: string) {
  return value
    .replace(supportedBbcodeTagPattern, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function bbcodeExcerpt(value: string, maxLength = 240) {
  return stripBbcode(value).slice(0, maxLength);
}
