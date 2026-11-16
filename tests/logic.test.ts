import { describe, expect, it } from "vitest";
import { evaluateHypothesis, tallyPains, type VerdictKind } from "../src/lib/validation";
import { matchProjectToChallenge } from "../src/lib/matching";
import { buildCql } from "../src/lib/ops/query";
import { cleanApplicant, parseSearchResponse } from "../src/lib/ops/parse";
import { byYear, topApplicants } from "../src/lib/ops/aggregate";
import { demoSearchResponse } from "../src/lib/ops/demo";
import { parseKeywords, tokenize } from "../src/lib/text";

describe("validation", () => {
  it("needs the minimum sample before deciding", () => {
    const r = evaluateHypothesis("B2B", ["CONFIRMS", "CONFIRMS", "CONFIRMS", "CONFIRMS"]);
    expect(r.status).toBe("NOT_ENOUGH_DATA");
    expect(r.rate).toBe(1);
  });
  it("validates B2B at 75% and counts unclear answers in the total", () => {
    const ok = evaluateHypothesis("B2B", ["CONFIRMS", "CONFIRMS", "CONFIRMS", "CONFIRMS", "REJECTS"]);
    expect(ok.status).toBe("VALIDATED"); // 4/5 = 80%
    const no = evaluateHypothesis("B2B", ["CONFIRMS", "CONFIRMS", "CONFIRMS", "UNCLEAR", "REJECTS"]);
    expect(no.status).toBe("INVALIDATED"); // 3/5 = 60%
    expect(no.unclear).toBe(1);
  });
  it("validates B2C at 45%", () => {
    const v = Array.from({ length: 20 }, (_, i) => (i < 9 ? "CONFIRMS" : "REJECTS") as VerdictKind);
    expect(evaluateHypothesis("B2C", v).status).toBe("VALIDATED"); // 9/20 = 45%
    const w = Array.from({ length: 20 }, (_, i) => (i < 8 ? "CONFIRMS" : "REJECTS") as VerdictKind);
    expect(evaluateHypothesis("B2C", w).status).toBe("INVALIDATED");
  });
  it("tallies pains once per interview, case-insensitively", () => {
    const t = tallyPains([{ painTags: ["Cost", "cost", "time"] }, { painTags: ["COST"] }, { painTags: [] }]);
    expect(t).toEqual([
      { tag: "cost", count: 2 },
      { tag: "time", count: 1 },
    ]);
  });
});

describe("matching", () => {
  const project = {
    title: "Bacillus strain for biological control of crop fungi",
    field: "Agronomy / Food",
    summary: "A soil bacterium that reduces fungal disease in wheat without chemical fungicides.",
    keywords: ["biocontrol", "fungicide alternative", "bacillus"],
    trl: 4,
  };
  it("scores a related challenge high and explains why", () => {
    const r = matchProjectToChallenge(project, {
      title: "Biological alternative to chemical fungicides",
      description: "We look for biocontrol solutions against fungal disease in cereals such as wheat.",
      field: "Agronomy / Food",
      keywords: ["biocontrol", "fungicide alternative"],
      minTrl: 3,
    });
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.sharedKeywords).toContain("biocontrol");
    expect(r.reasons.join(" ")).toMatch(/meets the minimum TRL 3/);
  });
  it("scores an unrelated challenge low and penalises a TRL gap", () => {
    const r = matchProjectToChallenge(project, {
      title: "Battery recycling process",
      description: "Recover lithium from used electric vehicle batteries.",
      field: "Engineering / Energy",
      keywords: ["lithium", "recycling"],
      minTrl: 6,
    });
    expect(r.score).toBeLessThan(15);
    expect(r.reasons.join(" ")).toMatch(/below the minimum TRL 6/);
  });
});

describe("OPS query", () => {
  it("builds a safe CQL query", () => {
    expect(buildCql({ keywords: 'bacillus "fungi" OR wheat', cpc: "a01n 63", fromYear: 2020, toYear: 2015 })).toBe(
      'ta=bacillus and ta=fungi and ta=wheat and cpc=A01N63 and pd within "2015 2020"',
    );
  });
  it("rejects an empty query", () => {
    expect(() => buildCql({ keywords: "  " })).toThrow();
  });
});

describe("OPS parser", () => {
  // Shape of a real OPS JSON answer where lists of one element are plain objects.
  const single = {
    "ops:world-patent-data": {
      "ops:biblio-search": {
        "@total-result-count": "1234",
        "ops:search-result": {
          "exchange-documents": {
            "exchange-document": {
              "@country": "EP",
              "@doc-number": "3456789",
              "@kind": "A1",
              "bibliographic-data": {
                "publication-reference": {
                  "document-id": [
                    { "@document-id-type": "docdb", date: { $: "20210317" } },
                    { "@document-id-type": "epodoc", date: { $: "20210317" } },
                  ],
                },
                "invention-title": [
                  { "@lang": "de", $: "Titel" },
                  { "@lang": "en", $: "Biocontrol composition" },
                ],
                parties: {
                  applicants: {
                    applicant: [
                      { "@data-format": "epodoc", "applicant-name": { name: { $: "ACME AGRO SA [FR]" } } },
                      { "@data-format": "original", "applicant-name": { name: { $: "Acme Agro S.A." } } },
                    ],
                  },
                },
                "patent-classifications": {
                  "patent-classification": {
                    section: { $: "A" },
                    class: { $: "01" },
                    subclass: { $: "N" },
                    "main-group": { $: "63" },
                    subgroup: { $: "22" },
                  },
                },
              },
              abstract: { "@lang": "en", p: { $: "A composition comprising a strain." } },
            },
          },
        },
      },
    },
  };

  it("parses a single-document answer", () => {
    const r = parseSearchResponse(single);
    expect(r.total).toBe(1234);
    expect(r.records).toHaveLength(1);
    const p = r.records[0];
    expect(p.publicationNumber).toBe("EP3456789A1");
    expect(p.date).toBe("2021-03-17");
    expect(p.title).toBe("Biocontrol composition");
    expect(p.applicants).toEqual(["ACME AGRO SA"]);
    expect(p.cpc).toEqual(["A01N 63/22"]);
    expect(p.abstract).toBe("A composition comprising a strain.");
    expect(p.url).toContain("EP3456789A1");
  });

  it("parses demo data and aggregates it", () => {
    const r = parseSearchResponse(demoSearchResponse("bacillus"));
    expect(r.records.length).toBe(36);
    expect(r.records.every((x) => x.applicants.every((a) => a.endsWith("(demo)")))).toBe(true);
    const top = topApplicants(r.records, 3);
    expect(top[0].count).toBeGreaterThanOrEqual(top[1].count);
    expect(byYear(r.records).map((b) => b.key)).toEqual([...byYear(r.records).map((b) => b.key)].sort());
  });

  it("returns nothing for an unexpected shape", () => {
    expect(parseSearchResponse({ foo: 1 })).toEqual({ total: 0, records: [] });
  });

  it("cleans applicant names", () => {
    expect(cleanApplicant("BASF SE [DE]")).toBe("BASF SE");
  });
});

describe("text", () => {
  it("tokenizes without stopwords or accents", () => {
    expect(tokenize("The génie of fungi, and AI")).toEqual(["genie", "fungi"]);
  });
  it("parses keywords", () => {
    expect(parseKeywords(" Biocontrol , biocontrol, Wheat  fungi ,,")).toEqual(["biocontrol", "wheat fungi"]);
  });
});
