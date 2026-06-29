export const getAllSkillEffectText = ({
  skill,
  language = "en",
  showEvolution,
}) => {
  let text = "";

  if (skill.base) {
    text += showEvolution
      ? skill.description?.[language] || ""
      : skill.base?.[language] || "";
  } else {
    text += skill.description?.[language] || "";
  }

  const levels = skill.levels?.[language];

  if (Array.isArray(levels)) {
    text += levels.map((lvl) => lvl.effect || "").join(" ");
  } else if (typeof levels === "string") {
    text += ` ${levels}`;
  }

  return text;
};

export const getAllSoulEffectText = ({
  effect,
  language = "en",
}) => {
  let text = "";

  text += effect?.[language]

  return text;
};

export const collectNestedEffects = ({
  text,
  effects,
  language = "en",
  visited = new Set(),
}) => {
  if (!text || !effects?.length) {
    return [];
  }

  const effectById = new Map(
    effects.map((effect) => [String(effect.id), effect])
  );

  console.log("effectById", effectById);

  const ids = [...text.matchAll(/<eb>(\d+)<\/eb>/g)].map(
    (match) => match[1]
  );

  console.log("ids", ids);

  const results = [];

  ids.forEach((id) => {
    if (visited.has(id)) return;

    visited.add(id);

    const effect = effectById.get(id);

    if (!effect) return;

    results.push(effect);

    const description = effect.description?.[language] ?? "";

    results.push(
      ...collectNestedEffects({
        text: description,
        effects,
        language,
        visited,
      })
    );
  });

  return Array.from(
    new Map(results.map((effect) => [effect.id, effect])).values()
  );
};

export const markFirstAppearancesInText = (
  text = "",
  seenEffects = new Set(),
  seenSkills = new Set()
) => {
  return text
    .replace(/<e>(\d+)<\/e>/g, (match, id) => {
      if (seenEffects.has(id)) return match;

      seenEffects.add(id);
      return `<eb>${id}</eb>`;
    })
    .replace(/<k>(\d+)<\/k>/g, (match, id) => {
      if (seenSkills.has(id)) return match;

      seenSkills.add(id);
      return `<kb>${id}</kb>`;
    });
};

export const markFirstAppearances = ({
  skill,
  language = "en",
  showEvolution,
}) => {
  const clone = JSON.parse(JSON.stringify(skill));

  const seenEffects = new Set();
  const seenSkills = new Set();

  if (clone.base) {
    if (showEvolution) {
      clone.description[language] = markFirstAppearancesInText(
        clone.description?.[language],
        seenEffects,
        seenSkills
      );
    } else {
      clone.base[language] = markFirstAppearancesInText(
        clone.base?.[language],
        seenEffects,
        seenSkills
      );
    }
  } else {
    clone.description[language] = markFirstAppearancesInText(
      clone.description?.[language],
      seenEffects,
      seenSkills
    );
  }

  if (Array.isArray(clone.levels?.[language])) {
    clone.levels[language].forEach((level) => {
      level.effect = markFirstAppearancesInText(
        level.effect,
        seenEffects,
        seenSkills
      );
    });
  }

  return clone;
};