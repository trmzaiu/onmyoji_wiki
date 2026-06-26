export function renderSkinText({
  text,
  shikigami,
  language,
}) {
  return text.replace(
    /<n>(\d+)<\/n>/g,
    (_, id) => {
      const index = parseInt(id, 10);

      const skinItem =
        shikigami.rarity !== "SP"
          ? shikigami.skins?.[index + 1]
          : shikigami.skins?.[index];

      if (!skinItem) {
        return _;
      }

      const keyword = skinItem.name?.[language];

      return `<span class="skin-keyword">${keyword}</span>`;
    }
  );
}

