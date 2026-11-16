export const FIELDS = [
  "Life sciences / Biotechnology",
  "Health / Medical devices",
  "Agronomy / Food",
  "Chemistry / Materials",
  "Engineering / Energy",
  "Computer science / AI",
  "Environment / Climate",
  "Physics / Other",
] as const;

export const TRL_LABELS = [
  "Basic principles observed",
  "Technology concept formulated",
  "Experimental proof of concept",
  "Technology validated in the lab",
  "Technology validated in a relevant environment",
  "Technology demonstrated in a relevant environment",
  "System prototype demonstrated in an operational environment",
  "System complete and qualified",
  "Actual system proven in an operational environment",
] as const;

/** TRL ladder questions (one per level), from the first version of Lab2Market. */
export const TRL_STEPS: [string, string][] = [
  ["Basic principle observed and reported", "e.g. in your thesis or a paper"],
  ["Application concept written down", "you can name the problem it would solve and for whom"],
  ["Proof of concept shown in experiments", "first lab results that the idea works"],
  ["Validated in the lab", "repeatable results with a documented protocol"],
  ["Validated in a relevant environment", "e.g. greenhouse, pilot plant, realistic test data"],
  ["Prototype demonstrated in a relevant environment", "a working version, close to final form"],
  ["Prototype demonstrated in real operating conditions", "used where the end user would use it"],
  ["Complete system qualified", "e.g. certification or regulatory approval"],
  ["Proven in real use", "deployed, sold or used routinely"],
];

/** What to do to reach the next level, indexed by current TRL (0-8). */
export const TRL_NEXT_ACTIONS = [
  "Write up the principle clearly, with the evidence, before anything else.",
  "Write one page on the problem this solves, who has it and what they use today.",
  "Design the smallest experiment that shows the idea works, and record it.",
  "Repeat the key result and document the protocol so others could reproduce it.",
  "Test under realistic conditions: a pilot, a greenhouse, an industrial sample or real data.",
  "Build a prototype close to final form and test it in that relevant environment.",
  "Run a pilot with a real user, ideally a company, in their own setting.",
  "Plan certification or regulatory steps with an expert in your sector.",
  "Prepare for scale: production, distribution and customer support.",
];

export const ORG_TYPES = ["Company", "Farm / producer", "Hospital / clinic", "Public body", "University / lab", "Individual", "Other"];
