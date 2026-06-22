import { createSkillSpan } from "./createSpan";

export function renderEvolutionText({
  evolutionData,
  evolutionTemplate,
  shikigami,
  isEnglish,
}) {
  if (!evolutionTemplate) return "";

  const localizedText = isEnglish
    ? evolutionTemplate.text?.en
    : evolutionTemplate.text?.vn;

  if (!localizedText) return "";

  const replacements = {
    name: isEnglish
      ? shikigami.name?.en
      : shikigami.name?.vn,
  };

  if (evolutionData.skill) {
    const skillName = isEnglish
      ? shikigami.skills?.[evolutionData.skill - 1]?.name?.en
      : shikigami.skills?.[evolutionData.skill - 1]?.name?.vn;

    replacements.skill = createSkillSpan(skillName, "bold", evolutionData.skill - 1);
  }

  if (evolutionData.count) {
    replacements.count = evolutionData.count;
  }

  return localizedText.replace(
    /\{(\w+)\}/g,
    (_, key) =>
      replacements[key] ?? ""
  );
}

