const resolveEntity = ({
  content,
  listShikigami,
  listOnmyoji,
}) => {
  let targetType = null;
  let targetData = null;

  const onmyojiMatch = content.match(/^o-(\d+)$/i);

  if (onmyojiMatch) {
    const id = parseInt(onmyojiMatch[1], 10);

    targetData = listOnmyoji?.find(
      (o) => o.id === id
    );

    if (targetData) {
      targetType = "onmyoji";
    }
  } else {
    const shikiId = parseInt(content, 10);

    if (!isNaN(shikiId)) {
      targetData = listShikigami?.find(
        (s) => s.id === shikiId
      );

      if (targetData) {
        targetType = "shikigami";
      }
    }
  }

  return {
    targetType,
    targetData,
  };
};

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

  let keyword = "";
  let finalName = "";

  if (targetType === "shikigami") {
    keyword = isEnglish
      ? name?.en || name?.vn
      : name?.vn || name?.en;

    finalName =
      (Array.isArray(name?.jp)
        ? name.jp[1] || name.jp[0]
        : name?.jp) ||
      name?.en ||
      name?.vn;
  }

  if (targetType === "onmyoji") {
    keyword = isEnglish
      ? name?.en || name?.vn
      : name?.vn || name?.en;

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

export const renderProfileText = ({
  name,
  profile,
  isEnglish,
  listShikigami,
  listOnmyoji,
}) => {
  if (!profile) return "";

  const text = isEnglish
    ? profile?.en
    : profile?.vn;

  if (!text) return "";

  let result = text;

  /**
   * <n>1</n>
   * self shikigami
   */
  result = result.replace(
    /<n>(.*?)<\/n>/g,
    isEnglish
      ? name.en
      : name.vn
  );

  /*
   * <s>1</s>
   * other shikigami
   */
  result = result.replace(
    /<s>(.*?)<\/s>/g,
    (match, inner) => {
      const content = inner.trim();

      const {
        targetType,
        targetData,
      } = resolveEntity({
        content,
        listShikigami,
        listOnmyoji,
      });

      if (!targetType || !targetData) {
        return match;
      }

      const keyword = getDisplayName({
        targetData,
        isEnglish,
      });

      return `<span class="other-shiki">${keyword}</span>`;
    }
  );

  /*
   * <h>1</h>
   * highlight other shikigami
   */
  result = result.replace(
    /<h>(.*?)<\/h>/g,
    (match, inner) => {
      const content = inner.trim();

      const {
        targetType,
        targetData,
      } = resolveEntity({
        content,
        listShikigami,
        listOnmyoji,
      });

      if (!targetType || !targetData) {
        return match;
      }

      const {
        keyword,
        finalName,
      } = getEntityLinkData({
        targetType,
        targetData,
        isEnglish,
      });

      return `<a href="/${targetType}/${encodeURIComponent(
        finalName
      )}"><span class="other-shiki-highlight font-bold">${keyword}</span></a>`;
    }
  );

  return result;
};