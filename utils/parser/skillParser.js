import { getLocalizedName, getSkillName, replacePipeline } from "../helper/helper";
import { createEffectImage, createEffectSpan, createEffectTooltip, createSkillSpan } from "./createSpan";

export const parseBaseDescription = ({
  text = "",
  shikigamiMap = new Map(),
  onmyojiMap = new Map(),
  language = "en",
  skillReplacer,
  effectReplacer,
}) => {
  if (!text) return "";

  let processed = text;

  processed = replacePipeline(processed, [
    // EFFECT ICONS
    [/<i>(.*?)<\/i>/g, (_, keyword) => createEffectImage(keyword)],

    // SHIKIGAMI
    [
      /<s>(.*?)<\/s>/g,
      (_, id) => {
        const shiki = shikigamiMap?.get(String(id));

        if (!shiki) return _;

        return getLocalizedName(shiki, language);
      },
    ],

    // ONMYOJI
    [
      /<o>(.*?)<\/o>/g,
      (_, id) => {
        const onmyoji = onmyojiMap?.get(String(id));

        if (!onmyoji) return _;

        return getLocalizedName(onmyoji, language);
      },
    ],

    // SKILL
    [/<(k|kb)>(.*?)<\/\1>/g, skillReplacer],

    // EFFECTS
    [/<(e|eb)>(.*?)<\/\1>(\d+%)?/g, effectReplacer],
  ]);

  return processed;
};

export const parseSkillDescription = ({
  text,
  entity,
  shikigamiMap,
  onmyojiMap,
  effectMap,
  language,
  currentSkillIndex,
}) => {
  const getEffectName = (effect, id, value) => {
    let name = getLocalizedName(effect, language);

    if (id === "17" && value) {
      name = name.replace(
        /^(\S+)\s+(.*)$/,
        `$1 ${value} $2`
      );
    }

    return name;
  };

  const currentSkillReplacer = (_, type, id) => {
    const index = Number(id);

    const name = getSkillName(entity, index, language);

    if (!name) return _;

    if (index === currentSkillIndex + 1) {
      return name;
    }

    return createSkillSpan(
      name,
      type === "kb" ? "bold" : "highlight",
      index - 1
    );
  };

  const tooltipSkillReplacer = (_, type, id) => {
    const [shikiId, skillIndex] = id.split("-");

    const shiki = shikigamiMap?.get(String(shikiId));

    if (!shiki) return _;

    const name = getSkillName(shiki, skillIndex, language);

    if (!name) return _;

    return createSkillSpan(
      name,
      type === "kb" ? "bold" : "highlight"
    );
  };

  const tooltipEffectReplacer = (_, type, id, value) => {
    const effect = effectMap?.get(String(id));

    if (!effect) return _;

    return createEffectSpan(
      getEffectName(effect, id, value),
      type === "eb",
      effect.color
    );
  };

  const parseTooltipDescription = (effect) =>
    parseBaseDescription({
      text:
        effect?.description?.[language] ??
        effect?.description?.en ??
        "",
      shikigamiMap,
      onmyojiMap,
      language,
      skillReplacer: tooltipSkillReplacer,
      effectReplacer: tooltipEffectReplacer,
    });

  const effectReplacer = (_, type, id, value) => {
    const effect = effectMap?.get(String(id));

    if (!effect) return _;

    const effectName = getEffectName(
      effect,
      id,
      value
    );

    if (effect.tooltip && type === "eb") {
      return createEffectTooltip(
        effectName,
        effect,
        parseTooltipDescription(effect)
      );
    }

    return createEffectSpan(
      effectName,
      type === "eb",
      effect.color
    );
  };

  return parseBaseDescription({
    text,
    shikigamiMap,
    onmyojiMap,
    language,
    skillReplacer: currentSkillReplacer,
    effectReplacer,
  });
};