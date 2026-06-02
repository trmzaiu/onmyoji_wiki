import { getSkillName } from "../helper/helper";
import { createEffectSpan, createSkillSpan } from "./createSpan";
import { parseBaseDescription } from "./skillParser";

export const effectTagType = (tag) => {
	const value = tag.toLowerCase();

	if (value.includes("buff")) return "buff";
	if (value.includes("debuff")) return "debuff";
	if (value.includes("mark")) return "mark";
	if (value.includes("status")) return "status";

	return "general";
};

export const parseEffectTags = (effect, isEnglish) => {
	const description = isEnglish
		? effect?.description?.en
		: effect?.description?.vn;

	if (!description) {
		return {
			tags: [],
			description: "",
		};
	}

	const match = description.match(/^\[(.*?)\]\s*/);

	if (!match) {
		return {
			tags: [],
			description,
		};
	}

	const tags = match[1]
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean);

	return {
		tags,
		description: description.replace(/^\[(.*?)\]\s*/, ""),
	};
};



export const parseEffectDescription = ({
	text,
	shikigami,
	shikigamiMap,
	onmyojiMap,
	effectMap,
	isEnglish,
	currentEffectId,
}) => {
	const renderedEffects = new Set();

	return parseBaseDescription({
		text,
		shikigami,
		shikigamiMap,
		onmyojiMap,
		effectMap,
		isEnglish,
		skillReplacer: (_, type, id) => {
			const [shikiId, skillIndex] = id.split("-");

			const shiki = shikigamiMap.value.get(String(shikiId));

			if (!shiki) return _;

			const name = getSkillName(shiki, parseInt(skillIndex));

			if (!name) return _;

			return createSkillSpan(name, "bold");
		},
		effectReplacer: (_, type, id) => {
			const effect = effectMap?.get(String(id));

			if (!effect) return _;

			const effectName = getLocalizedName(
				effect,
				isEnglish
			);

			if (String(id) === String(currentEffectId)) {
				return createEffectSpan(
					effectName,
					false,
					'normal'
				);
			}

			const isFirstAppearance =
				!renderedEffects.has(id);

			renderedEffects.add(id);

			return createEffectSpan(
				effectName,
				isFirstAppearance,
				effect.color
			);
		}
	});
};