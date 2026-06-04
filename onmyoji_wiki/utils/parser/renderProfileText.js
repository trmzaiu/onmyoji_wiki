const getDisplayName = ({
  targetData,
  isEnglish,
}) => {
  if (!targetData) return "";

  const name = targetData.name;

  return isEnglish
    ? name?.en || name?.vn || ""
    : name?.vn || name?.en || "";
};

const getEntityLinkData = ({
  targetType,
  targetData,
  isEnglish,
}) => {
  if (!targetData) {
    return {
      keyword: "",
      finalName: "",
    };
  }

  const name = targetData.name;

  const keyword = isEnglish
    ? name?.en || name?.vn
    : name?.vn || name?.en;

  let finalName = "";

  if (targetType === "shikigami") {
    finalName =
      (Array.isArray(name?.jp)
        ? name.jp[1] || name.jp[0]
        : name?.jp) ||
      name?.en ||
      name?.vn;
  } else {
    finalName =
      name?.en ||
      name?.vn ||
      "";
  }

  return {
    keyword,
    finalName: finalName.replace(/\s+/g, "_"),
  };
};

const renderEntity = ({
  targetType,
  targetData,
  isEnglish,
  displayedEntities,
}) => {
  const keyword = getDisplayName({
    targetData,
    isEnglish,
  });

  const { finalName } = getEntityLinkData({
    targetType,
    targetData,
    isEnglish,
  });

  const entityKey = `${targetType}-${targetData.id}`;

  // First appearance
  if (!displayedEntities.has(entityKey)) {
    displayedEntities.add(entityKey);

    return `<span class="other-shiki font-bold">${keyword}</span>`;
  }

  // Later appearances
  return `<a href="/${targetType}/${encodeURIComponent(
    finalName
  )}"><span class="other-shiki">${keyword}</span></a>`;
};

export const renderProfileText = ({
  shikigami,
  profile,
  isEnglish,
  listShikigami,
  listOnmyoji,
}) => {
  if (!profile) return "";

  const text = isEnglish
    ? profile.en
    : profile.vn;

  if (!text) return "";

  const displayedEntities = new Set();

  let result = text;

  // Shikigami
  result = result.replace(
    /<s>(.*?)<\/s>/g,
    (match, inner) => {
      const id = Number(inner.trim());

      // Current shikigami => normal text
      if (id === shikigami.id) {
        return isEnglish
          ? shikigami.name.en
          : shikigami.name.vn;
      }

      const targetData = listShikigami?.find(
        (s) => s.id === id
      );

      if (!targetData) {
        return match;
      }

      return renderEntity({
        targetType: "shikigami",
        targetData,
        isEnglish,
        displayedEntities,
      });
    }
  );

  // Onmyoji
  result = result.replace(
    /<o>(.*?)<\/o>/g,
    (match, inner) => {
      const id = Number(inner.trim());

      const targetData = listOnmyoji?.find(
        (o) => o.id === id
      );

      if (!targetData) {
        return match;
      }

      return renderEntity({
        targetType: "onmyoji",
        targetData,
        isEnglish,
        displayedEntities,
      });
    }
  );

  return result;
};