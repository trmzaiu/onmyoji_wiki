import { uiText } from "~/constants/uiText";

export const replacePipeline = (text, transformers) => {
  return transformers.reduce(
    (acc, [regex, replacer]) => acc.replace(regex, replacer),
    text
  );
};

export const getUIText = (key, language = "en") => {
  return uiText[language]?.[key] ?? uiText.en?.[key] ?? key;
};

export const getLocalizedName = (obj, language = "en") => {
  if (!obj?.name) return "";

  const name = obj.name;

  if (language === "cn") {
    return Array.isArray(name.cn)
      ? name.cn[0] ?? name.en ?? ""
      : name.cn ?? name.en ?? "";
  }

  return name?.[language] ?? name.en ?? "";
};

export const getSkillName = (shiki, index, language = "en") => {
  if (!shiki?.skills?.length) return "";

  const skill = shiki.skills[index - 1];

  if (!skill) return "";

  return getLocalizedName(skill, language);
};

