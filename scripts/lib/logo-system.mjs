export const palette = {
  blue: "#182660",
  yellow: "#F4C94B",
  coral: "#E97867",
  cream: "#F5EACD",
  black: "#000000",
};

export const logoDefinitions = [
  {
    id: "theve",
    name: "Theve",
    wordmark: "THEVE",
    number: null,
    motif: "sunrise",
    accent: "yellow",
  },
  {
    id: "tv1",
    name: "TV1",
    wordmark: "TV1",
    number: 1,
    motif: "sunrise",
    accent: "yellow",
  },
  {
    id: "tv2",
    name: "TV2",
    wordmark: "TV2",
    number: 2,
    motif: "pillars",
    accent: "cream",
  },
  {
    id: "tv3",
    name: "TV3",
    wordmark: "TV3",
    number: 3,
    motif: "screen",
    accent: "coral",
  },
  {
    id: "tv4",
    name: "TV4",
    wordmark: "TV4",
    number: 4,
    motif: "rhythm",
    accent: "yellow",
  },
  {
    id: "tv5",
    name: "TV5",
    wordmark: "TV5",
    number: 5,
    motif: "film",
    accent: "cream",
  },
  {
    id: "tv6",
    name: "TV6",
    wordmark: "TV6",
    number: 6,
    motif: "animation",
    accent: "coral",
  },
  {
    id: "tv7",
    name: "TV7",
    wordmark: "TV7",
    number: 7,
    motif: "search",
    accent: "cream",
  },
  {
    id: "barn",
    name: "Barn",
    wordmark: "BARN",
    number: 8,
    motif: "barn-sun",
    accent: "yellow",
  },
  {
    id: "natur",
    name: "Natur",
    wordmark: "NATUR",
    number: 9,
    motif: "nature",
    accent: "yellow",
  },
];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function motifMarkup(motif, color) {
  const common = `fill="none" stroke="${color}" stroke-width="4" stroke-linecap="square" stroke-linejoin="miter"`;
  switch (motif) {
    case "sunrise":
      return `<g ${common}>
  <path d="M16 58 A25 25 0 0 1 66 58"/>
  <path d="M12 58 H70 M41 19 V10 M22 26 L16 20 M60 26 L66 20 M13 40 H5 M69 40 H77"/>
</g>`;
    case "pillars":
      return `<g ${common}>
  <path d="M10 27 L41 13 L72 27 Z M13 31 H69 M16 62 H66 M11 68 H71"/>
  <path d="M20 32 V61 M32 32 V61 M50 32 V61 M62 32 V61"/>
</g>`;
    case "screen":
      return `<g ${common}>
  <rect x="10" y="17" width="62" height="42" rx="1"/>
  <path d="M31 68 H51 M41 59 V68"/>
</g>`;
    case "rhythm":
      return `<g ${common}>
  <path d="M10 62 V35 M24 62 V22 M38 62 V13 M52 62 V28 M66 62 V43"/>
  <path d="M7 62 H13 M21 62 H27 M35 62 H41 M49 62 H55 M63 62 H69"/>
</g>`;
    case "film":
      return `<g ${common}>
  <rect x="10" y="17" width="62" height="48"/>
  <path d="M10 27 H72 M10 55 H72 M20 17 V27 M34 17 V27 M48 17 V27 M62 17 V27 M20 55 V65 M34 55 V65 M48 55 V65 M62 55 V65"/>
</g>`;
    case "animation":
      return `<g ${common}>
  <circle cx="28" cy="31" r="16"/>
  <path d="M40 42 H70 V66 H46 V51 M12 66 H70"/>
</g>`;
    case "search":
      return `<g ${common}>
  <circle cx="32" cy="33" r="20"/>
  <circle cx="32" cy="33" r="5"/>
  <path d="M47 48 L70 71"/>
</g>`;
    case "barn-sun":
      return `<g ${common}>
  <path d="M13 58 A28 28 0 0 1 69 58"/>
  <path d="M9 58 H73 M41 18 V8 M21 27 L14 20 M61 27 L68 20 M13 40 H4 M69 40 H78"/>
  <circle cx="31" cy="45" r="2" fill="${color}" stroke="none"/>
  <circle cx="51" cy="45" r="2" fill="${color}" stroke="none"/>
</g>`;
    case "nature":
      return `<g ${common}>
  <path d="M7 54 L27 29 L40 43 L52 23 L75 54 Z"/>
  <circle cx="63" cy="18" r="8" fill="${color}" stroke="none"/>
  <path d="M8 61 H74 M15 69 H67"/>
</g>`;
    default:
      throw new Error(`Okänt logotypmotiv: ${motif}`);
  }
}

