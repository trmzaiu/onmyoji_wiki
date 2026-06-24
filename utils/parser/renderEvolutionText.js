import { createSkillSpan } from "./createSpan";

export function renderEvolutionText({
  evolutionData,
  evolutionTemplate,
  shikigami,
  language = "en",
}) {
  if (!evolutionTemplate || !evolutionData || !shikigami) return "";

  const localizedText =
    evolutionTemplate.text?.[language] ??
    evolutionTemplate.text?.en ??
    "";

  if (!localizedText) return "";

  const replacements = {
    name:
      shikigami.name?.[language] ??
      shikigami.name?.en ??
      "",
  };

  if (evolutionData.skill) {
    const skillIndex = evolutionData.skill - 1;

    const skillName =
      shikigami.skills?.[skillIndex]?.name?.[language] ??
      shikigami.skills?.[skillIndex]?.name?.en ??
      "";

    replacements.skill = createSkillSpan(
      skillName,
      "bold",
      skillIndex
    );
  }

  if (evolutionData.count !== undefined && evolutionData.count !== null) {
    replacements.count = evolutionData.count;
  }

  return localizedText.replace(
    /\{(\w+)\}/g,
    (_, key) => replacements[key] ?? ""
  );
}

