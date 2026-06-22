export const createEntityLink = ({
  entity,
  type,
  isEnglish,
}) => {
  const keyword = isEnglish
    ? entity.name.en
    : entity.name.vn;

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