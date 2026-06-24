import { getLocalizedName } from "../helper/helper";
import { createEntityLink } from "./createSpan";

export const renderBiographyText = ({
  biography,
  conditionMap,
  shikigami,
  shikigamiMap,
  onmyojiMap,
  language,
}) => {
  const bioTemplate = conditionMap.get(biography.no);

  if (!bioTemplate) return "";

  let text = bioTemplate.text?.[language];

  if (!text) return "";

  const replacements = {
    name: getLocalizedName(shikigami, language),
  };

  if (biography.count) {
    replacements.count = biography.count;
  }

  if (biography.skill) {
    const skill =
      shikigami?.skills?.[biography.skill - 1];

    replacements.skill = skill?.name?.[language];
  }

  if (biography.shiki) {
    const targetShiki = shikigamiMap.get(biography.shiki);;

    replacements.shiki = targetShiki
      ? createEntityLink({
        entity: targetShiki,
        type: "shikigami",
        language,
      })
      : "";
  }

  if (biography.onmyoji) {
    const targetOnmyoji = onmyojiMap.get(biography.onmyoji);

    replacements.onmyoji = targetOnmyoji
      ? createEntityLink({
        entity: targetOnmyoji,
        type: "onmyoji",
        language,
      })
      : "";
  }

  return text.replace(
    /\{(\w+)\}/g,
    (_, key) => replacements[key] ?? ""
  );
};