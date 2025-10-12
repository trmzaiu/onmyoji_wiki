<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { useTags } from "@/utils/useTags";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

/* ---------------------- GLOBAL ---------------------- */
const supabase = useSupabase();
const route = useRoute();
const { tagMap, loadTags } = useTags();

const formattedName = route.params.name.replace(/_/g, " ");

/* ---------------------- STATE ---------------------- */
const shikigami = ref(null);
const shikigamiList = ref([]);
const onmyojiList = ref(null);
const effects = ref([]);
const illustrations = ref([]);
const conditions = ref([]);
const evolution = ref(null);
const isEnglish = ref(true);

// UI
const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

const activeTab = ref("main");
const activeSkillIndex = ref(0);

const showEditModal = ref(false);
const editingSkill = ref(null);
const editingSkillIndex = ref(-1);

const tagsInput = ref("");
const notesInput = ref("");

const selectedImage = ref(null);
const isModalOpen = ref(false);

const openModal = (url) => {
  selectedImage.value = url;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedImage.value = null;
};


/* ---------------------- HELPERS ---------------------- */
const getImgUrl = (name) =>
  `/assets/illustrations/${name.replace(/ /g, "_")}.jpg`;

// SS: 171 -> 197, S: 140 -> 166, A: 127 -> 133, B: 114 -> 124, C: 102 -> 109, D: 75 -> 100
const getATKRank = (atk) => {
  if (atk >= 171 && atk <= 197) return "SS";
  else if (atk >= 140 && atk <= 166) return "S";
  else if (atk >= 127 && atk <= 133) return "A";
  else if (atk >= 114 && atk <= 124) return "B";
  else if (atk >= 102 && atk <= 109) return "C";
  else return "D";
};

const getATKImage = (atk) => {
  const rank = getATKRank(atk);
  return `/assets/stats/${rank}.webp`;
};

// SS: 3618 -> 4153, S: 2948 -> 3597, A: 2894 -> 2921, B: 2412 -> 2466, C: 2144 -> 2385, D: 1822 -> 1849
const getATKEvoRank = (atk) => {
  if (atk >= 3618 && atk <= 4153) return "SS";
  else if (atk >= 2948 && atk <= 3597) return "S";
  else if (atk >= 2894 && atk <= 2921) return "A";
  else if (atk >= 2412 && atk <= 2466) return "B";
  else if (atk >= 2144 && atk <= 2385) return "C";
  else return "D";
};

const getATKEvoImage = (atk) => {
  const rank = getATKEvoRank(atk);
  return `/assets/stats/${rank}.webp`;
};

// S: 1163 -> 1335, A: 1064 -> 1142, B: 960 -> 1056, C: 854 -> 950, D: 843 -> 843
const getHPRank = (hp) => {
  if (hp >= 1163 && hp <= 1335) return "S";
  else if (hp >= 1064 && hp <= 1142) return "A";
  else if (hp >= 960 && hp <= 1056) return "B";
  else if (hp >= 854 && hp <= 950) return "C";
  else return "D";
};

const getHPImage = (hp) => {
  const rank = getHPRank(hp);
  return `/assets/stats/${rank}.webp`;
};

// SS: 15392 -> 15392, S: 12532 -> 14925, A: 11393 -> 12418, B: 10254 -> 11279, C: 9684 -> 10140, D: 0 -> 0
const getHPEvoRank = (hp) => {
  if (hp >= 15392 && hp <= 15392) return "SS";
  else if (hp >= 12532 && hp <= 14925) return "S";
  else if (hp >= 11393 && hp <= 12418) return "A";
  else if (hp >= 10254 && hp <= 11279) return "B";
  else if (hp >= 9684 && hp <= 10140) return "C";
  else return "D";
};

const getHPEvoImage = (hp) => {
  const rank = getHPEvoRank(hp);
  return `/assets/stats/${rank}.webp`;
};

// S: 83 -> 94, A: 75 -> 82, B: 68 -> 74, C: 60 -> 67, D: 54 -> 59
const getDEFRank = (def) => {
  if (def >= 83 && def <= 94) return "S";
  else if (def >= 75 && def <= 82) return "A";
  else if (def >= 68 && def <= 74) return "B";
  else if (def >= 60 && def <= 67) return "C";
  else return "D";
};

const getDEFImage = (def) => {
  const rank = getDEFRank(def);
  return `/assets/stats/${rank}.webp`;
};

// SS: 595 -> 595, S: 485 -> 490, A: 441 -> 481, B: 397 -> 437, C: 353 -> 392, D: 0 -> 0
const getDEFEvoRank = (def) => {
  if (def >= 595 && def <= 595) return "SS";
  else if (def >= 485 && def <= 490) return "S";
  else if (def >= 441 && def <= 481) return "A";
  else if (def >= 397 && def <= 437) return "B";
  else if (def >= 353 && def <= 392) return "C";
  else return "D";
};

const getDEFEvoImage = (def) => {
  const rank = getDEFEvoRank(def);
  return `/assets/stats/${rank}.webp`;
};

const getSPDRank = (spd) => {
  if (spd >= 110 && spd <= 127) return "S";
  else if (spd >= 105 && spd <= 109) return "A";
  else if (spd >= 100 && spd <= 104) return "B";
  else if (spd >= 95 && spd <= 99) return "C";
  else return "D";
};

const getSPDImage = (spd) => {
  const rank = getSPDRank(spd);
  return `/assets/stats/${rank}.webp`;
};

const getCritRank = (crit) => {
  if (crit >= 16) return "SS";
  else if (crit >= 10 && crit <= 15) return "S";
  else if (crit >= 8 && crit <= 9) return "A";
  else if (crit >= 5 && crit <= 5) return "B";
  else if (crit >= 3 && crit <= 3) return "C";
  else return "D";
};

const getCritImage = (crit) => {
  const rank = getCritRank(crit);
  return `/assets/stats/${rank}.webp`;
};

/* ---------------------- EVOLUTION RENDER ---------------------- */
const renderEvoText = (evo) => {
  const evoTemplate = evolution.value
  if (!evoTemplate) {
    return ""
  }
  if (!evoTemplate) return ""

  let text = isEnglish.value ? evoTemplate.text.en : evoTemplate.text.vn
  if (!text) return ""

  const replacements = { name: isEnglish.value ? shikigami.value.name.en : shikigami.value.name.vn }

  if (evo.skill) {
    const targetSkill = isEnglish.value ? shikigami.value.skills[evo.skill - 1].name.en : shikigami.value.skills[evo.skill - 1].name.vn
    replacements.skill = highlightWord(targetSkill);
  }

  return text.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? "")
}

/* ---------------------- BIO RENDER ---------------------- */
const renderBioText = (biography) => {
  const bioTemplate = conditions.value.find(b => b.id === biography.no)
  if (!bioTemplate) {
    return ""
  }
  if (!bioTemplate) return ""

  let text = isEnglish.value ? bioTemplate.text.en : bioTemplate.text.vn
  if (!text) return ""

  const name = isEnglish.value ? shikigami.value.name.en : shikigami.value.name.vn

  const replacements = { name }

  if (biography.count) replacements.count = biography.count
  if (biography.skill) replacements.skill = isEnglish.value ? shikigami.value.skill[biography.skill-1].name.en : shikigami.value.skill[biography.skill-1].name.vn
  if (biography.shiki) {
    const targetShiki = shikigamiList.value.find(s => s.id === biography.shiki)
    if (targetShiki) {
      const shikiName = isEnglish.value ? targetShiki.name.en : targetShiki.name.vn
      replacements.shiki = makeHighlight(shikiName, "shikigami")
    } else {
      replacements.shiki = ""
    }
  }

  if (biography.onmyoji) {
    const targetOnmyoji = onmyojiList.value.find(o => o.id === biography.onmyoji)
    if (targetOnmyoji) {
      const onmyojiName = isEnglish.value ? targetOnmyoji.name.en : targetOnmyoji.name.vn
      replacements.onmyoji = makeHighlight(onmyojiName, "onmyoji")
    } else {
      replacements.onmyoji = ""
    }
  }

  return text.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? "")
}

const makeHighlight = (keyword, type) => {
  if (!keyword || !type) return keyword || ""

  let finalName = keyword

  if (type === "shikigami") {
    const targetShikigami = shikigamiList.value?.find(s =>
      [s.name.en, s.name.vn, ...(Array.isArray(s.name.jp) ? s.name.jp : [s.name.jp])]
        .filter(Boolean)
        .some(n => n.toLowerCase() === keyword.toLowerCase())
    )
    if (targetShikigami) {
      const n = targetShikigami.name
      finalName = Array.isArray(n.jp) ? n.jp[1] || n.jp[0] : n.jp || keyword
    }
  }

  if (type === "onmyoji") {
    const targetOnmyoji = onmyojiList.value?.find(o =>
      [o.name.en, o.name.vn, ...(Array.isArray(o.name.jp) ? o.name.jp : [o.name.jp])]
        .filter(Boolean)
        .some(n => n.toLowerCase() === keyword.toLowerCase())
    )
    if (targetOnmyoji) {
      finalName = targetOnmyoji.name.en || keyword
    }
  }

  finalName = finalName.replace(/\s+/g, "_")

  return `<b><a href="/${type}/${encodeURIComponent(finalName)}" class="text-[#a51919] font-bold">${keyword}</a></b>`
}

/* ---------------------- TOOLTIP ---------------------- */
const imgs = computed(() => tooltipData.value?.images || []);

