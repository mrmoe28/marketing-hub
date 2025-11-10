const AI_TELLS = [
  /I hope this (?:email|message) finds you well/gi,
  /I'm reaching out to/gi,
  /I wanted to reach out/gi,
  /In today's (?:fast-paced|digital|modern) world/gi,
  /Are you ready to (?:unlock|elevate|transform)/gi,
  /(?:unlock|elevate|transform) your/gi,
  /game-changer/gi,
  /cutting-edge/gi,
  /leverage/gi,
  /synergy/gi,
  /paradigm shift/gi,
  /circle back/gi,
  /touch base/gi,
  /low-hanging fruit/gi,
  /move the needle/gi,
  /As an AI/gi,
];

const REPLACEMENTS: Record<string, string> = {
  "I hope this email finds you well": "Hey there",
  "I hope this message finds you well": "Hi",
  "I'm reaching out to": "I wanted to",
  "I wanted to reach out": "Quick note —",
  "Are you ready to unlock": "Want to get",
  "Are you ready to elevate": "Let's boost",
  "Are you ready to transform": "Let's improve",
  "unlock your": "improve your",
  "elevate your": "boost your",
  "transform your": "upgrade your",
  "game-changer": "big improvement",
  "cutting-edge": "latest",
  leverage: "use",
  synergy: "teamwork",
  "paradigm shift": "big change",
  "circle back": "follow up",
  "touch base": "check in",
  "low-hanging fruit": "easy wins",
  "move the needle": "make progress",
};

export function humanizeEmail(text: string): string {
  let result = text;

  AI_TELLS.forEach((pattern) => {
    const match = result.match(pattern);
    if (match && match[0]) {
      const original = match[0];
      const normalized = original.toLowerCase().replace(/[.,;!?]/g, "");
      const replacement = REPLACEMENTS[normalized];

      if (replacement) {
        result = result.replace(pattern, replacement);
      }
    }
  });

  result = result.replace(/([.!?])\s+([A-Z])/g, (match, punct, letter) => {
    if (Math.random() > 0.7) {
      return `${punct}  ${letter}`;
    }
    return match;
  });

  return result;
}
