const getDisplayName = ({
  targetData,
  language = "en",
}) => {
  if (!targetData) return "";

  const name = targetData.name;

  return (
    name?.[language] ??
    name?.en ??
    name?.vn ??
    name?.cn ??
    ""
  );
};

const getEntityLinkData = ({
  targetType,
  targetData,
  language = "en",
}) => {
  if (!targetData) {
    return {
      keyword: "",
      finalName: "",
    };
  }

  const name = targetData.name;

  const keyword =
    name?.[language] ??
    name?.en;

  let finalName = "";

  if (targetType === "shikigami") {
    finalName =
      (Array.isArray(name?.jp)
        ? name.jp[1] ?? name.jp[0]
        : name?.jp) ??
      name?.en
    "";
  } else {
    finalName =
      name?.en ??
      name?.vn ??
      name?.cn ??
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
  language,
  displayedEntities,
}) => {
  const keyword = getDisplayName({
    targetData,
    language,
  });

  const { finalName } = getEntityLinkData({
    targetType,
    targetData,
    language,
  });

  const entityKey = `${targetType}-${targetData.id}`;
  const isFirst = !displayedEntities.has(entityKey);

  displayedEntities.add(entityKey);

  if (!isFirst) {
    return `<span class="other-shiki">${keyword}</span>`;
  }

  return `<a
      class="other-shiki font-bold"
      href="/${targetType}/${encodeURIComponent(finalName)}"
    >${keyword}</a>`;
};

export const renderProfileText = ({
  shikigami,
  profile,
  language,
  listShikigami,
  listOnmyoji,
}) => {
  if (!profile) return "";

  const text =
    profile?.[language] ??
    profile?.en ??
    "";

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
        return shikigami.name?.[language];
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
        language,
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
        language,
        displayedEntities,
      });
    }
  );

  return result;
};