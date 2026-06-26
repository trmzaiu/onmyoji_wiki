import { getLocalizedName, getSkillName } from "../helper/helper";
import { createEffectSpan, createSkillSpan } from "./createSpan";
import { parseBaseDescription } from "./skillParser";

export const effectTagType = (tag = "") => {
	const value = tag.toLowerCase();

	if (value.includes("buff") || value.includes("增益")) {
		return "buff";
	}

	if (value.includes("debuff") || value.includes("减益")) {
		return "debuff";
	}

	if (value.includes("mark") || value.includes("印记")) {
		return "mark";
	}

	if (value.includes("status") || value.includes("状态")) {
		return "status";
	}

	if (value.includes("general") || value.includes("通用")) {
		return "general";
	}

	return "general";
};

export const parseEffectTags = (effect, language) => {
	const description = effect?.description?.[language];

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
	language,
	currentEffectId,
}) => {
	const renderedEffects = new Set();

	const getEffectName = (effect, id, value) => {
		let effectName = getLocalizedName(effect, language);

		if (id === "17" && value) {
			effectName = effectName.replace(
				/^(\S+)\s+(.*)$/,
				`$1 ${value} $2`
			);
		}

		return effectName;
	};

	return parseBaseDescription({
		text,
		shikigami,
		shikigamiMap,
		onmyojiMap,
		effectMap,
		language,
		skillReplacer: (_, type, id) => {
			const [shikiId, skillIndex] = id.split("-");

			const shiki = shikigamiMap?.get(String(shikiId));

			if (!shiki) return _;

			const name = getSkillName(shiki, skillIndex, language);

			if (!name) return _;

			return createSkillSpan(name, "bold");
		},
		effectReplacer: (_, type, id, value) => {
			const effect = effectMap?.get(String(id));

			if (!effect) return _;

			const effectName = getEffectName(effect, id, value);

			if (String(id) === String(currentEffectId)) {
				return createEffectSpan(
					effectName,
					false,
					"normal"
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