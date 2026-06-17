export const replacePipeline = (text, transformers) => {
  return transformers.reduce(
    (acc, [regex, replacer]) => acc.replace(regex, replacer),
    text
  );
};

export const getLocalizedName = (obj, isEnglish) => {
  if (!obj) return "";

  return isEnglish ? obj.name?.en : obj.name?.vn;
};

export const getSkillName = (shiki, index, isEnglish) => {

  if (!shiki?.skills?.length) return "";

  const skill = shiki.skills[index - 1];

  if (!skill) return "";

  return getLocalizedName(skill, isEnglish);
};
