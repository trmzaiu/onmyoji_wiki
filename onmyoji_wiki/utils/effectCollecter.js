

export const getAllSkillEffectText = ({
	skill,
	isEnglish,
	showEvolution,
}) => {
	let text = "";

	const lang = isEnglish ? "en" : "vn";

	if (skill.base) {
		text += showEvolution
			? skill.description?.[lang] || ""
			: skill.base?.[lang] || "";
	} else {
		text += skill.description?.[lang] || "";
	}

	const levels = skill.levels?.[lang];

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
	isEnglish,
	visited = new Set(),
}) => {
	if (!text || !effects?.length) {
		return [];
	}

	const effectById = new Map(
		effects.map((e) => [String(e.id), e])
	);

	const ids = [
		...text.matchAll(/<eb>(\d+)<\/eb>/g),
	].map((m) => m[1]);

	const results = [];

	ids.forEach((id) => {
		if (visited.has(id)) return;

		visited.add(id);

		const effect = effectById.get(id);

		if (!effect) return;

		results.push(effect);

		const description = isEnglish
			? effect.description?.en
			: effect.description?.vn;

		results.push(
			...collectNestedEffects({
				text: description,
				effects,
				isEnglish,
				visited,
			})
		);
	});

	return Array.from(
		new Map(results.map((e) => [e.id, e])).values()
	);
};

export const markFirstAppearances = ({
	skill,
	isEnglish,
	showEvolution
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

	const lang = isEnglish ? "en" : "vn";

	if (skill.base) {
		if (showEvolution) {
			clone.description[lang] = processText(clone.description[lang]);
		} else {
			clone.base[lang] = processText(clone.base[lang]);
		}
	} else {
		clone.description[lang] = processText(clone.description[lang]);
	}

	if (Array.isArray(clone.levels?.[lang])) {
		clone.levels[lang].forEach((level) => {
			level.effect = processText(level.effect);
		});
	}

	return clone;
};