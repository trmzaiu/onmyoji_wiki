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

export const createEffectTooltip = (name, effect, html) => {
  const images = Array.isArray(effect.images)
    ? effect.images
    : effect.images
      ? [effect.images]
      : [];
  console.log(effect.images);

  const imageHtml = images
    .filter(Boolean)
    .map((image) => {
      const fileName = String(image).endsWith(".webp")
        ? image
        : `${image}.webp`;

      return `<img
          src="/assets/images/effects/${fileName}"
          alt="${escapeHtmlAttribute(name)}"
          class="effect-tooltip-image"
        />`;
    })
    .join("");

  return `<span
      class="effect-tooltip effect-keyword-${effect.color} font-bold"
      data-effect-id="${effect.id}"
    >${name}<span 
      class="effect-tooltip-card"><span 
      class="effect-tooltip-header">${
            imageHtml
              ? `<span class="effect-tooltip-images">${imageHtml}</span>`
              : ""
          }</span>
        <span class="effect-tooltip-text">${html}</span></span></span>`;
};