const processTextWithTooltips = (text) => {
  if (!text || !effects.value?.length) return text;

  let processedText = text;
  const effectById = new Map(effects.value.map((e) => [String(e.id), e]));
  const effectMap = new Map();
  const effectKeywordOverrides = new Map();

  // build effectMap
  effects.value.forEach((note) => {
    const addToMap = (n) => {
      const names = [];
      if (n.name?.en) names.push(n.name.en);
      if (n.name?.vn && n.name.vn !== n.name.en) names.push(n.name.vn);
      if (n.name?.cn && n.name.cn !== n.name.en && n.name.cn !== n.name.vn) {
        names.push(n.name.cn);
      }
      names.forEach((name) => {
        if (!effectMap.has(name.toLowerCase())) {
          effectMap.set(name.toLowerCase(), n);
        }
      });
    };

    addToMap(note);
    if (note.subs?.length) {
      note.subs.forEach((subId) => {
        const sub = effectById.get(subId);
        if (sub) addToMap(sub);
      });
    }
  });

  const colorMap = { red: "#a63f37", blue: "#4994d4", yellow: "#c07b2a" };

  processedText = processedText.replace(/<b>(\d+)<\/b>(?:<n>(.*?)<\/n>)?/g, (match, id, nValue) => {
    const note = effectById.get(id);
    if (!note) return match;

    let textVN = note.name?.vn;
    let textEN = note.name?.en;

    textVN = textVN.replace("{count}", nValue || "").trim();

    effectKeywordOverrides.set(id, isEnglish.value ? textEN : textVN);

    return `<b>${id}</b>`; 
  });

  processedText = processedText.replace(/<n>.*?<\/n>/g, "");

  const replaceWithTooltip = (match, content, type) => {
    let note = null;

    if (/^\d+$/.test(content)) {
      note = effectById.get(content);
    } else {
      note = effectMap.get(content.toLowerCase());
    }

    if (!note) return match;

    let keywordForDisplay;
    let keywordForTooltip;

    if (type === "b") {
      // <b> dùng override (đã chèn {count})
      const keywordOverride = effectKeywordOverrides.get(String(note.id));
      keywordForDisplay = keywordOverride
        ? keywordOverride
        : (isEnglish.value ? note.name?.en : note.name?.vn || note.name?.en);
      keywordForTooltip = isEnglish.value
        ? note.name?.en
        : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
    } else {
      // tag khác: bỏ {count} khỏi text và tooltip
      keywordForDisplay = isEnglish.value ? note.name?.en : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
      keywordForTooltip = keywordForDisplay;
    }

    const noteDesc = isEnglish.value ? note.description?.en : note.description?.vn;
    const color = note.color ? colorMap[note.color] || "#a51919" : "#a51919";

    let keyword = keywordForDisplay;

    if (type === "f" || type === "l") {
      if (keyword.startsWith("HP ")) {
        keyword = "HP " + keyword.slice(3).toLowerCase();
      } else if (keyword.toUpperCase() === "HP") {
        keyword = "HP";
      } else {
        keyword = keyword.toLowerCase();
      }
    }

    if (type === "g") {
      keyword = keyword.toLowerCase();
      keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }

    if (type === "b") {
      return `<span class="effect-tooltip"
                data-name="${keywordForTooltip}"
                data-name-cn="${note.name?.cn || ""}"
                data-desc="${noteDesc ? noteDesc.replace(/"/g, "&quot;") : ""}"
                data-img='${JSON.stringify(note.images || [])}'
                data-color="${color}"
                style="color:${color}">${keyword}</span>`;
    } else {
      return (type === "i" || type === "l")
        ? `<span>${keyword}</span>`
        : `<span class="effect-highlight" style="color:${color}">${keyword}</span>`;
    }
  };

  const replaceShikigami = (match, content) => {
    if (!shikigamiList?.value?.length) return match;
    const shiki = shikigamiList.value.find(
      (s) => String(s.id) === String(content)
    );
    if (!shiki) return match;

    const keyword = isEnglish.value
      ? shiki.name?.en || ""
      : shiki.name?.vn || shiki.name?.en || "";

    return `<span>${keyword}</span>`;
  };

  const replaceSkill = (match, content, type) => {
    const index = parseInt(content, 10);
    if (isNaN(index) || !shikigami.value?.skills?.length) return match;
    const skill = shikigami.value?.skills[index-1];
    if (!skill) return match;

    const keyword = isEnglish.value
      ? skill.name?.en || ""
      : skill.name?.vn || skill.name?.en || "";

    if (type === "c") {
      return `<span class="skill-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${keyword}">${keyword}</span>`;
    } else if (type === "m") {
      return `<span class="skill-keyword text-[#c07b2a]">${keyword}</span>`;
    } else if (type === "o") {
      return `<span >${keyword}</span>`;
    }

    return match;
  };

  const replaceSkillRef = (match, content) => {
    console.log("[replaceSkillRef] raw content:", content);

    const [shikiIdStr, skillIndexStr] = content.split("-");
    const shikiId = parseInt(shikiIdStr, 10);
    const skillIndex = parseInt(skillIndexStr, 10);

    if (!shikigamiList?.value?.length) return match;

    let shiki = shikigamiList.value.find(
      (s) => String(s.id) === String(shikiId)
    );
    console.log("[replaceSkillRef] found in list:", shiki);

    if (!shiki || !shiki.skills?.length) {
      return match;
    }

    const skill = shiki.skills[skillIndex - 1];

    if (!skill) {
      return match;
    }

    const keyword = isEnglish.value
      ? (skill.name?.en || "")
      : (skill.name?.vn || skill.name?.en || "");

    return `<span class="skill-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${keyword}">${keyword}</span>`;
  };

  // === xử lý các tag đặc biệt ===
  processedText = processedText
    .replace(/<e>(.*?)<\/e>/g, (_, keyword) =>
      `<img src="/assets/effects/${keyword}.webp" alt="${keyword}" class="inline-block w-6 h-6 align-text-bottom rounded rounded-md" />`
    )
    .replace(/<k>(.*?)<\/k>/g, (m, content) => replaceShikigami(m, content));

  processedText = processedText.replace(/<d>(.*?)<\/d>/g, replaceSkillRef);

  processedText = processedText.replace(/<(c|m)>(.*?)<\/\1>/g, (m, type, content) =>
    replaceSkill(m, content, type)
  );

  // f, g, b, a, h
  processedText = processedText.replace(/<(f|g|b|a|h|i|l)>(.*?)<\/\1>/g, (m, type, content) =>
    replaceWithTooltip(m, content, type)
  );

  return processedText;
};

const highlightWord = (text) => {
  if (!text) return "";
  return `<span class="skill-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${text}">${text}</span>`;
};

const highlightSkin = (content) => {
  if (!content || !shikigami?.value?.skins?.length) return content;

  return content.replace(/<b>(\d+)<\/b>/g, (_, num) => {
    const index = parseInt(num, 10);
    const skinItem = shikigami.value.rarity !== 'SP'
      ? shikigami.value.skins[index + 1]
      : shikigami.value.skins[index ];

    if (!skinItem) return _;

    const keyword = skinItem.name?.en || skinItem.name?.cn || "";
    return `<span class="text-[#c07b2a]">${keyword}</span>`;
  });
};

const matchedSubNotes = computed(() => {
  if (!tooltipData.value || !effects.value?.length) return [];

  const effectById = new Map(effects.value.map((e) => [e.id, e]));
  const displayedSubs = new Set(); // chỉ track subs

  const findNotes = (descObj) => {
    const result = [];
    const text = typeof descObj === "string"
      ? descObj
      : isEnglish.value
        ? descObj?.en || ""
        : descObj?.vn || "";

    const bMatches = text.match(/<b>(.*?)<\/b>/g) || [];
    bMatches.forEach((bTag) => {
      const inner = bTag.replace(/<b>|<\/b>/g, "");
      const nums = inner.match(/\d+/g) || [];
      nums.forEach((numStr) => {
        const id = Number(numStr);
        const note = effectById.get(id);
        if (note) {
          result.push({ ...note });
        }
      });
    });

    return result;
  };

  // subNotes
  const subs = findNotes(tooltipData.value.description);

  subs.forEach((sub) => {
    displayedSubs.add(sub.id); // đánh dấu sub
  });

  // sub-subNotes (chỉ loại nếu đã có trong subs)
  subs.forEach((sub, i) => {
    const subsubNotes = findNotes(sub.description);
    subs[i].subNotes = subsubNotes.filter((subsub) => {
      if (displayedSubs.has(subsub.id)) return false;
      return true;
    });
  });

  return subs;
});

const highlightProfileText = (profile) => {
  if (!profile) return "";
  const text = isEnglish.value ? profile.en : profile.vn;
  if (!text) return "";

  let result = text;

  result = result.replace(/<a([^>]*)>(.*?)<\/a>/g, (match, attrs, inner) => {
    const content = inner.trim();
    if (!content) return match;

    let targetType = null;
    let targetData = null;

    // check onmyoji dạng o-<id>
    const onmyojiMatch = content.match(/^o-(\d+)$/i);
    if (onmyojiMatch) {
      const id = parseInt(onmyojiMatch[1], 10);
      targetData = onmyojiList.value?.find(o => o.id === id);
      if (targetData) targetType = "onmyoji";
    } else {
      // mặc định là shikigami id
      const shikiId = parseInt(content, 10);
      if (!isNaN(shikiId)) {
        targetData = shikigamiList.value?.find(s => s.id === shikiId);
        if (targetData) targetType = "shikigami";
      }
    }

    if (!targetType || !targetData) return match;

    let keyword = "";
    if (targetType === "shikigami") {
      const n = targetData.name;
      keyword = isEnglish.value ? n.en || n.vn : n.vn || n.en;
    } else if (targetType === "onmyoji") {
      const n = targetData.name;
      keyword = isEnglish.value ? n.en || n.vn : n.vn || n.en;
    }

    return `<a${attrs}>${keyword}</a$>`;
  });

  result = result.replace(/<c>(.*?)<\/c>/g, (match, inner) => {
    const content = inner.trim();
    if (!content) return match;

    let targetType = null;
    let targetData = null;

    // check onmyoji dạng o-<id>
    const onmyojiMatch = content.match(/^o-(\d+)$/i);
    if (onmyojiMatch) {
      const id = parseInt(onmyojiMatch[1], 10);
      targetData = onmyojiList.value?.find(o => o.id === id);
      if (targetData) targetType = "onmyoji";
    } else {
      // mặc định là shikigami id
      const shikiId = parseInt(content, 10);
      if (!isNaN(shikiId)) {
        targetData = shikigamiList.value?.find(s => s.id === shikiId);
        if (targetData) targetType = "shikigami";
      }
    }

    if (!targetType || !targetData) return match;

    const n = targetData.name;
    const keyword = isEnglish.value ? n.en || n.vn : n.vn || n.en;

    return `<span class="text-[#a51919]">${keyword}</span>`;
  });

  result = result.replace(/<b>(.*?)<\/b>/g, (match, inner) => {
    const content = inner.trim();
    if (!content) return match;

    let targetType = null;
    let targetData = null;

    // onmyoji dạng o-<id>
    const onmyojiMatch = content.match(/^o-(\d+)$/i);
    if (onmyojiMatch) {
      const id = parseInt(onmyojiMatch[1], 10);
      targetData = onmyojiList.value?.find(o => o.id === id);
      if (targetData) targetType = "onmyoji";
    } else {
      // shikigami id
      const shikiId = parseInt(content, 10);
      if (!isNaN(shikiId)) {
        targetData = shikigamiList.value?.find(s => s.id === shikiId);
        if (targetData) targetType = "shikigami";
      }
    }

    if (!targetType || !targetData) return match;

    let finalName = "";
    let keyword = "";

    if (targetType === "shikigami") {
      const n = targetData.name;
      finalName = (Array.isArray(n.jp) ? n.jp[1] || n.jp[0] : n.jp) || n.en || n.vn;
      keyword = isEnglish.value ? n.en || n.vn : n.vn || n.en;
    } else if (targetType === "onmyoji") {
      const n = targetData.name;
      finalName = n.en || n.vn;
      keyword = isEnglish.value ? n.en || n.vn : n.vn || n.en;
    }

    finalName = finalName.replace(/\s+/g, "_");

    return `<b><a href="/${targetType}/${encodeURIComponent(finalName)}" class="text-[#a51919] font-bold">${keyword}</a></b>`;
  });

  return result;
};

