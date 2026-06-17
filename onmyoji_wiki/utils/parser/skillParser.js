import { getLocalizedName, getSkillName, replacePipeline } from "../helper/helper";
import { createEffectImage, createEffectSpan, createSkillSpan } from "./createSpan";

export const parseBaseDescription = ({
  text,
  shikigamiMap,
  onmyojiMap,
  isEnglish,
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

        return getLocalizedName(shiki, isEnglish);
      },
    ],

    // ONMYOJI
    [
      /<o>(.*?)<\/o>/g,
      (_, id) => {
        const onmyoji = onmyojiMap?.get(String(id));

        if (!onmyoji) return _;

        return getLocalizedName(onmyoji, isEnglish);
      },
    ],

    // SKILL
    [/<(k|kb)>(.*?)<\/\1>/g, skillReplacer],

    // EFFECTS
    [/<(e|eb)>(.*?)<\/\1>/g, effectReplacer],
  ]);

  return processed;
};

export const parseSkillDescription = ({
  text,
  entity,
  shikigamiMap,
  onmyojiMap,
  effectMap,
  isEnglish,
  currentSkillIndex,
}) => {
  return parseBaseDescription({
    text,
    entity,
    shikigamiMap,
    onmyojiMap,
    isEnglish,
    skillReplacer: (_, type, id) => {
      const index = parseInt(id, 10);

      const name = getSkillName(entity, index, isEnglish);

      if (!name) return _;

      if (index === currentSkillIndex + 1) {
        return name;
      }

      let variant = "normal";

      if (index !== currentSkillIndex + 1) {
        if (type === "kb") {
          variant = "bold";
        } else {
          variant = "highlight";
        }

        return createSkillSpan(name, variant, index-1);
      }
    },
    effectReplacer: (_, type, id) => {
      const effect = effectMap?.get(String(id));

      if (!effect) return _;

      const effectName = getLocalizedName(
        effect,
        isEnglish
      );

      return createEffectSpan(
        effectName,
        type === "eb",
        effect.color
      );
    },
  });
};
