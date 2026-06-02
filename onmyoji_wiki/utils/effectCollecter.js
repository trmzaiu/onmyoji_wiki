

export const getAllSkillEffectText = ({
	skill,
	isEnglish,
}) => {
	let text = "";

	text += isEnglish
		? skill.description?.en || ""
		: skill.description?.vn || "";

	const levels = isEnglish
		? skill.levels?.en
		: skill.levels?.vn;

	if (Array.isArray(levels)) {
		text += levels
			.map((lvl) => lvl.effect || "")
			.join(" ");
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

	if (isEnglish) {
		clone.description.en =
			processText(clone.description.en);

		clone.levels.en.forEach((level) => {
			level.effect = processText(level.effect);
		});
	} else {
		clone.description.vn =
			processText(clone.description.vn);

		clone.levels.vn.forEach((level) => {
			level.effect = processText(level.effect);
		});
	}

	return clone;
};