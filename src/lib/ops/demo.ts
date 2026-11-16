/**
 * Demo data used when no EPO OPS key is configured. Every applicant and title is invented and marked "(demo)".
 * The data is shaped like a real OPS JSON response so it goes through the same parser as live results.
 */
const APPLICANTS = [
  "Demo Agro Labs (demo)",
  "Example Biocontrol GmbH (demo)",
  "Sample Crop Science SA (demo)",
  "Placeholder University (demo)",
  "Mock Fermentation BV (demo)",
  "Test Seeds Ltd (demo)",
];
const COUNTRIES = ["EP", "WO", "US", "FR", "DE", "CN"];
const CPC = [
  ["A", "01", "N", "63", "22"],
  ["A", "01", "P", "3", "00"],
  ["C", "12", "N", "1", "20"],
  ["C", "12", "R", "1", "07"],
];

function lcg(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}

export function demoSearchResponse(keywords: string): unknown {
  const seed = [...keywords].reduce((a, c) => a + c.charCodeAt(0), 7);
  const rand = lcg(seed);
  const topic = keywords.trim() || "your topic";
  const docs = Array.from({ length: 36 }, (_, i) => {
    const year = 2014 + Math.floor(rand() * 12);
    const country = COUNTRIES[Math.floor(rand() * COUNTRIES.length)];
    const a1 = APPLICANTS[Math.floor(Math.pow(rand(), 1.6) * APPLICANTS.length)];
    const a2 = rand() > 0.75 ? APPLICANTS[Math.floor(rand() * APPLICANTS.length)] : null;
    const cpc = CPC[Math.floor(rand() * CPC.length)];
    return {
      "exchange-document": {
        "@country": country,
        "@doc-number": String(9000000 + i * 137),
        "@kind": "A1",
        "bibliographic-data": {
          "publication-reference": {
            "document-id": [{ "@document-id-type": "docdb", date: { $: `${year}0${1 + (i % 9)}15` } }],
          },
          "invention-title": [{ "@lang": "en", $: `Demo patent ${i + 1} related to ${topic} (demo)` }],
          parties: {
            applicants: {
              applicant: [a1, a2]
                .filter(Boolean)
                .map((name) => ({ "@data-format": "epodoc", "applicant-name": { name: { $: name } } })),
            },
          },
          "patent-classifications": {
            "patent-classification": {
              section: { $: cpc[0] },
              class: { $: cpc[1] },
              subclass: { $: cpc[2] },
              "main-group": { $: cpc[3] },
              subgroup: { $: cpc[4] },
            },
          },
        },
      },
    };
  });
  return {
    "ops:world-patent-data": {
      "ops:biblio-search": {
        "@total-result-count": "36",
        "ops:search-result": { "exchange-documents": docs },
      },
    },
  };
}