function colorsFor(definition, variant) {
  if (variant === "cream") {
    return {
      motif: palette.cream,
      word: palette.cream,
      number: palette.cream,
      lines: [palette.cream, palette.cream, palette.cream],
    };
  }
  if (variant === "black") {
    return {
      motif: palette.black,
      word: palette.black,
      number: palette.black,
      lines: [palette.black, palette.black, palette.black],
    };
  }
  return {
    motif: palette[definition.accent],
    word: palette.cream,
    number: palette[definition.accent],
    lines: [palette.yellow, palette.coral, palette.cream],
  };
}

function buildLines(lines, compact) {
  const x = compact ? 91 : 108;
  const width = compact ? 137 : 200;
  const y = compact ? 51 : 73;
  const height = compact ? 2 : 3;
  const step = compact ? 6 : 8;
  return lines
    .map(
      (color, index) =>
        `<rect x="${x}" y="${y + index * step}" width="${width}" height="${height}" fill="${color}"/>`,
    )
    .join("\n  ");
}

export function buildLogoSvg(definition, variant = "full") {
  const compact = variant === "bug";
  const colors = colorsFor(definition, variant);
  const viewBox = compact ? "0 0 240 72" : "0 0 320 96";
  const textX = compact ? 91 : 108;
  const textY = compact ? 43 : 59;
  const fontSize = compact ? 31 : 43;
  const numberX = compact ? 228 : 306;
  const numberY = compact ? 19 : 24;
  const label = compact
    ? `${definition.name} kompakt kanalbugg`
    : `${definition.name} logotyp`;
  const number = definition.number
    ? `<text x="${numberX}" y="${numberY}" fill="${colors.number}" font-family="Arial, sans-serif" font-size="17" font-weight="700" text-anchor="end">${String(definition.number).padStart(2, "0")}</text>`
    : "";

  return `<!-- Generated by scripts/build-logos.mjs. Do not edit directly. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(label)}</title>
  <desc id="desc">Egen Theve-identitet med ${escapeXml(definition.motif)} som motiv.</desc>
  ${motifMarkup(definition.motif, colors.motif)}
  <rect x="87" y="10" width="3" height="58" fill="${colors.word}"/>
  <text x="${textX}" y="${textY}" fill="${colors.word}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="1">${escapeXml(definition.wordmark)}</text>
  ${number}
  ${buildLines(colors.lines, compact)}
</svg>
`;
}

export function buildLogoManifest() {
  return {
    schemaVersion: "1.0.0",
    generatedBy: "scripts/build-logos.mjs",
    palette,
    construction: {
      safeAreaPercent: 5,
      lineHeight: 3,
      lineGap: 5,
      mainViewBox: "0 0 320 96",
      compactViewBox: "0 0 240 72",
    },
    logos: logoDefinitions.map((definition) => ({
      id: definition.id,
      name: definition.name,
      motif: definition.motif,
      accent: definition.accent,
      variants: {
        fullColor: `${definition.id}.svg`,
        cream: `${definition.id}-cream.svg`,
        black: `${definition.id}-black.svg`,
        compact: `${definition.id}-bug.svg`,
      },
      allowedBackgrounds: {
        fullColor: ["tv-blue", "black"],
        cream: ["tv-blue", "black"],
        black: ["cream", "yellow"],
        compact: ["tv-blue", "black"],
      },
      minimumWidthPx: {
        fullColor: 128,
        compact: 72,
      },
    })),
  };
}
