import { getLocalizedName } from "../helper/helper";
import { createEffectSpan, createEffectTooltip } from "./createSpan";
import { parseBaseDescription } from "./skillParser";

export const parseSoulDescription = ({
  text,
  effectMap,
  language,
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
      language,
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
    language,
    effectReplacer,
  });
};