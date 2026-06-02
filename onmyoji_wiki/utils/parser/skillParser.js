import { getLocalizedName, getSkillName, replacePipeline } from "../helper/helper";
import { createEffectImage, createEffectSpan, createSkillSpan } from "./createSpan";

export const parseBaseDescription = ({
  text,
  shikigami,
  shikigamiMap,
  onmyojiMap,
  effectMap,
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
  shikigami,
  shikigamiMap,
  onmyojiMap,
  effectMap,
  isEnglish,
  currentSkillIndex,
}) => {
  return parseBaseDescription({
    text,
    shikigami,
    shikigamiMap,
    onmyojiMap,
    effectMap,
    isEnglish,
    skillReplacer: (_, type, id) => {
      const index = parseInt(id, 10);

      const name = getSkillName(shikigami, index, isEnglish);

      if (!name) return _;

      let variant = "normal";

      if (index !== currentSkillIndex + 1) {
        if (type === "kb") {
          variant = "bold";
        } else {
          variant = "highlight";
        }

        return createSkillSpan(name, variant);
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



const parseSkillDescriptio = (text) => {
  if (!text) return "";

  let processed = text;

  processed = replacePipeline(processed, [
    // ICONS
    [
      /<e>(.*?)<\/e>/g,
      (_, keyword) => `
          <img
            src="/assets/images/effects/${keyword}.webp"
            alt="${keyword}"
            class="inline-block w-6 h-6 align-text-bottom rounded-md"
          />
        `,
    ],

    // SHIKIGAMI
    [
      /<k>(.*?)<\/k>/g,
      (_, id) => {
        const shiki = shikigamiMap.value.get(String(id));

        if (!shiki) return _;

        return createEntitySpan(getLocalizedName(shiki), "shikigami");
      },
    ],

    // ONMYOJI
    [
      /<r>(.*?)<\/r>/g,
      (_, id) => {
        const onmyoji = onmyojiMap.value.get(String(id));

        if (!onmyoji) return _;

        return createEntitySpan(getLocalizedName(onmyoji), "onmyoji");
      },
    ],

    // CURRENT SKILL
    [
      /<(c|m|o)>(.*?)<\/\1>/g,
      (_, type, content) => {
        const index = parseInt(content);

        const name = getSkillName(shikigami.value, index);

        if (!name) return _;

        return createSkillSpan(name, type === "c", type === "c");
      },
    ],

    // OTHER SHIKI SKILL
    [
      /<(d|p)>(.*?)<\/\1>/g,
      (_, type, content) => {
        const [shikiId, skillIndex] = content.split("-");

        const shiki = shikigamiMap.value.get(String(shikiId));

        if (!shiki) return _;

        const name = getSkillName(shiki, parseInt(skillIndex));

        if (!name) return _;

        return createSkillSpan(name, type === "d", type === "d");
      },
    ],

    // EFFECTS
    [
      /<(f|g|b|a|h|i|l)>(.*?)<\/\1>/g,
      (_, type, content) => {
        const effect = resolveEffect(content);

        if (!effect) return _;

        let keyword = isEnglish.value
          ? effect.name?.en
          : effect.name?.vn || effect.name?.en;

        if (!keyword) return _;

        if (type === "f" || type === "l") {
          keyword = keyword.toLowerCase();
        }

        if (type === "g") {
          keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        }

        return createEffectSpan({
          effect,
          text: keyword,
          plain: type === "i" || type === "l",
          bold: type === "b" || type === "h",
        });
      },
    ],
  ]);

  return processed;
};
