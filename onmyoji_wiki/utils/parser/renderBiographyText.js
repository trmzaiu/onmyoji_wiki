import { createEntityLink } from "./createSpan";

export const renderBiographyText = ({
  biography,
  conditionMap,
  shikigami,
  shikigamiMap,
  onmyojiMap,
  isEnglish,
}) => {
  const bioTemplate = conditionMap.get(biography.no);

  if (!bioTemplate) return "";

  let text = isEnglish
    ? bioTemplate.text?.en
    : bioTemplate.text?.vn;

  if (!text) return "";

  const name = isEnglish
    ? shikigami?.name?.en
    : shikigami?.name?.vn;

  const replacements = { name };

  if (biography.count) {
    replacements.count = biography.count;
  }

  if (biography.skill) {
    const skill =
      shikigami?.skills?.[biography.skill - 1];

    replacements.skill = isEnglish
      ? skill?.name?.en
      : skill?.name?.vn;
  }

  if (biography.shiki) {
    const targetShiki = shikigamiMap.get(biography.shiki);;

    replacements.shiki = targetShiki
      ? createEntityLink({
        entity: targetShiki,
        type: "shikigami",
        isEnglish,
      })
      : "";
  }

  if (biography.onmyoji) {
    const targetOnmyoji = onmyojiMap.get(biography.onmyoji);

    replacements.onmyoji = targetOnmyoji
      ? createEntityLink({
        entity: targetOnmyoji,
        type: "onmyoji",
        isEnglish,
      })
      : "";
  }

  return text.replace(
    /\{(\w+)\}/g,
    (_, key) => replacements[key] ?? ""
  );
};