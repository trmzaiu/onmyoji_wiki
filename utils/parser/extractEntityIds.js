export function extractEntityIds({
  skills = [],
  effects = [],
  profile = [],
  soulEffect = {},
  tag = "s",
}) {
  skills = Array.isArray(skills) ? skills : [];
  effects = Array.isArray(effects) ? effects : [];
  
  const ids = new Set();
  const languages = ["en", "vn", "cn"];

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
    languages.forEach((lang) => {
      extractFromText(skill.description?.[lang]);

      skill.levels?.[lang]?.forEach?.((lvl) => {
        extractFromText(lvl.effect);
      });
    });
  });

  // EFFECTS
  effects.forEach((effect) => {
    languages.forEach((lang) => {
      extractFromText(effect.description?.[lang], true);
    });
  });

  // PROFILE
  languages.forEach((lang) => {
    extractFromText(profile?.[lang]);
  });

  // SOUL
  languages.forEach((lang) => {
    extractFromText(soulEffect?.[lang]);
  });

  return [...ids];
}