/* ---------------------- TOOLTIP EVENTS ---------------------- */
const handleMouseEnter = (e) => {
  const target = e.currentTarget;
  tooltipData.value = {
    name: target.getAttribute("data-name"),
    description: target.getAttribute("data-desc"),
    images: target.getAttribute("data-img")
      ? JSON.parse(target.getAttribute("data-img"))
      : [],
    color: target.getAttribute("data-color"),
    cn: target.getAttribute("data-name-cn"), 
  };
  updateTooltipPosition(e);
  showTooltip.value = true;
};
const handleMouseLeave = () => (showTooltip.value = false);
const handleMouseMove = (e) => showTooltip.value && updateTooltipPosition(e);
const updateTooltipPosition = (e) =>
  (tooltipPosition.value = { x: e.clientX, y: e.clientY + 10 });

function addTooltipListeners() {
  document.querySelectorAll(".effect-tooltip").forEach((span) => {
    span.addEventListener("mouseenter", handleMouseEnter);
    span.addEventListener("mouseleave", handleMouseLeave);
    span.addEventListener("mousemove", handleMouseMove);
  });
}
function removeTooltipListeners() {
  document.querySelectorAll(".effect-tooltip").forEach((span) => {
    span.removeEventListener("mouseenter", handleMouseEnter);
    span.removeEventListener("mouseleave", handleMouseLeave);
    span.removeEventListener("mousemove", handleMouseMove);
  });
}

/* ---------------------- DATA FETCHING ---------------------- */
async function fetchAllEffects() {
  const { data, error } = await supabase
    .from("Effect")
    .select("*")
    .order("id", { ascending: true });
  if (error) console.error("Error fetching effects:", error);
  else effects.value = data;
}

async function fetchConditions() {
  const { data, error } = await supabase
    .from("Bio")
    .select("*")
    .order("id", { ascending: true });
  if (error) console.error("Error fetching conditions:", error);
  else conditions.value = data;
}

async function fetchEvolution(id) {
  const { data, error } = await supabase
    .from("Evolution")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("Error fetching evolution:", error);
  else evolution.value = data;
}

async function fetchAllOnmyoji() {
  const { data, error } = await supabase
    .from("Onmyoji")
    .select("id, name")
    .order("id", { ascending: true });
  if (error) console.error("Error fetching onmyoji:", error);
  else onmyojiList.value = data;
}

async function fetchAllShikigami() {
  const { data, error } = await supabase
    .from("Shikigami")
    .select("id, name, skills")
    .order("id", { ascending: true });
  if (error) console.error("Error fetching shikigami:", error);
  else shikigamiList.value = data;
}

async function fetchShikigami() {
  const { data, error } = await supabase
    .from("Shikigami")
    .select("*")
    .eq("name->jp->>1", formattedName)
    .single();

  if (error) console.error("Error fetching shikigami:", error);
  else {
    shikigami.value = data;
    await nextTick();
    addTooltipListeners();
    if (data.rarity !== 'SP') fetchEvolution(data.evolution.no);
  }
}

async function fetchIllustrations(shikiId) {
  const { data, error } = await supabase
    .from("Illustration")
    .select("*")
    .contains("shiki", [shikiId])
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching illustrations:", error);
  } else {
    illustrations.value = data;
  }
}

/* ---------------------- REALTIME ---------------------- */
let shikigamiChannel = null;
let effectChannel = null;
let illustrationChannel = null;

function subscribeRealtime() {
  // --- Channel Shikigami ---
  if (!shikigamiChannel) {
    shikigamiChannel = supabase
      .channel("shikigami-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Shikigami" },
        async () => {
          await fetchAllShikigami();
          await fetchShikigami();
        }
      )
      .subscribe();
  }

  if (!illustrationChannel) {
    illustrationChannel = supabase
      .channel("illustration-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Illustration" },
        async () => {
          await fetchIllustrations(shikigami.value?.id);
        }
      )
      .subscribe();
  }

  // --- Channel Effect ---
  if (!effectChannel) {
    effectChannel = supabase
      .channel("effect-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Effect" },
        async () => {
          await fetchAllEffects();
        }
      )
      .subscribe();
  }
}

// Nếu cần unsubscribe (ví dụ khi rời component)
function unsubscribeRealtime() {
  if (shikigamiChannel) {
    shikigamiChannel.unsubscribe();
    shikigamiChannel = null;
  }
  if (effectChannel) {
    effectChannel.unsubscribe();
    effectChannel = null;
  }
}

/* ---------------------- EDIT MODAL ---------------------- */
const editSkill = (skill, index) => {
  editingSkill.value = { ...skill }; 
  editingSkillIndex.value = index;
  showEditModal.value = true;

  tagsInput.value = (editingSkill.value.tags || []).join(",");
  notesInput.value = (editingSkill.value.notes || []).join(",");
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingSkill.value = null;
};

const saveSkill = async () => {
  if (editingSkillIndex.value === -1) return;

  updateTags();
  updateNotes();

  shikigami.value.skills[editingSkillIndex.value] = {
    ...editingSkill.value,
    levels: {
      en: Array.isArray(editingSkill.value.levels.en)
        ? editingSkill.value.levels.en.map((l) => ({ ...l }))
        : editingSkill.value.levels.en, 
      vn: Array.isArray(editingSkill.value.levels.vn)
        ? editingSkill.value.levels.vn.map((l) => ({ ...l }))
        : editingSkill.value.levels.vn,
    },
    tags: editingSkill.value.tags ? [...editingSkill.value.tags] : [],
    notes: editingSkill.value.notes ? [...editingSkill.value.notes] : [],
  };

  const { data, error } = await supabase
    .from("Shikigami")
    .update({ skills: shikigami.value.skills })
    .eq("id", shikigami.value.id);

  if (error) {
    alert("Update failed!");
  } else {
    closeEditModal();
  }
};

function updateTags() {
  editingSkill.tags = tagsInput.value
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x !== "" && !isNaN(x))
    .map(Number);
}

function updateNotes() {
  editingSkill.notes = notesInput.value
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x !== "" && !isNaN(x))
    .map(Number);
}

/* ---------------------- LIFECYCLE ---------------------- */
onMounted(async () => {
  document.title = `${formattedName}`;

  await Promise.all([
    fetchAllEffects(),
    fetchAllShikigami(),
    fetchShikigami(),
    fetchAllOnmyoji(),
    fetchConditions(),
    loadTags(),
  ]);
  
  subscribeRealtime();
  addTooltipListeners();
});

watch(activeSkillIndex, async () => {
  await nextTick();
  removeTooltipListeners();
  addTooltipListeners();
});

watch(isEnglish, async () => {
  await nextTick();
  removeTooltipListeners();
  addTooltipListeners();
});

watch(
  () => [shikigami.value, activeSkillIndex.value, isEnglish.value],
  () => addCKeywordListeners()
);

watch(activeTab, async (newTab) => {
  if (newTab === "gallery" && illustrations.value.length === 0) {
    await fetchIllustrations(shikigami.value?.id);
  }
});

const addCKeywordListeners = () => {
  nextTick(() => {
    document.querySelectorAll(".skill-keyword").forEach((el) => {
      el.onclick = () => {
        const keyword = el.dataset.keyword;

        let index = shikigami.value.skills.findIndex(
          (s) => s.name.en === keyword || s.name.vn === keyword
        );

        if (index >= 3 || index === -1) {
          const extraSkill = shikigami.value.skills.find(
            (s) => s.name.en === keyword || s.name.vn === keyword
          );
          if (extraSkill && extraSkill.tab != null) {
            index = extraSkill.tab - 1;
          }
        }

        if (index !== -1) {
          activeSkillIndex.value = index;
        }
      };
    });
  });
};

</script>

