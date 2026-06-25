import { getLocalizedName } from "../helper/helper";

export const createEntityLink = ({
  entity,
  type,
  language,
}) => {
  const keyword = getLocalizedName(entity, language);

  const slug =
    type === "shikigami"
      ? (
        Array.isArray(entity.name.jp)
          ? entity.name.jp[1]
          : entity.name.jp
      )
      : entity.name.en;

  return `<a href="/${type}/${encodeURIComponent(slug.replace(/\s+/g, "_")
  )}"class="bio-name-keyword font-bold">${keyword}</a>`;
};

export const createEffectImage = (keyword) => {
  return `<img src="/assets/images/effects/${keyword}.webp" alt="${keyword}" class="effect-image"/>`
}

export const createEntitySpan = (keyword) => {
  return `<span>${keyword}</span>`;
};

export const createSkillSpan = (name, variant, skillIndex) => {
  return `<span class="skill-keyword skill-keyword-${variant}" data-skill-index="${skillIndex}"
    >${name}</span>`;
};

export const createEffectSpan = (name, bold, color) => {
  return `<span class="effect-keyword effect-keyword-${color} ${bold ? "font-bold" : ""}"
>${name}</span>`;
};

const escapeHtmlAttribute = (text = "") =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const createEffectTooltip = (name, bold, effect, text) => {
  return `<span
    class="effect-tooltip effect-keyword-${effect.color} ${bold ? "font-bold" : ""}"
    data-effect-id="${effect.id}"
    data-tooltip="${escapeHtmlAttribute(text)}"
  >${name}</span>`;
};

