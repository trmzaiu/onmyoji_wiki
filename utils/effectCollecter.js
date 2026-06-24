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

  const ids = [...text.matchAll(/<eb>(\d+)<\/eb>/g)].map(
    (match) => match[1]
  );

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

export const markFirstAppearances = ({
  skill,
  language = "en",
  showEvolution,
}) => {
  const seenEffects = new Set();
  const seenSkills = new Set();

  const processText = (text) => {
    if (!text) return text;

    text = text.replace(
      /<e>(\d+)<\/e>/g,
      (match, id) => {
        if (seenEffects.has(id)) {
          return match;
        }

        seenEffects.add(id);

        return `<eb>${id}</eb>`;
      }
    );

    text = text.replace(
      /<k>(\d+)<\/k>/g,
      (match, id) => {
        if (seenSkills.has(id)) {
          return match;
        }

        seenSkills.add(id);

        return `<kb>${id}</kb>`;
      }
    );

    return text;
  };

  const clone = JSON.parse(JSON.stringify(skill));

  if (clone.base) {
    if (showEvolution) {
      clone.description[language] = processText(
        clone.description?.[language]
      );
    } else {
      clone.base[language] = processText(
        clone.base?.[language]
      );
    }
  } else {
    clone.description[language] = processText(
      clone.description?.[language]
    );
  }

  if (Array.isArray(clone.levels?.[language])) {
    clone.levels[language].forEach((level) => {
      level.effect = processText(level.effect);
    });
  }

  return clone;
};