<template>
  <div v-if="shikigami">
    <div class="content-section flex flex-col gap-4">
      <!-- Name -->
      <div class="header-row">
        <div class="character-title">{{ shikigami.name.jp[1] }}</div>
        <label class="toggle-switch" title="Switch Language">
          <input type="checkbox" v-model="isEnglish" />
          <span class="slider"></span>
          <div class="toggle-labels">
            <span>EN</span>
            <span>VN</span>
          </div>
        </label>
      </div>

      <!-- Image + Name -->
      <div class="flex gap-6">
        <!-- Image -->
        <div class="w-2/3 mx-auto">
          <!-- Images -->
          <div class="flex justify-center items-center h-[650px]">
            <img :src="`/assets/shikigami/images/${route.params.name}.webp`" :alt="shikigami.name.jp[1]"
              class="max-h-full max-w-full object-contain transition-opacity hover:scale-115 transition-transform duration-300" />
          </div>
        </div>

        <!-- Name -->
        <div class="flex justify-end w-1/3 max-h-[450px]">
          <table class="w-full">
            <thead>
              <tr class="table-title">
                <th class="p-2 relative text-[20px]" colspan="4">
                  <div>{{ shikigami.name.jp[1] }}</div>
                  <img :src="`/assets/rarity/${shikigami.rarity}.webp`" :alt="shikigami.rarity"
                    class="w-16 h-16 object-contain absolute top-[-30px] left-[-40px]" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <strong>CN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-zh">{{ shikigami.name?.cn[0] }}</div>
                  <div>{{ shikigami.name.cn[1] }}</div>
                </td>
              </tr>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <strong>JP</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-zh">{{ shikigami.name.jp[0] }}</div>
                  <div>{{ shikigami.name.jp[1] }}</div>
                </td>
              </tr>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <strong>GL</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ shikigami.name.en }}</div>
                </td>
              </tr>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <strong>VN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-vi font-[500]">{{ shikigami.name.vn }}</div>
                </td>
              </tr>
              <tr>
                <td class="table-title-row" colspan="4">Voice Actor</td>
              </tr>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <strong>{{ (shikigami.id === 255 || shikigami.id === 256) ? 'CN' : 'JP'}}</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="whitespace-pre-line" :class="(shikigami.id === 255 || shikigami.id === 256) ? 'lang-zh' : ''">{{ shikigami.name.va }}</div>
                </td>
              </tr>
              <tr v-if="shikigami.rarity !== 'SP' && shikigami.rarity !== 'N'">
                <td class="table-title-row" colspan="4">Evo Materials</td>
              </tr>
              <tr v-if="shikigami.materials && shikigami.materials.length">
                <td class="table-cell p-2" v-for="material in shikigami.materials" :key="material.type">
                  <div class="w-12 h-12 flex items-center justify-center relative">
                    <img :src="`/assets/materials/${material.type}.webp`" :alt="material.type"
                      class="max-h-full max-w-full object-contain" :title="material.name" />
                    <span class="absolute bottom-0 right-0 text-white font-bold" style="
                        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
                          1px 1px 0 #000;
                      ">{{ material.quantity }}</span>
                  </div>
                </td>
              </tr>
              <tr v-if="shikigami.version !== null">
                <td class="table-title-row" colspan="4">Other Version</td>
              </tr>
              <tr v-if="shikigami.version !== null" class="table-row">
                <td colspan="4" class="p-1">
                  <div class="flex flex-col items-center justify-center">
                    <a :href="`/shikigami/${shikigami.version.replace(/ /g, '_')}`">
                      <img :src="`/assets/shikigami/shards/${shikigami.version.replace(/ /g, '_')}_Shard.webp`" :alt="shikigami.version.name"
                        class="h-16 w-16 object-contain mb-1" /></a>
                    <router-link :to="`/shikigami/${shikigami.version.replace(/ /g, '_')}`"
                      class="text-black font-bold hover:text-[#a51919] font-[14px]">
                      {{ shikigami.version }}
                    </router-link>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="table-title-row" colspan="4">Release Date</td>
              </tr>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <p>CN</p>
                  <p v-if="shikigami.date.en">GL</p>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="font-[500]">{{ shikigami.date.cn }}</div>
                  <div v-if="shikigami.date.en" class="font-[500]">{{ shikigami.date.en }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Profile -->
      <div class="text-black text-justify mt-2 whitespace-pre-line" v-if="shikigami.profile !== null"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }" v-html="highlightProfileText(shikigami.profile, isEnglish)"
        </div>

        <!-- Content -->
        <div class="flex border-b border-gray-300 mt-5" :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }">
          <button class="flex py-2 px-4 text-center" :class="
            activeTab === 'main'
              ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
              : 'text-[#a3a3a3] cursor-pointer'
          " @click="activeTab = 'main'">
            {{ isEnglish ? "Main" : "Chính Điện" }}
          </button>
          <button class="flex py-2 px-4 text-center" :class="
            activeTab === 'gallery'
              ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
              : 'text-[#a3a3a3] cursor-pointer'
          " @click="activeTab = 'gallery'">
            {{ isEnglish ? "Gallery" : "Hoạ Phòng" }}
          </button>
          <button class="flex py-2 px-4 text-center" :class="
            activeTab === 'dialogue'
              ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
              : 'text-[#a3a3a3] cursor-pointer'
          " @click="activeTab = 'dialogue'">
            {{ isEnglish ? "Dialogue" : "Lời Thoại" }}
          </button>
        </div>

        <!-- Main Tab -->
        <div class="w-full" v-show="activeTab === 'main'" :class="[
          activeTab === 'main' ? 'opacity-100' : 'opacity-0',
          isEnglish ? 'lang-en' : 'lang-vi',
        ]">
          <!-- Stats -->
          <h2 class="session-title">
            {{ isEnglish ? "Stats" : "Chỉ số" }}
          </h2>
          <div style="
            display: block;
            border: 1px solid #a51919;
            padding: 0 20px;
            margin-top: 85px;
          ">
            <table class="stats">
              <tbody>
                <tr class="image-icon" style="color: #a51919">
                  <th></th>
                  <th rowspan="9">&nbsp;</th>
                  <th colspan="2">
                    <figure class="icon-img" style="position: relative">
                      <img :src="`/assets/shikigami/icons/${route.params.name}_Icon.webp`" :alt="shikigami.name.jp[1]" style="object-fit: contain"
                        width="90" />
                      <div style="
                        color: #a51919;
                        font-weight: bold;
                        position: absolute;
                        top: -50px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                      ">
                        {{
                        shikigami.rarity !== "SP" && shikigami.rarity !== 'N'
                        ? isEnglish
                        ? "Unevolved"
                        : "Cơ bản"
                        : ""
                        }}
                        <br />
                        {{ isEnglish ? "Level 1" : "Cấp 1" }}
                      </div>
                    </figure>
                  </th>
                  <th rowspan="9">&nbsp;</th>
                  <th colspan="2">
                    <figure class="icon-img" style="position: relative">
                      <img :src="`/assets/shikigami/icons/${route.params.name}_Icon${shikigami.rarity !== 'SP' && shikigami.rarity !== 'N' ? '_Evo' : ''}.webp`
                      " :alt="shikigami.name.jp[1]" style="object-fit: contain" width="90" />
                      <div style="
                        color: #a51919;
                        font-weight: bold;
                        position: absolute;
                        top: -50px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                      ">
                        {{
                        shikigami.rarity !== "SP" && shikigami.rarity !== "N"
                        ? isEnglish
                        ? "Evolved"
                        : "Thức tỉnh"
                        : ""
                        }}
                        <br />
                        {{ isEnglish ? "Level 40" : "Cấp 40" }}
                      </div>
                    </figure>
                  </th>
                  <th></th>
                  <th rowspan="9">&nbsp;</th>
                </tr>
                <tr>
                  <th class="label-cell">
                    <img src="/assets/stats/ATK.webp" alt="ATK" />
                    ATK
                  </th>
                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getATKImage(shikigami.stats.ATK[0])" :alt="getATKRank(shikigami.stats.ATK[0])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">
                      {{ shikigami.stats.ATK[0] }}
                    </div>
                  </td>

                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getATKEvoImage(shikigami.stats.ATK[1])" :alt="getATKEvoImage(shikigami.stats.ATK[1])"
                        class="w-6 h-6" />
                    </div>
                  </td>

                  <td class="centered-number">
                    <div class="flex justify-start">
                      {{ shikigami.stats.ATK[1] }}
                    </div>
                  </td>

                  <td>
                    <div class="flex justify-start">
                      +{{ shikigami.stats.ATK[1] - shikigami.stats.ATK[0] }}
                    </div>
                  </td>
                </tr>

                <tr>
                  <th class="label-cell">
                    <img src="/assets/stats/HP.webp" alt="HP" />
                    HP
                  </th>
                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getHPImage(shikigami.stats.HP[0])" :alt="getHPRank(shikigami.stats.HP[0])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">
                      {{ shikigami.stats.HP[0] }}
                    </div>
                  </td>

                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getHPEvoImage(shikigami.stats.HP[1])" :alt="getHPEvoRank(shikigami.stats.HP[1])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">
                      {{ shikigami.stats.HP[1] }}
                    </div>
                  </td>

                  <td>
                    <div class="flex justify-start">
                      +{{ shikigami.stats.HP[1] - shikigami.stats.HP[0] }}
                    </div>
                  </td>
                </tr>

                <tr>
                  <th class="label-cell">
                    <img src="/assets/stats/DEF.webp" alt="DEF" />
                    DEF
                  </th>
                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getDEFImage(shikigami.stats.DEF[0])" :alt="getDEFRank(shikigami.stats.DEF[0])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">
                      {{ shikigami.stats.DEF[0] }}
                    </div>
                  </td>

                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getDEFEvoImage(shikigami.stats.DEF[1])" :alt="getDEFEvoRank(shikigami.stats.DEF[1])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">
                      {{ shikigami.stats.DEF[1] }}
                    </div>
                  </td>

                  <td>
                    <div class="flex justify-start">
                      +{{ shikigami.stats.DEF[1] - shikigami.stats.DEF[0] }}
                    </div>
                  </td>
                </tr>

                <tr>
                  <th class="label-cell">
                    <img src="/assets/stats/SPD.webp" alt="SPD" />
                    SPD
                  </th>
                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getSPDImage(shikigami.stats.SPD[0])" :alt="getSPDRank(shikigami.stats.SPD[0])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">
                      {{ shikigami.stats.SPD[0] }}
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getSPDImage(shikigami.stats.SPD[1])" :alt="getSPDRank(shikigami.stats.SPD[1])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">
                      {{ shikigami.stats.SPD[1] }}
                    </div>
                  </td>

                  <td>
                    <div class="flex justify-start">
                      +{{ shikigami.stats.SPD[1] - shikigami.stats.SPD[0] }}
                    </div>
                  </td>
                </tr>

                <tr>
                  <th class="label-cell">
                    <img src="/assets/stats/CRIT.webp" alt="CRIT" />
                    Crit
                  </th>
                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getCritImage(shikigami.stats.Crit[0])" :alt="getCritRank(shikigami.stats.Crit[0])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">{{ shikigami.stats.Crit[0] }}%</div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-end">
                      <img :src="getCritImage(shikigami.stats.Crit[1])" :alt="getCritRank(shikigami.stats.Crit[1])"
                        class="w-6 h-6" />
                    </div>
                  </td>
                  <td class="centered-number">
                    <div class="flex justify-start">{{ shikigami.stats.Crit[1] }}%</div>
                  </td>

                  <td>
                    <div class="flex justify-start">
                      +{{ shikigami.stats.Crit[1] - shikigami.stats.Crit[0] }}%
                    </div>
                  </td>
                </tr>

                <tr>
                  <th class="label-cell">
                    <img src="/assets/stats/CDMG.webp" alt="CDMG" />
                    Crit DMG
                  </th>

                  <td></td>

                  <td class="centered-number">
                    <div class="flex justify-start">{{ shikigami.stats.CritDMG ? shikigami.stats.CritDMG[0] : '150' }}%</div>
                  </td>

                  <td></td>

                  <td class="centered-number">
                    <div class="flex justify-start">{{ shikigami.stats.CritDMG ? shikigami.stats.CritDMG[1] : '150' }}%</div>
                  </td>

                  <td>
                    <div class="flex justify-start">+{{ shikigami.stats.CritDMG ? shikigami.stats.CritDMG[1] - shikigami.stats.CritDMG[0] : '0' }}%</div>
                  </td>
                </tr>

                <tr>
                  <th class="label-cell">
                    <img src="/assets/stats/HIT.webp" alt="HIT" />
                    Effects HIT
                  </th>

                  <td></td>

                  <td class="centered-number">
                    <div class="flex justify-start">{{ shikigami.stats.EffectHIT ? shikigami.stats.EffectHIT[0] : '0' }}%</div>
                  </td>

                  <td></td>

                  <td class="centered-number">
                    <div class="flex justify-start">{{ shikigami.stats.EffectHIT ? shikigami.stats.EffectHIT[1] : '0' }}%</div>
                  </td>

                  <td>
                    <div class="flex justify-start">+{{ shikigami.stats.EffectHIT ? shikigami.stats.EffectHIT[1] - shikigami.stats.EffectHIT[0] : '0' }}%</div>
                  </td>
                </tr>

                <tr>
                  <th class="label-cell">
                    <img src="/assets/stats/RES.webp" alt="RES" />
                    Effects RES
                  </th>

                  <td></td>

                  <td class="centered-number">
                    <div class="flex justify-start">0%</div>
                  </td>

                  <td></td>

                  <td class="centered-number">
                    <div class="flex justify-start">0%</div>
                  </td>

                  <td>
                    <div class="flex justify-start">+0%</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Skills -->
          <h2 class="session-title mt-5">
            {{ isEnglish ? "Skills" : "Kĩ năng" }}
          </h2>
          <div class="flex border-b border-gray-300 mb-4 mt-2">
            <button v-for="(skill, index) in shikigami.skills.slice(0, 3)" :key="index"
              @click="activeSkillIndex = index" :class="[
              'px-4 py-2',
              activeSkillIndex === index
                ? 'font-bold border-b-2 border-[#a51919] text-[#a51919]'
                : 'text-[#a3a3a3] cursor-pointer',
            ]">
              <template v-if="index === 1 && shikigami.skills[3]?.tab === 2">
                {{
                shikigami.skills[1].type !== shikigami.skills[3].type
                ? `${shikigami.skills[1].type === shikigami.skills[2].type ? 'Special 1' : shikigami.skills[1].type} / ${shikigami.skills[3].type === shikigami.skills[2].type ? 'Special 1' : shikigami.skills[3].type}`
                : (shikigami.skills[1].type === shikigami.skills[2].type ? 'Special 1' : shikigami.skills[1].type)
                }}
              </template>
              <template v-else-if="index === 2 && shikigami.skills[3]?.tab === 2">
                {{
                shikigami.skills[1].type !== shikigami.skills[3].type
                ? 'Special 2'
                : (shikigami.skills[2].type === shikigami.skills[1].type ? 'Special 2' : shikigami.skills[2].type)
                }}
              </template>
              <template v-else-if="shikigami.skills[1].type === shikigami.skills[2]?.type">
                {{
                skill.type + (index === 1 ? ' 1' : (index === 2 ? ' 2' : ''))
                }}
              </template>
              <template v-else>
                {{ skill.type }}
              </template>
            </button>
            <button v-if="shikigami.rarity !== 'SP' && shikigami.rarity !== 'N'" @click="activeSkillIndex = 3" :class="[
              'px-4 py-2',
              activeSkillIndex === 3
                ? 'font-bold border-b-2 border-[#a51919] text-[#a51919]'
                : 'text-[#a3a3a3] cursor-pointer',
            ]">
              Evolution Effect
            </button>
          </div>
          <div v-if="activeSkillIndex < 3">
            <div>
              <div style="position: relative; padding-left: 40px; margin-bottom: 20px">
                <!-- Skill icon + title -->
                <div>
                  <span style="
                    background-color: #fff;
                    overflow: hidden;
                    border-radius: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 95px;
                    height: 95px;
                    border: 1px solid #a51919;
                    padding: 5px;
                  ">
                    <img :src="`/assets/shikigami/skills/${route.params.name}_Skill${activeSkillIndex+1}.webp`"
                      :alt="shikigami.skills[activeSkillIndex].name.en"
                      :title="shikigami.skills[activeSkillIndex].name.en" />
                  </span>
                  <span style="
                    display: table-cell;
                    vertical-align: bottom;
                    font-weight: 900;
                    font-size: 20px;
                    color: #a51919;
                    height: 70px;
                    text-indent: 70px;
                    padding-bottom: 5px;
                  ">
                    <div class="skill-title">
                      <span class="skill-name">
                        {{
                        isEnglish
                        ? shikigami.skills[activeSkillIndex].name.en
                        : shikigami.skills[activeSkillIndex].name.vn
                        }}
                      </span>
                      <span class="skill-sub-name lang-zh">
                        ({{ shikigami.skills[activeSkillIndex].name.cn === shikigami.skills[activeSkillIndex].name.jp ? shikigami.skills[activeSkillIndex].name.cn : shikigami.skills[activeSkillIndex].name.cn + ' / ' + shikigami.skills[activeSkillIndex].name.jp }})
                      </span>
                      <button class="ml-2 text-lg text-[#a51919] hover:text-[#891727] cursor-pointer"
                        @click="editSkill(shikigami.skills[activeSkillIndex])">
                        <i class="fas fa-edit"></i>
                        <!-- dùng font-awesome -->
                      </button>
                    </div>
                  </span>
                </div>

                <!-- Skill description -->
                <div style="padding: 10px 20px; border: 1px solid #a51919">
                  <div class="text-black pb-5 skill-header">
                    <div class="skill-info flex">
                      <span style="margin-left: 25px">
                        <b>{{ isEnglish ? "Type" : "Loại" }}:</b>
                        {{ shikigami.skills[activeSkillIndex].type }}
                      </span>
                      <span class="flex" style="margin-left: 40px">
                        <b>{{ isEnglish ? "Onibi" : "Quỷ hoả" }}:</b>
                        <img
                          src="/assets/Onibi.webp"
                          alt="Onibi" />
                        {{ shikigami.skills[activeSkillIndex].onibi }}
                      </span>
                      <span style="margin-left: 40px">
                        <b>{{ isEnglish ? "Cooldown" : "Hồi chiêu" }}:</b>
                        {{ shikigami.skills[activeSkillIndex].cooldown }}
                      </span>
                    </div>
                    <div class="skill-badges flex flex-wrap gap-2">
                      <div v-for="tagId in shikigami.skills[activeSkillIndex].tags" :key="tagId"
                        class="relative inline-flex items-center justify-center w-20 h-6 overflow-hidden rounded-md">
                        <!-- brush nền -->
                        <div class="absolute inset-0 tint-base" :class="'tint-' + (tagMap?.[tagId]?.color || 'grey')">
                        </div>

                        <!-- chữ đè lên -->
                        <span class="relative z-10 text-xs text-white">
                          {{ tagMap?.[tagId]?.name }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />

                  <div class="w-[80%] mx-auto">
                    <p class="text-center text-[#a3a3a3] voice-font">
                      "{{ shikigami.skills[activeSkillIndex].voice }}"
                    </p>
                  </div>
                  <p class="whitespace-pre-line text-justify" style="
                    margin: 0;
                    font-size: 16px;
                    line-height: 1.5;
                    color: #444;
                    padding: 10px 0;
                  " v-html="
                    processTextWithTooltips(
                      isEnglish
                        ? shikigami.skills[activeSkillIndex].description.en
                        : shikigami.skills[activeSkillIndex].description.vn
                    )
                  "></p>
                  <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
                  <table style="width: 100%; border-collapse: collapse; font-size: 16px" v-if="
                    Array.isArray(
                      isEnglish
                        ? shikigami.skills[activeSkillIndex].levels.en
                        : shikigami.skills[activeSkillIndex].levels.vn
                    )
                  ">
                    <tbody>
                      <tr style="color: #a51919; font-weight: bold">
                        <th style="padding: 6px; text-align: left; width: 70px">
                          {{ isEnglish ? "Level" : "Cấp" }}
                        </th>
                        <th style="padding: 6px 10px; text-align: left">
                          {{ isEnglish ? "Effect" : "Hiệu ứng" }}
                        </th>
                      </tr>
                      <tr v-for="lvl in isEnglish
                        ? shikigami.skills[activeSkillIndex].levels.en
                        : shikigami.skills[activeSkillIndex].levels.vn" :key="lvl.level" style="color: #444">
                        <td style="padding: 6px 10px">{{ lvl.level }}</td>
                        <td class="text-justify" style="padding: 6px 10px" v-html="processTextWithTooltips(lvl.effect)">
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-else>
                    <p style="color: #a3a3a3" class="no-level" v-html="
                      processTextWithTooltips(
                        isEnglish
                          ? shikigami.skills[activeSkillIndex].levels.en
                          : shikigami.skills[activeSkillIndex].levels.vn
                      )
                    "></p>
                  </div>
                </div>
              </div>

              <div v-if="shikigami.skills.length > 3" v-for="(skill, index) in shikigami.skills.filter(
                (s, i) => i >= 3 && s?.tab === activeSkillIndex + 1
              )" :key="'extra-' + index" style="
                position: relative;
                padding-left: 40px;
                margin-bottom: 20px;
                margin-top: 50px;
              ">
                <!-- Skill icon + title -->
                <div>
                  <span style="
                    background-color: #fff;
                    overflow: hidden;
                    border-radius: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 95px;
                    height: 95px;
                    border: 1px solid #a51919;
                    padding: 5px;
                  ">
                    <img :src="`/assets/shikigami/skills/${route.params.name}_Skill${index+4}.webp`" :alt="skill.name.en" :title="skill.name.en" />
                  </span>
                  <span style="
                    display: table-cell;
                    vertical-align: bottom;
                    font-size: 20px;
                    color: #a51919;
                    height: 65px;
                    text-indent: 70px;
                    padding-bottom: 5px;
                  ">
                    <div class="skill-title">
                      <span class="skill-name">
                        {{ isEnglish ? skill.name.en : skill.name.vn }}
                      </span>
                      <span class="skill-sub-name lang-zh">
                        ({{ skill.name.cn === skill.name.jp ? skill.name.cn : skill.name.cn + ' / ' + skill.name.jp }})
                      </span>
                      <button class="ml-2 text-lg text-[#a51919] hover:text-[#891727] cursor-pointer"
                        @click="editSkill(skill)">
                        <i class="fas fa-edit"></i>
                        <!-- dùng font-awesome -->
                      </button>
                    </div>
                  </span>
                </div>

                <!-- Skill description -->
                <div style="padding: 10px 25px; border: 1px solid #a51919">
                  <div class="text-black pb-5 skill-header">
                    <div class="skill-info flex">
                      <span style="margin-left: 45px">
                        <b>{{ isEnglish ? "Type" : "Loại" }}:</b>
                        {{ skill.type }}
                      </span>
                      <span class="flex" style="margin-left: 45px">
                        <b>{{ isEnglish ? "Onibi" : "Quỷ hoả" }}:</b>
                        <img src="/assets/Onibi.webp" alt="Onibi" />
                        {{ skill.onibi }}
                      </span>
                      <span style="margin-left: 45px">
                        <b>{{ isEnglish ? "Cooldown" : "Hồi chiêu" }}:</b>
                        {{ skill.cooldown }}
                      </span>
                    </div>
                    <div class="skill-badges flex flex-wrap gap-2">
                      <div v-for="tagId in skill.tags" :key="tagId"
                        class="relative inline-flex items-center justify-center w-20 h-6 overflow-hidden rounded-md">
                        <div class="absolute inset-0 tint-base" :class="'tint-' + (tagMap?.[tagId]?.color || 'grey')">
                        </div>

                        <span class="relative z-10 text-xs text-white">
                          {{ tagMap?.[tagId]?.name }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
                  <p class="whitespace-pre-line text-justify" style="
                    margin: 0;
                    font-size: 16px;
                    line-height: 1.5;
                    color: #444;
                    padding: 10px 0;
                  " v-html="
                    processTextWithTooltips(
                      isEnglish ? skill.description.en : skill.description.vn
                    )
                  "></p>
                  <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
                  <table style="width: 100%; border-collapse: collapse; font-size: 16px"
                    v-if="Array.isArray(isEnglish ? skill.levels.en : skill.levels.vn)">
                    <tbody>
                      <tr style="color: #a51919; font-weight: bold">
                        <th style="padding: 6px; text-align: left; width: 70px">
                          {{ isEnglish ? "Level" : "Cấp" }}
                        </th>
                        <th style="padding: 6px 10px; text-align: left">
                          {{ isEnglish ? "Effect" : "Hiệu ứng" }}
                        </th>
                      </tr>
                      <tr v-for="lvl in isEnglish ? skill.levels.en : skill.levels.vn" :key="lvl.level"
                        style="color: #444">
                        <td style="padding: 6px 10px">{{ lvl.level }}</td>
                        <td class="text-justify" style="padding: 6px 10px" v-html="processTextWithTooltips(lvl.effect)">
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-else>
                    <p style="color: #a3a3a3" class="no-level" v-html="
                      processTextWithTooltips(
                        isEnglish ? skill.levels.en : skill.levels.vn
                      )
                    "></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <div style="padding: 10px; border: 1px solid #a51919">
              <p class="whitespace-pre-line text-justify" style="
                margin: 0;
                font-size: 15px;
                line-height: 1.5;
                color: #444;
                padding: 10px 0;
              " v-html="renderEvoText(shikigami.evolution)"></p>
            </div>
          </div>

          <!-- Biography Unlock -->
          <h2 class="session-title mt-5">
            {{ isEnglish ? "Biography Unlock" : "Mở khoá Tiểu sử" }}
          </h2>
          <table class="w-full mt-4" style="border: 1px solid #a51919">
            <thead>
              <tr>
                <th class="table-title">No.</th>
                <th class="table-title">
                  {{ isEnglish ? "Unlock Conditions" : "Điều kiện mở khóa" }}
                </th>
                <th class="table-title">
                  {{ isEnglish ? "Rewards" : "Phần thưởng" }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-black table-cell text-center w-[50px]">
                  1
                </td>
                <td class="text-black table-cell px-3">
                  <span v-html="renderBioText(shikigami.biography[0])"></span>
                </td>

                <td class="py-1 text-black table-cell w-[100px]">
                  <div class="w-12 h-12 flex items-center justify-center mx-auto relative">
                    <img src="/assets/Gold.webp" alt="Gold" class="max-h-full max-w-full object-contain" />
                    <span class="absolute bottom-0 right-0 text-white font-bold" style="
                      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
                        1px 1px 0 #000;
                    ">5000</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td class="text-black table-cell text-center w-[50px]">
                  2
                </td>
                <td class="text-black table-cell px-3">
                  <span v-html="renderBioText(shikigami.biography[1])"></span>
                </td>

                <td class="py-1 text-black table-cell w-[100px]">
                  <div class="w-12 h-12 flex items-center justify-center mx-auto relative">
                    <img :src="shikigami.id === 144 ? '/assets/Jade.webp' : (shikigami.id === 71 ? '/assets/Black_Daruma.webp' : `/assets/shikigami/shards/${route.params.name}_Shard.webp`)" :alt="shikigami.name.jp" class="max-h-full max-w-full object-contain" />
                    <span class="absolute bottom-0 right-0 text-white font-bold" style="
                      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
                        1px 1px 0 #000;
                    ">{{ (shikigami.id >= 201 && shikigami.id <= 217) ? 2 : (shikigami.id === 71 ? '' : 10) }}</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td class="text-black table-cell text-center w-[50px]">
                  3
                </td>
                <td class="text-black table-cell px-3">
                  <span v-html="renderBioText(shikigami.biography[2])"></span>
                </td>

                <td class="py-1 text-black table-cell w-[100px]">
                  <div class="w-12 h-12 flex items-center justify-center mx-auto relative">
                    <img :src="shikigami.id !== 144 ? '/assets/Jade.webp' : `/assets/shikigami/shards/${route.params.name}_Shard.webp`" alt="Jade" class="max-h-full max-w-full object-contain" />
                    <span class="absolute bottom-0 right-0 text-white font-bold" style="
                      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
                        1px 1px 0 #000;
                    ">10</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <h2 class="session-title mt-5">
            {{ isEnglish ? "Build" : "Định hướng" }}
          </h2>
        </div>

        <!-- Gallery Tab -->
        <div v-show="activeTab === 'gallery'" :class="[
          activeTab === 'gallery' ? 'opacity-100' : 'opacity-0',
          isEnglish ? 'lang-en' : 'lang-vi',
        ]">
          <!-- Skins -->
          <h2 class="session-title mt-5">
            {{ isEnglish ? "Skins" : "Trang phục" }}
          </h2>
          <div class="grid grid-cols-3 gap-5 mt-4">
            <div v-for="(skin, index) in shikigami.skins" :key="index" class="flex flex-col items-center"
              :title="skin.name.en || skin.name.cn" @click="openModal((skin.name.en === 'Default' || skin.name.en === 'Evolution') ? `/assets/shikigami/images/${route.params.name}${(skin.name.en === 'Evolution'? '_Evo' : '')}.webp` : `/assets/shikigami/skins/${route.params.name}_Skin${index}.webp`)">
              <img v-if="skin.name.en === 'Default' || skin.name.en === 'Evolution'" :src="`/assets/shikigami/images/${route.params.name}${(skin.name.en === 'Evolution'? '_Evo' : '')}.webp`" :alt="skin.name.en || skin.name.cn"
                class="w-full h-80 object-contain hover:scale-110 transition-transform duration-300 overflow-visible cursor-pointer" />
              <img v-else :src="`/assets/shikigami/skins/${route.params.name}_Skin${(shikigami.rarity === 'SP' || shikigami.rarity === 'N')
                      ? (index ? index : '')
                      : index - 1 }.webp`" :alt="skin.name.en || skin.name.cn"
              class="w-full h-80 object-contain hover:scale-110 transition-transform duration-300 overflow-visible cursor-pointer" />
              <p class="mt-4 text-center font-medium text-black"
                :class="{ 'lang-zh': isEnglish ? !skin.name.en && skin.name.cn : false }">
                {{ isEnglish ? skin.name.en || skin.name.cn : skin.name.vn }}
              </p>
            </div>
          </div>

          <!-- Modal -->
          <div
            v-if="isModalOpen"
            class="fixed inset-0 z-50 flex items-center justify-center"
          >
            <!-- Overlay -->
            <div
              class="absolute inset-0 bg-black/50"
              @click="closeModal"
            ></div>

            <!-- Modal content -->
            <div class="relative z-10 bg-white max-w-3xl w-full p-4 rounded-lg shadow-2xl">
              <button
                class="absolute top-2 right-3 text-black text-[40px] cursor-pointer"
                @click="closeModal"
              >
                ✕
              </button>
              <img
                :src="selectedImage"
                alt="Skin Preview"
                class="w-full h-auto"
              />
            </div>
          </div>

          <!-- Skins Info -->
          <h2 class="session-title mt-5">
            {{ isEnglish ? "Skins Info" : "Thông tin trang phục" }}
          </h2>
          <table class="w-full mt-4" style="border: 1px solid #a51919">
            <thead>
              <tr>
                <th class="table-title">
                  {{ isEnglish ? "Image" : "Ảnh" }}
                </th>
                <th class="table-title">
                  {{ isEnglish ? "Name" : "Tên" }}
                </th>
                <th class="table-title">
                  {{ isEnglish ? "Artist" : "Họa sĩ" }}
                </th>
                <th class="table-title">
                  {{ isEnglish ? "Obtained" : "Cách nhận" }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-black" v-for="(skin, index) in shikigami.skins" :key="index">
                <td class="px-2 py-2 text-center table-cell w-[105px]" v-if="skin.name.en === 'Default' || skin.name.en === 'Evolution'">
                  <div class="w-24 h-24 overflow-hidden">
                    <img :src="skin.name.en === 'Default' ? `/assets/shikigami/skinsInfo/${route.params.name}_SkinInfo0.webp` : `/assets/shikigami/skinsInfo/${route.params.name}_SkinInfo00.webp`" :alt="skin.name.en || skin.name.cn"
                      class="w-full h-full object-contain" :class="(index === 0 && shikigami.id >= 201 && shikigami.id <= 217) ? 'scale-145' : ''" />
                  </div>
                </td>
                <td class="px-2 py-2 text-center table-cell w-[105px]" v-else>
                  <div class="w-24 h-24 overflow-hidden">
                    <img :src="`/assets/shikigami/skinsInfo/${route.params.name}_SkinInfo${
                      (shikigami.rarity === 'SP' || shikigami.rarity === 'N')
                        ? (index ? index : '')
                        : index - 1
                          }.webp`" :alt="skin.name.en || skin.name.cn"
                      class="w-full h-full object-contain" :class="(index === 0 && shikigami.id >= 201 && shikigami.id <= 217) ? 'scale-145' : ''" />
                  </div>
                </td>
                <td class="px-2 py-1 text-center table-cell w-[300px]"
                  v-if="skin.name.en === 'Default' || skin.name.en === 'Evolution'">
                  <div>{{ isEnglish ? skin.name.en : skin.name.vn }}</div>
                </td>

                <td class="px-2 py-1 text-center table-cell" v-else>
                  <div>{{ skin.name.en }}</div>
                  <div>
                    <span class="lang-zh">{{ skin.name.cn }}</span> - <span class="lang-vi">{{ skin.name.vn }}</span>
                  </div>
                </td>

                <td class="px-2 py-1 text-center table-cell">
                  <span class="lang-zh">{{ skin.artist }}</span>
                </td>
                <td class="px-2 py-1 text-center table-cell whitespace-pre-line">
                  {{ skin.obtained }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Biography Accessories -->
          <h2 v-if="shikigami.accessories && shikigami.accessories.length" class="session-title mt-5">
            {{ isEnglish ? "Biography Accessories" : "Phụ kiện Tiểu sử" }}
          </h2>

          <table v-if="shikigami.accessories && shikigami.accessories.length" class="w-full mt-4"
            style="border: 1px solid #a51919">
            <thead>
              <tr>
                <th class="px-2 py-1 table-title">Bio<br />No.</th>
                <th class="px-2 py-1 table-title">
                  {{ isEnglish ? "Image" : "Ảnh" }}
                </th>
                <th class="px-2 py-1 table-title">
                  {{ isEnglish ? "Name" : "Tên" }}
                </th>
                <th class="px-2 py-1 table-title">
                  {{ isEnglish ? "Type" : "Loại" }}
                </th>
                <th class="px-2 py-1 table-title">
                  {{ isEnglish ? "Obtained" : "Cách nhận" }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-black" v-for="(bio, index) in shikigami.accessories" :key="index">
                <td class="px-2 py-1 text-center table-cell w-[50px]">{{ index+4 }}</td>
                <td class="px-2 py-1 text-center table-cell w-[105px]">
                  <img :src="`/assets/shikigami/bios/${route.params.name}_Bio${index+4}.webp`" :alt="bio.name.en || bio.name.cn" class="w-24 h-24 object-contain mx-auto" />
                </td>
                <td class="px-2 py-1 text-center table-cell">
                  <div>{{ bio.name.en }}</div>
                  <div><span class="lang-zh">{{ bio.name.cn }}</span> - {{ bio.name.vn }}</div>
                </td>
                <td class="px-2 py-1 text-center table-cell">
                  {{ bio.type }}
                </td>
                <td class="px-2 py-1 text-center table-cell" v-html="highlightSkin(bio.obtained)">

                </td>
              </tr>
            </tbody>
          </table>

          <!-- Illustrations -->
          <h2 class="session-title mt-5">
            {{ isEnglish ? "Illustrations" : "Hoạ Ảnh" }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 mt-4">
            <div v-for="(img, index) in illustrations" :key="index" class="overflow-hidden shadow-md relative aspect-video">
              <img :src="getImgUrl(img.name)" :alt="img.name" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" :title="img.name" @click="openModal(getImgUrl(img.name))"/>
              <div 
                class="absolute bottom-3 right-5 bg-gradient-to-b from-white to-gray-200 text-black font-bold text-sm px-4 py-1 border border-gray-400 shadow-md">
                {{ img.name }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip -->
      <div v-if="showTooltip && tooltipData" class="tooltip" :style="{
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px',
        borderColor: tooltipData.color,
        boxShadow: '0 0 12px ' + tooltipData.color,
        '--tooltip-color': tooltipData.color,
      }" :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }">
        <!-- Note chính -->
        <div class="tooltip-title" :style="{ color: tooltipData.color }">
          {{ tooltipData.name }} <span class="lang-zh" v-if="tooltipData.cn">({{ tooltipData.cn }})</span>
        </div>
        <div v-if="imgs.length" class="tooltip-images pb-1">
          <img v-for="(img, i) in imgs" :key="i" :src="'/assets/effects/' + img + '.webp'" :alt="img" class="tooltip-img rounded rounded-sm" />
        </div>

        <div class="tooltip-description whitespace-pre-line" v-html="processTextWithTooltips(tooltipData.description)">
        </div>

        <!-- Nếu có subNotes match -->
        <div v-if="matchedSubNotes.length">
          <hr class="tooltip-divider" />
          <div class="subnotes-container">
            <div v-for="(sub, idx) in matchedSubNotes" :key="idx" class="subnote-block">
              <div class="subnote-title">
                {{ isEnglish ? sub.name.en : sub.name.vn }} <span class="lang-zh" v-if="sub.name.cn">({{ sub.name.cn
                  }})</span>
              </div>
              <img v-if="sub.images" v-for="(img, i) in sub.images" :key="i" :src="'/assets/effects/' + img + '.webp'" :alt="img"
                style="width: 32px; height: 32px; margin-bottom: 8px" />
              <div class="subnote-description"
                v-html="processTextWithTooltips(isEnglish ? sub.description.en : sub.description.vn)"></div>

              <!-- Sub-SubNotes -->
              <div v-if="sub.subNotes && sub.subNotes.length" class="mt-2">
                <div 
                  v-for="(subsub, j) in sub.subNotes" 
                  :key="j" 
                  class="subnote-block" 
                >
                  <div class="subnote-title">
                    {{ isEnglish ? subsub.name.en : subsub.name.vn }} 
                    <span class="lang-zh">({{ subsub.name.cn }})</span>
                  </div>

                  <img v-if="subsub.images" 
                      v-for="(img, k) in subsub.images" 
                      :key="k" 
                      :src="'/assets/effects/' + img + '.webp'"
                      :alt="img" 
                      class="rounded rounded-sm" 
                      style="width: 32px; height: 32px; margin-bottom: 8px" />

                  <div class="subnote-description" v-html="processTextWithTooltips(isEnglish ? subsub.description.en : subsub.description.vn)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showEditModal" class="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div class="bg-white rounded-2xl p-6 w-[800px] max-h-[90vh] shadow-xl flex flex-col">
          <h2 class="text-xl font-bold mb-4 text-[#a51919]">Edit Skill</h2>
          <div div class="overflow-y-auto flex-1">
            <h3 class="text-md font-bold text-black">Skill Names</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-black">EN</label>
                <input v-model="editingSkill.name.en"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
              </div>
              <div>
                <label class="block text-sm font-medium text-black">VN</label>
                <input v-model="editingSkill.name.vn"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
              </div>
              <div>
                <label class="block text-sm font-medium text-black">CN</label>
                <input v-model="editingSkill.name.cn"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
              </div>
              <div>
                <label class="block text-sm font-medium text-black">JP</label>
                <input v-model="editingSkill.name.jp"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
              </div>
            </div>

            <h3 class="text-md font-bold mt-5 text-black">Skill Info</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-black">Type</label>
                <input v-model="editingSkill.type"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
              </div>
              <div>
                <label class="block text-sm font-medium text-black">Onibi</label>
                <input v-model="editingSkill.onibi"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
              </div>
              <div>
                <label class="block text-sm font-medium text-black">Cooldown</label>
                <input v-model="editingSkill.cooldown"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-md font-bold mt-5 text-black">Skill Tags</h3>
                <div class="gap-4">
                  <input v-model="tagsInput" @input="updateTags"
                    class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
                </div>
              </div>

              <div>
                <h3 class="text-md font-bold mt-5 text-black">Skill Notes</h3>
                <div class="gap-4">
                  <input v-model="notesInput" @input="updateNotes"
                    class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
                </div>
              </div>
            </div>

            <h3 class="text-md font-bold mt-5 text-black">Skill Voice</h3>
            <div class="gap-4">
              <input v-model="editingSkill.voice"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" />
            </div>

            <h3 class="text-md font-bold mt-5 text-black">Skill Description</h3>
            <div class="gap-4">
              <div>
                <label class="block text-sm font-medium text-black">EN</label>
                <textarea v-model="editingSkill.description.en"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1" rows="4"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-black mt-2">VN</label>
                <textarea v-model="editingSkill.description.vn"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 pt-1" rows="4"></textarea>
              </div>
            </div>

            <h3 class="text-md font-bold mt-5 text-black">Skill Levels</h3>
            <div class="gap-4 grid grid-cols-2" v-if="Array.isArray(editingSkill.levels.en)">
              <div class="gap-1 grid grid-cols-1">
                <div v-for="(lvl, index) in editingSkill.levels.en" :key="index">
                  <label class="block text-sm font-medium mb-1 text-black">Level {{ lvl.level }}</label>
                  <textarea v-model="lvl.effect"
                    class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2"></textarea>
                </div>
              </div>

              <div class="gap-1 grid grid-cols-1">
                <div v-for="(lvl, index) in editingSkill.levels.vn" :key="index">
                  <label class="block text-sm font-medium mb-1 text-black">Level {{ lvl.level }}</label>
                  <textarea v-model="lvl.effect"
                    class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2"></textarea>
                </div>
              </div>
            </div>
            <div v-else class="gap-4 grid grid-cols-2">
              <div>
                <textarea v-model="editingSkill.levels.en"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2"></textarea>
              </div>
              <div>
                <textarea v-model="editingSkill.levels.vn"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2"></textarea>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            <button class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 rounded-md text-black cursor-pointer"
              @click="closeEditModal">
              Cancel
            </button>
            <button class="px-3 py-1 rounded bg-[#a51919] text-white hover:bg-[#891727] rounded-md cursor-pointer"
              @click="saveSkill">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<style>
.shikigami-profile {
  display: flex;
  border: 2px solid #a51919;
  border-radius: 6px;
  min-height: 400px;
  background: #fff;
  align-items: stretch; /* Đảm bảo tất cả panel có cùng chiều cao */
  max-height: 475px;
  width: 840px;
}

.hide-scrollbar {
  -ms-overflow-style: none;  /* IE, Edge */
  scrollbar-width: none;     /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;             /* Chrome, Safari, Opera */
}

/* Left panel */
.left-panel {
  flex: 0 0 auto;
  padding: 20px;
}
.cv-box {
  position: relative;
  width: 60px;
}
.cv-bg {
  width: 100%;
  display: block;
  border-radius: 6px;
}
.cv-content {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
}
.cv-text {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 14px;
  text-align: center;
}
.cv-audio {
  margin-top: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: white;
  transition: transform 0.2s ease, color 0.2s ease;
}
.cv-audio:hover {
  transform: scale(1.2);
  color: #ffd369;
}

/* Middle panel */
.bio-panel {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 20px 6px 20px 20px;
  max-width: 640px;
}

.bio-panel-text {
  overflow-x: auto;
  direction: rtl; /* Đưa scroll về bên phải */
  text-align: left; /* Căn text về bên phải */
}

/* Tùy chỉnh scroll bar (tùy chọn) */
.bio-panel-text::-webkit-scrollbar {
  height: 8px;
}

.bio-panel-text::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.bio-panel-text::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.bio-panel-text::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
.bio-text-vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 14px;
  line-height: 3;
  letter-spacing: 2.5px;
  margin: 0;
  display: inline-block; 
  white-space: nowrap;
  direction: ltr;
}
.bio-text-vertical span {
  height: 430px;
  display: block;
  border-left: 1px dashed #929191; 
  padding-left: 6px;
  margin-left: 6px;
}

.bio-text-vertical span.punct {
  padding-top: 2px; 
  display: inline-block;
}

/* Right panel */
.right-panel {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 20px 20px 20px 0;
}
.right-container {
  height: 100%;
  border-left: 2px solid #aaa;
  padding-left: 20px;
}
.tabs {
  display: flex;
  flex-direction: column;
  align-items: center; 
  max-width: 475px;
}
.tab-name {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-weight: bold;
  margin-bottom: 12px;
  letter-spacing: 2px;
  color: #a51919;
  font-size: 20px;
}
.tab {
  writing-mode: vertical-rl;
  padding: 6px 0;
  cursor: pointer;
  color: #555;
  transition: color 0.2s, font-weight 0.2s;
}
.tab.active {
  color: #4994d4;
  font-weight: bold;
}

.lang-zh {
  font-family: "stkaiti", sans-serif;
}

.voice-font {
  font-family: "Inconsolata", monospace;
  letter-spacing: 1px;
}

.content-section {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a3a4d;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.character-title {
  font-family: "Rubik", sans-serif;
  font-size: 42px;
  font-weight: medium;
  color: #3a3a3a;
  margin-bottom: 10px;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 22px;
  flex-shrink: 0;
}

.toggle-switch input[type="checkbox"] {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.slider {
  position: absolute;
  cursor: pointer;
  background-color: #ccc;
  border-radius: 22px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: 0.4s;
}

.slider::before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .slider {
  background-color: #a51919;
}
.toggle-switch input:checked + .slider::before {
  transform: translateX(22px);
}

.toggle-labels {
  position: absolute;
  width: 100%;
  top: 50%;
  left: 0;
  display: flex;
  justify-content: space-between;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: bold;
  color: white;
  padding: 0 5px;
  pointer-events: none;
  user-select: none;
}

.table-title {
  font-weight: bold;
  color: #f4f1e8;
  text-align: center;
  padding: 8px;
  background-color: #a51919;
  border: 1px solid #a51919;
}

.table-title-row {
  font-weight: bold;
  font-size: 14px !important;
  color: #f4f1e8;
  text-align: center;
  padding: 5px !important;
  background-color: #a51919;
  border: 1px solid #a51919;
}

.table-row {
  border: 1px solid #a51919;
  color: #333;
}

.table-cell {
  border: 1px solid #a51919;
}

.session-title {
  color: #3a3a3a;
  font-size: 24px;
  font-weight: 500;
  overflow: auto;
  padding: 6px 0;
  border-bottom: 0.5px solid #9c9c9c;
}

.lang-en {
  font-family: "Rubik", sans-serif;
}
.lang-vi {
  font-family: "Nunito", serif;
}

.image-icon {
  position: relative;
  top: -40px;
}

.icon-img {
  z-index: 10;
  border: 1px solid #a51919;
  padding: 5px;
  background: #fff;
}

.stats {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  overflow: visible;
}

.stats tbody th.label-cell {
  font-weight: bold;
  text-align: left;
  border-bottom: 1px solid #ddd;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
}

.stats tbody td.centered-number {
  text-align: center;
  color: #444;
}

.stats th,
.stats td {
  padding: 6px 10px;
}

.stats th {
  font-weight: normal;
}

.stats .image-icon {
  text-align: center;
  vertical-align: middle;
}

.stats .image-icon figure {
  display: inline-block;
  margin: 5px 0 0;
}

.stats tr:nth-child(1) th {
  font-size: 16px;
}

.stats tr:nth-child(n + 2) td:nth-last-child(1) {
  color: #a51919;
}

.stats img {
  vertical-align: middle;
}

.stats th[colspan="2"] {
  border: none;
}

.stats td {
  border: none;
}

.skill-name {
  font-weight: 900;
}

.skill-sub-name {
  font-weight: 600;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
}

.skill-info span {
  font-size: smaller;
  margin-left: 45px;
  text-align: center;
}

.skill-badges {
  display: flex;
  gap: 8px;
}

.tint-base {
  -webkit-mask-image: url("/brush.svg");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: cover;
  -webkit-mask-position: center;
  mask-image: url("/brush.svg");
  mask-repeat: no-repeat;
  mask-size: cover;
  mask-position: center;
}

/* Các màu tint */
.tint-red {
  background-color: #a63f37;
}

.tint-blue {
  background-color: #4994d4;
}

.tint-grey {
  background-color: #959494;
}

.tint-yellow {
  background-color: #c07b2a;
}

/* Tooltip Styles */
.effect-tooltip {
  font-weight: bold !important;
  cursor: pointer !important;
  text-decoration: none !important;
  border-bottom: none;
}

.effect-highlight {
  font-weight: 500;
  text-decoration: none !important;
  border-bottom: none;
}

.tooltip {
  position: fixed;
  z-index: 9999;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 8px;
  padding: 12px 16px;
  max-width: 300px;
  pointer-events: none;
  animation: tooltipFadeIn 0.2s ease-out;
}

.tooltip-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 4px;
}

.tooltip-images {
  display: flex;
  gap: 8px; /* khoảng cách giữa ảnh */
  flex-wrap: wrap; /* nếu nhiều quá thì tự xuống hàng */
}

.tooltip-img {
  width: 32px;
  height: 32px;
}

.tooltip-description {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}

.tooltip-divider {
  margin: 10px 0;
  border: none;
  border-top: 1px solid #d1d5db;
}

.subnotes-container {
  margin-top: 8px;
}

.subnote-block {
  margin-bottom: 8px;
}

.subnote-block:last-child {
  margin-bottom: 0;
}

.subnote-title {
  font-weight: bold;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.subnote-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.3;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ensure tooltip appears above other elements */
.tooltip::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--tooltip-color);
}

.tooltip::after {
  content: "";
  position: absolute;
  top: -5px;
  left: 21px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid #ffffff;
}
</style>
