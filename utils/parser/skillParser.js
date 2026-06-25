import { getLocalizedName, getSkillName, replacePipeline } from "../helper/helper";
import { createEffectImage, createEffectSpan, createEffectTooltip, createSkillSpan } from "./createSpan";

export const parseBaseDescription = ({
  text,
  shikigamiMap,
  onmyojiMap,
  language,
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
    let effectName = getLocalizedName(effect, language);

    if (id === "17" && value) {
      effectName = effectName.replace(
        /^(\S+)\s+(.*)$/,
        `$1 ${value} $2`
      );
    }

    return effectName;
  };

  const parseTooltipDescription = (effect) => {
    const rawText =
      effect?.description?.[language] ??
      effect?.description?.en ??
      "";

    return parseBaseDescription({
      text: rawText,
      shikigamiMap,
      onmyojiMap,
      language,

      skillReplacer: (_, type, id) => {
        const index = parseInt(id, 10);
        const name = getSkillName(entity, index, language);

        if (!name) return _;

        return createSkillSpan(
          name,
          type === "kb" ? "bold" : "highlight",
          index - 1
        );
      },

      effectReplacer: (_, type, id, value) => {
        const nestedEffect = effectMap?.get(String(id));

        if (!nestedEffect) return _;

        const nestedName = getEffectName(nestedEffect, id, value);

        return createEffectSpan(
          nestedName,
          type === "eb",
          nestedEffect.color
        );
      },
    });
  };

  return parseBaseDescription({
    text,
    shikigamiMap,
    onmyojiMap,
    language,

    skillReplacer: (_, type, id) => {
      const index = parseInt(id, 10);
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
    },

    effectReplacer: (_, type, id, value) => {
      const effect = effectMap?.get(String(id));

      if (!effect) return _;

      const effectName = getEffectName(effect, id, value);

      if (effect.tooltip === true && type === "eb") {
        const description = parseTooltipDescription(effect);

        return createEffectTooltip(
          effectName,
          effect,
          description
        );
      }

      return createEffectSpan(
        effectName,
        type === "eb",
        effect.color
      );
    },
  });
};