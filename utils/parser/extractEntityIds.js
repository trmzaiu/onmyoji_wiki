export function extractEntityIds({
  skills = [],
  effects = [],
  profile = [],
  tag = "s",
}) {
  const ids = new Set();

  const regex =
    tag === "k"
      ? /<k>([\d-]+)<\/k>/g
      : new RegExp(`<${tag}>(\\d+)<\\/${tag}>`, "g");

  const extractFromText = (text = "", fromEffect = false) => {
    const matches = [...text.matchAll(regex)];

    matches.forEach((m) => {
      let value = m[1];

      if (fromEffect && tag === "k") {
        value = value.split("-")[0];
      }

      ids.add(Number(value));
    });
  };

  // SKILLS
  skills.forEach((skill) => {
    extractFromText(skill.description?.en);
    extractFromText(skill.description?.vn);

    ["en", "vn"].forEach((lang) => {
      skill.levels?.[lang]?.forEach?.((lvl) => {
        extractFromText(lvl.effect);
      });
    });
  });

  // EFFECTS
  effects.forEach((effect) => {
    extractFromText(effect.description?.en, true);
    extractFromText(effect.description?.vn, true);
  });

  // PROFILE
  extractFromText(profile?.en);
  extractFromText(profile?.vn);

  return [...ids];
}