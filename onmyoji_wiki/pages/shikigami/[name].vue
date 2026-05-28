<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useSupabase } from "~/composables/useSupabase";
import { useTags } from "~/composables/useTags";

import {
  getStatRank,
  getStatRankImage,
} from "@/utils/stats";

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
const souls = ref([]);
const isEnglish = ref(true);

// UI
const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

const activeTab = ref(route.hash.replace("#", "") || "Main");
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

function changeTab(tab) {
  activeTab.value = tab;

  history.replaceState(null, "", `${window.location.pathname}#${tab}`);
}

function changeSkill(index) {
  activeSkillIndex.value = index;

  let hash = `Skill${index + 1}`;

  if (index === 3) {
    if (shikigami.value.rarity === "UR") {
      hash = "Link";
    } else {
      hash = "Evo";
    }
  }

  history.replaceState(null, "", `${window.location.pathname}#${hash}`);
}

/* ---------------------- HELPERS ---------------------- */
const getImgUrl = (name) => `/assets/illustrations/${name.replace(/ /g, "_")}.jpg`;

/* ---------------------- EVOLUTION RENDER ---------------------- */
const renderEvoText = (evo) => {
  const evoTemplate = evolution.value;
  if (!evoTemplate) {
    return "";
  }
  if (!evoTemplate) return "";

  let text = isEnglish.value ? evoTemplate.text.en : evoTemplate.text.vn;
  if (!text) return "";

  const replacements = {
    name: isEnglish.value ? shikigami.value.name.en : shikigami.value.name.vn,
  };

  if (evo.skill) {
    const targetSkill = isEnglish.value
      ? shikigami.value.skills[evo.skill - 1].name.en
      : shikigami.value.skills[evo.skill - 1].name.vn;
    replacements.skill = highlightWord(targetSkill);
  }

  if (evo.count) replacements.count = evo.count;

  return text.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? "");
};

/* ---------------------- BIO RENDER ---------------------- */
const renderBioText = (biography) => {
  const bioTemplate = conditions.value.find((b) => b.id === biography.no);
  if (!bioTemplate) {
    return "";
  }
  if (!bioTemplate) return "";

  let text = isEnglish.value ? bioTemplate.text.en : bioTemplate.text.vn;
  if (!text) return "";

  const name = isEnglish.value ? shikigami.value.name.en : shikigami.value.name.vn;

  const replacements = { name };

  if (biography.count) replacements.count = biography.count;
  if (biography.skill) {
    const targetSkill = isEnglish.value
      ? shikigami.value?.skills[biography.skill - 1].name.en
      : shikigami.value?.skills[biography.skill - 1].name.vn;
    replacements.skill = targetSkill;
  }
  if (biography.shiki) {
    const targetShiki = shikigamiList.value.find((s) => s.id === biography.shiki);
    if (targetShiki) {
      const shikiName = isEnglish.value ? targetShiki.name.en : targetShiki.name.vn;
      replacements.shiki = makeHighlight(shikiName, "shikigami");
    } else {
      replacements.shiki = "";
    }
  }

  if (biography.onmyoji) {
    const targetOnmyoji = onmyojiList.value.find((o) => o.id === biography.onmyoji);
    if (targetOnmyoji) {
      const onmyojiName = isEnglish.value ? targetOnmyoji.name.en : targetOnmyoji.name.vn;
      replacements.onmyoji = makeHighlight(onmyojiName, "onmyoji");
    } else {
      replacements.onmyoji = "";
    }
  }

  return text.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? "");
};

const makeHighlight = (keyword, type) => {
  if (!keyword || !type) return keyword || "";

  let finalName = keyword;

  if (type === "shikigami") {
    const targetShikigami = shikigamiList.value?.find((s) =>
      [s.name.en, s.name.vn, ...(Array.isArray(s.name.jp) ? s.name.jp : [s.name.jp])]
        .filter(Boolean)
        .some((n) => n.toLowerCase() === keyword.toLowerCase())
    );
    if (targetShikigami) {
      const n = targetShikigami.name;
      finalName = Array.isArray(n.jp) ? n.jp[1] || n.jp[0] : n.jp || keyword;
    }
  }

  if (type === "onmyoji") {
    const targetOnmyoji = onmyojiList.value?.find((o) =>
      [o.name.en, o.name.vn, ...(Array.isArray(o.name.jp) ? o.name.jp : [o.name.jp])]
        .filter(Boolean)
        .some((n) => n.toLowerCase() === keyword.toLowerCase())
    );
    if (targetOnmyoji) {
      finalName = targetOnmyoji.name.en || keyword;
    }
  }

  finalName = finalName.replace(/\s+/g, "_");

  return `<b><a href="/${type}/${encodeURIComponent(
    finalName
  )}" class="text-[#a51919] font-bold">${keyword}</a></b>`;
};

/* ---------------------- TOOLTIP ---------------------- */
const imgs = computed(() => tooltipData.value?.images || []);

function addIngForm(word) {
  if (word.endsWith("e")) {
    return word.slice(0, -1);
  }

  return word;
}

const effectByIdMap = computed(() => {
  return new Map(
    effects.value.map((e) => [String(e.id), e])
  );
});

const effectKeywordMap = computed(() => {
  const map = new Map();

  const addEffectNames = (effect) => {
    [
      effect.name?.en,
      effect.name?.vn,
      effect.name?.cn,
    ]
      .filter(Boolean)
      .forEach((name) => {
        const key = name.toLowerCase();

        if (!map.has(key)) {
          map.set(key, effect);
        }
      });
  };

  effects.value.forEach((effect) => {
    addEffectNames(effect);

    effect.subs?.forEach((subId) => {
      const sub =
        effectByIdMap.value.get(String(subId));

      if (sub) {
        addEffectNames(sub);
      }
    });
  });

  return map;
});

const shikigamiMap = computed(() => {
  return new Map(
    shikigamiList.value.map((s) => [
      String(s.id),
      s,
    ])
  );
});

const onmyojiMap = computed(() => {
  return new Map(
    onmyojiList.value.map((o) => [
      String(o.id),
      o,
    ])
  );
});

const replacePipeline = (
  text,
  transformers
) => {
  return transformers.reduce(
    (acc, [regex, replacer]) =>
      acc.replace(regex, replacer),
    text
  );
};

const getLocalizedName = (obj) => {
  if (!obj) return "";

  return isEnglish.value
    ? obj.name?.en || obj.name?.vn || ""
    : obj.name?.vn ||
        obj.name?.en ||
        "";
};

const createEntitySpan = (
  name,
  type
) => {
  return `
    <span class="entity ${type}">
      ${name}
    </span>
  `;
};

const getSkillName = (
  shiki,
  index
) => {
  if (!shiki?.skills?.length)
    return "";

  const skill =
    shiki.skills[index - 1];

  if (!skill) return "";

  return isEnglish.value
    ? skill.name?.en
    : skill.name?.vn ||
        skill.name?.en;
};

const createSkillSpan = (
  name,
  clickable = false,
  bold = false
) => {
  return `
    <span
      class="
        skill-keyword
        text-[#c07b2a]
        ${bold ? "font-bold" : ""}
        ${
          clickable
            ? "cursor-pointer"
            : ""
        }
      "
      data-keyword="${name}"
    >
      ${name}
    </span>
  `;
};

const colorMap = {
  red: "#a63f37",
  blue: "#4994d4",
  yellow: "#c07b2a",
};

const resolveEffect = (
  content
) => {
  if (/^\d+$/.test(content)) {
    return effectByIdMap.value.get(
      String(content)
    );
  }

  return effectKeywordMap.value.get(
    content.toLowerCase()
  );
};

const createEffectSpan = ({
  effect,
  text,
  plain = false,
  bold = false,
}) => {
  const color =
    colorMap[effect.color] ||
    "#a51919";

  return `
    <span
      class="${bold ? "font-bold" : ""}"
      style="${
        plain
          ? ""
          : `color:${color}`
      }"
    >
      ${text}
    </span>
  `;
};

const processHighlightText = (text) => {
  if (!text) return "";

  let processed = text;

  processed = replacePipeline(processed, [
    // ICONS
    [
      /<e>(.*?)<\/e>/g,
      (_, keyword) => `
          <img
            src="/assets/effects/${keyword}.webp"
            alt="${keyword}"
            class="inline-block w-6 h-6 align-text-bottom rounded-md"
          />
        `,
    ],

    // SHIKIGAMI
    [
      /<k>(.*?)<\/k>/g,
      (_, id) => {
        const shiki = shikigamiMap.value.get(String(id));

        if (!shiki) return _;

        return createEntitySpan(getLocalizedName(shiki), "shikigami");
      },
    ],

    // ONMYOJI
    [
      /<r>(.*?)<\/r>/g,
      (_, id) => {
        const onmyoji = onmyojiMap.value.get(String(id));

        if (!onmyoji) return _;

        return createEntitySpan(getLocalizedName(onmyoji), "onmyoji");
      },
    ],

    // CURRENT SKILL
    [
      /<(c|m|o)>(.*?)<\/\1>/g,
      (_, type, content) => {
        const index = parseInt(content);

        const name = getSkillName(shikigami.value, index);

        if (!name) return _;

        return createSkillSpan(name, type === "c", type === "c");
      },
    ],

    // OTHER SHIKI SKILL
    [
      /<(d|p)>(.*?)<\/\1>/g,
      (_, type, content) => {
        const [shikiId, skillIndex] = content.split("-");

        const shiki = shikigamiMap.value.get(String(shikiId));

        if (!shiki) return _;

        const name = getSkillName(shiki, parseInt(skillIndex));

        if (!name) return _;

        return createSkillSpan(name, type === "d", type === "d");
      },
    ],

    // EFFECTS
    [
      /<(f|g|b|a|h|i|l)>(.*?)<\/\1>/g,
      (_, type, content) => {
        const effect = resolveEffect(content);

        if (!effect) return _;

        let keyword = isEnglish.value
          ? effect.name?.en
          : effect.name?.vn || effect.name?.en;

        if (!keyword) return _;

        if (type === "f" || type === "l") {
          keyword = keyword.toLowerCase();
        }

        if (type === "g") {
          keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        }

        return createEffectSpan({
          effect,
          text: keyword,
          plain: type === "i" || type === "l",
          bold: type === "b" || type === "h",
        });
      },
    ],
  ]);

  return processed;
};

const getAllSkillEffectText = (skill) => {
  let text = "";

  // description
  text += isEnglish.value ? skill.description?.en || "" : skill.description?.vn || "";

  // levels
  const levels = isEnglish.value ? skill.levels?.en : skill.levels?.vn;

  if (Array.isArray(levels)) {
    text += levels.map((lvl) => lvl.effect || "").join(" ");
  } else if (typeof levels === "string") {
    text += " " + levels;
  }

  return text;
};

const extractEffectCards = (text, visited = new Set()) => {
  if (!text || !effects.value?.length) return [];

  const effectById = new Map(effects.value.map((e) => [String(e.id), e]));

  // lấy tất cả id trong <b>
  const ids = [...text.matchAll(/<b>(\d+)<\/b>/g)].map((m) => m[1]);

  const results = [];

  ids.forEach((id) => {
    // tránh loop vô hạn
    if (visited.has(id)) return;

    visited.add(id);

    const effect = effectById.get(id);

    if (!effect) return;

    results.push(effect);

    // recursive từ effect.description
    const desc = isEnglish.value ? effect.description?.en : effect.description?.vn;

    const nested = extractEffectCards(desc, visited);

    results.push(...nested);
  });

  // unique
  return Array.from(new Map(results.map((e) => [e.id, e])).values());
};

const effectTagType = (tag) => {
  const value = tag.toLowerCase();

  if (value.includes("buff")) return "buff";
  if (value.includes("debuff")) return "debuff";
  if (value.includes("mark")) return "mark";
  if (value.includes("status")) return "status";

  return "general";
};

const extractEffectTags = (desc) => {
  if (!desc)
    return {
      tags: [],
      description: desc,
    };

  const match = desc.match(/^\[(.*?)\]\s*/);

  if (!match) {
    return {
      tags: [],
      description: desc,
    };
  }

  const tags = match[1]
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const cleanedDescription = desc.replace(/^\[(.*?)\]\s*/, "");

  return {
    tags,
    description: cleanedDescription,
  };
};

const getParsedEffect = (effect) => {
  return extractEffectTags(
    isEnglish.value ? effect.description?.en : effect.description?.vn
  );
};

const highlightWord = (text) => {
  if (!text) return "";
  return `<span class="skill-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${text}">${text}</span>`;
};

const highlightSkin = (content) => {
  if (!content || !shikigami?.value?.skins?.length) return content;

  return content.replace(/<b>(\d+)<\/b>/g, (_, num) => {
    const index = parseInt(num, 10);
    const skinItem =
      shikigami.value.rarity !== "SP"
        ? shikigami.value.skins[index + 1]
        : shikigami.value.skins[index];

    if (!skinItem) return _;

    const keyword = skinItem.name?.en || skinItem.name?.cn || "";

    return `<span class="text-[#c07b2a]">${keyword}</span>`;
  });
};

const matchedSubNotes = computed(() => {
  if (!tooltipData.value || !effects.value?.length) return [];

  const effectById = new Map(effects.value.map((e) => [e.id, e]));

  const getText = (descObj) => {
    if (typeof descObj === "string") return descObj;
    return isEnglish.value ? descObj?.en || "" : descObj?.vn || "";
  };

  const findNotes = (descObj, exclude = new Set()) => {
    const text = getText(descObj);
    const bMatches = text.match(/<b>(.*?)<\/b>/g) || [];

    const res = [];
    const seenLevel = new Set();

    for (const bTag of bMatches) {
      const inner = bTag.replace(/<b>|<\/b>/g, "");
      const nums = inner.match(/\d+/g) || [];

      for (const s of nums) {
        const id = Number(s);
        if (!id || exclude.has(id) || seenLevel.has(id)) continue;

        const note = effectById.get(id);
        if (note) {
          res.push({ ...note });
          seenLevel.add(id);
        }
      }
    }
    return res;
  };

  const rootId = tooltipData.value.id;
  const subs = findNotes(tooltipData.value.description, new Set([rootId]));

  const subIds = new Set(subs.map((s) => s.id));

  return subs.map((sub) => {
    const exclude = new Set([rootId, ...subIds, sub.id]);
    const subNotes = findNotes(sub.description, exclude);
    return { ...sub, subNotes };
  });
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

    const onmyojiMatch = content.match(/^o-(\d+)$/i);
    if (onmyojiMatch) {
      const id = parseInt(onmyojiMatch[1], 10);
      targetData = onmyojiList.value?.find((o) => o.id === id);
      if (targetData) targetType = "onmyoji";
    } else {
      const shikiId = parseInt(content, 10);
      if (!isNaN(shikiId)) {
        targetData = shikigamiList.value?.find((s) => s.id === shikiId);
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

    const onmyojiMatch = content.match(/^o-(\d+)$/i);
    if (onmyojiMatch) {
      const id = parseInt(onmyojiMatch[1], 10);
      targetData = onmyojiList.value?.find((o) => o.id === id);
      if (targetData) targetType = "onmyoji";
    } else {
      // mặc định là shikigami id
      const shikiId = parseInt(content, 10);
      if (!isNaN(shikiId)) {
        targetData = shikigamiList.value?.find((s) => s.id === shikiId);
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
      targetData = onmyojiList.value?.find((o) => o.id === id);
      if (targetData) targetType = "onmyoji";
    } else {
      // shikigami id
      const shikiId = parseInt(content, 10);
      if (!isNaN(shikiId)) {
        targetData = shikigamiList.value?.find((s) => s.id === shikiId);
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

    return `<b><a href="/${targetType}/${encodeURIComponent(
      finalName
    )}" class="text-[#a51919] font-bold">${keyword}</a></b>`;
  });

  return result;
};

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

async function fetchSouls(ids) {
  if (!ids || !ids.length) {
    souls.value = [];
    return;
  }

  const { data, error } = await supabase.from("Soul").select("*").in("id", ids);

  if (error) {
    console.error("Error fetching souls:", error);
    souls.value = [];
  } else {
    const order = ids.map(Number); // ép thành number

    souls.value = data.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }
}

function getSoul(id) {
  return souls.value.find((s) => s.id === id);
}

function getSoulName(id) {
  const soul = getSoul(id);
  return soul ? soul.name.en : "";
}

function getSoulSlug(id) {
  const soul = getSoul(id);
  return soul ? soul.name.en.replace(/\s+/g, "_") : "";
}

function parseStats(indicate) {
  return indicate
    .split("/")
    .map((slot) => slot.split(/or/i).map((s) => s.replace(/[()]/g, "").trim()));
}

function getStatClass(stat) {
  stat = stat.toLowerCase();

  if (stat.includes("atk")) return "border-red-300 text-red-500";
  if (stat.includes("spd")) return "border-blue-300 text-blue-500";
  if (stat.includes("crit")) return "border-yellow-300 text-yellow-600";
  if (stat.includes("cdmg")) return "border-purple-300 text-purple-600";
  if (stat.includes("hp")) return "border-green-300 text-green-600";
  if (stat.includes("hit")) return "border-cyan-300 text-cyan-600";
  if (stat.includes("res")) return "border-orange-300 text-orange-600";
  if (stat.includes("def")) return "border-amber-400 text-amber-700";

  return "border-gray-300 text-gray-700";
}

function parseSubstats(text) {
  return text
    .replace(/=/g, " = ")
    .replace(/>>/g, " >> ")
    .replace(/>/g, " > ")
    .replace(/\//g, " / ")
    .trim()
    .split(/\s+/)
    .map((token) => {
      if (token === ">" || token === ">>" || token === "/") {
        return { type: "arrow", value: token };
      }

      return { type: "stat", value: token };
    });
}

const roleMap = {
  DPS: "bg-red-500",
  "Weak DPS": "bg-red-400",

  Counter: "bg-orange-500",
  Dispel: "bg-yellow-500 text-black",

  Puller: "bg-blue-500",
  "Self Pull": "bg-blue-400",
  Pusher: "bg-indigo-500",

  CC: "bg-purple-500",

  Healer: "bg-emerald-500",
  Revive: "bg-green-500",

  Shield: "bg-cyan-500",

  "Res Buffer": "bg-lime-500 text-black",

  Orbs: "bg-pink-500",

  Support: "bg-gray-500",
  "Special Support": "bg-gray-700",

  Utility: "bg-slate-500",

  Hybrid: "bg-fuchsia-500",

  Unique: "bg-amber-500 text-black",

  Meme: "bg-black text-white",
};

const getRoleClass = (role) => {
  return roleMap[role] || "bg-gray-500 text-black border-gray-200";
};

const parseRoles = (roleStr) => {
  if (!roleStr) return [];
  return roleStr.split(/[/|]/).map((r) => r.trim());
};

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

  if (error) {
    console.error("Error fetching shikigami:", error);
    return;
  }

  shikigami.value = data;

  await nextTick();

  if (data.rarity !== "SP") {
    fetchEvolution(data.evolution.no);
  }

  if (data.build?.length) {
    // gom toàn bộ soul id từ các build
    const soulIds = [...new Set(data.build.flatMap((b) => b.souls || []))];

    await fetchSouls(soulIds);
  }

  await fetchIllustrations(data.id);
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
    await nextTick();
  }
}

/* ---------------------- REALTIME ---------------------- */

let shikigamiChannel = null;
let effectChannel = null;
let illustrationChannel = null;

// setInterval(async () => {
//   if (document.visibilityState === "visible") {
//     await fetchShikigami();
//   }
// }, 5000);

/* ---------------------- SUBSCRIBE ---------------------- */

function subscribeRealtime() {
  // --- Channel Shikigami ---
  if (!shikigamiChannel) {
    shikigamiChannel = supabase
      .channel("shikigami-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Shikigami" },
        async (payload) => {
          console.log("Shikigami changed:", payload);

          await fetchAllShikigami();
          await fetchShikigami();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime Shikigami connected");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.log("Realtime Shikigami reconnecting...");
          unsubscribeRealtime();
          subscribeRealtime();
        }
      });
  }

  // --- Channel Illustration ---
  if (!illustrationChannel) {
    illustrationChannel = supabase
      .channel("illustration-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Illustration" },
        async (payload) => {
          console.log("Illustration changed:", payload);

          const shikiId = shikigami.value?.id;

          if (shikiId) {
            await fetchIllustrations(shikiId);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime Illustration connected");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.log("Realtime Illustration reconnecting...");
          unsubscribeRealtime();
          subscribeRealtime();
        }
      });
  }

  // --- Channel Effect ---
  if (!effectChannel) {
    effectChannel = supabase
      .channel("effect-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Effect" },
        async (payload) => {
          console.log("Effect changed:", payload);

          const effectIds = shikigami.value?.skills || [];

          if (!effectIds.length) return;

          const changedId = payload.new?.id || payload.old?.id;

          if (effectIds.includes(changedId)) {
            console.log("Effect in current page changed");

            await fetchAllEffects();
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime Effect connected");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.log("Realtime Effect reconnecting...");
          unsubscribeRealtime();
          subscribeRealtime();
        }
      });
  }
}

/* ---------------------- UNSUBSCRIBE ---------------------- */

function unsubscribeRealtime() {
  if (shikigamiChannel) {
    supabase.removeChannel(shikigamiChannel);
    shikigamiChannel = null;
  }

  if (effectChannel) {
    supabase.removeChannel(effectChannel);
    effectChannel = null;
  }

  if (illustrationChannel) {
    supabase.removeChannel(illustrationChannel);
    illustrationChannel = null;
  }
}

/* ---------------------- TAB VISIBILITY ---------------------- */

let reconnectTimeout = null;

async function handleVisibilityChange() {
  if (document.visibilityState !== "visible") {
    return;
  }

  console.log("Tab active → reconnect realtime");

  await Promise.all([fetchAllShikigami(), fetchAllEffects()]);

  clearTimeout(reconnectTimeout);

  reconnectTimeout = setTimeout(() => {
    unsubscribeRealtime();
    subscribeRealtime();
  }, 300);
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

  const updatedSkill = {
    ...editingSkill.value,
    levels: {
      en: Array.isArray(editingSkill.value.levels.en)
        ? editingSkill.value.levels.en.map((l) => ({ ...l }))
        : editingSkill.value.levels.en,
      vn: Array.isArray(editingSkill.value.levels.vn)
        ? editingSkill.value.levels.vn.map((l) => ({ ...l }))
        : editingSkill.value.levels.vn,
    },
    tags: [...(editingSkill.value.tags || [])],
    notes: [...(editingSkill.value.notes || [])],
  };

  shikigami.value.skills.splice(editingSkillIndex.value, 1, updatedSkill);

  const payload = JSON.parse(JSON.stringify(shikigami.value.skills));

  const { error } = await supabase
    .from("Shikigami")
    .update({ skills: payload })
    .eq("id", shikigami.value.id);

  if (error) {
    console.error(error);
    alert(error.message);
  } else {
    alert("Saved!");
    closeEditModal();
  }
};

function updateTags() {
  editingSkill.value.tags = tagsInput.value
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x !== "" && !isNaN(x))
    .map(Number);
}

/* ---------------------- LIFECYCLE ---------------------- */
const hasLevel40 = computed(() => shikigami.value?.id !== 193);

onMounted(async () => {
  document.title = formattedName;

  const saved = localStorage.getItem("lang");

  if (saved) {
    isEnglish.value = saved === "en";
  }

  const hash = window.location.hash.replace("#", "");

  if (hash) {
    activeTab.value = hash;
  }

  if (hash.startsWith("Skill")) {
    activeTab.value = "Main";

    const num = parseInt(hash.split("Skill")[1]);

    activeSkillIndex.value = isNaN(num) ? 0 : num - 1;
  }

  if (hash === "Evo" || hash === "Link") {
    activeTab.value = "Main";
    activeSkillIndex.value = 3;
  }

  await Promise.all([
    fetchAllEffects(),
    fetchAllShikigami(),
    fetchShikigami(),
    fetchAllOnmyoji(),
    fetchConditions(),
    loadTags(),
  ]);

  subscribeRealtime();

  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  unsubscribeRealtime();

  clearTimeout(reconnectTimeout);

  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

watch(
  () => route.hash,
  (hash) => {
    const cleanHash = hash.replace("#", "");

    if (!cleanHash) {
      activeTab.value = "Main";
      return;
    }

    if (cleanHash.startsWith("Skill")) {
      activeTab.value = "Main";

      const num = parseInt(cleanHash.replace("Skill", ""));

      activeSkillIndex.value = isNaN(num) ? 0 : num - 1;

      return;
    }

    if (cleanHash === "Evo" || cleanHash === "Link") {
      activeTab.value = "Main";
      activeSkillIndex.value = 3;
      return;
    }

    activeTab.value = cleanHash;
  }
);

watch(isEnglish, (val) => {
  localStorage.setItem("lang", val ? "en" : "vn");
});

watch(
  () => activeSkillIndex.value,
  () => {
    addCKeywordListeners();
  }
);

watch(activeTab, async (newTab) => {
  if (newTab === "Gallery" || illustrations.value.length === 0) {
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
  <div class="container" v-if="shikigami">
    <div class="content-section flex flex-col gap-4">
      <!-- Name -->
      <div class="header-row">
        <div class="title">{{ shikigami.name.jp[1] }}</div>
        <label class="toggle-switch" title="Switch Language">
          <input type="checkbox" v-model="isEnglish" />
          <span class="slider"></span>
          <div class="toggle-labels">
            <span>EN</span>
            <span>VN</span>
          </div>
        </label>
      </div>

      <div class="flex gap-6">
        <div class="character-image-wrapper">
          <div class="character-image-box">
            <img
              :src="`/assets/shikigami/images/${route.params.name}.webp`"
              :alt="shikigami.name.jp[1]"
              class="character-image"
            />
          </div>
        </div>

        <!-- Name -->
        <div class="flex justify-end w-1/3">
          <table class="w-full">
            <thead>
              <tr class="table-title">
                <th class="p-2 relative" colspan="4">
                  <div>{{ shikigami.name.jp[1] }}</div>
                  <img
                    :src="`/assets/rarity/${shikigami.rarity}.webp`"
                    :alt="shikigami.rarity"
                    class="object-contain absolute top-[-30px] left-[-40px]"
                    :class="{
                      'w-14 h-14': shikigami.rarity === 'UR',
                      'w-16 h-16': shikigami.rarity !== 'UR',
                    }"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="table-row">
                <td class="px-4 py-2">
                  <strong>CN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-zh">{{ shikigami.name?.cn[0] }}</div>
                  <div>{{ shikigami.name.cn[1] }}</div>
                </td>
              </tr>
              <tr class="table-row">
                <td class="px-4 py-2">
                  <strong>JP</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-zh">{{ shikigami.name.jp[0] }}</div>
                  <div>{{ shikigami.name.jp[1] }}</div>
                </td>
              </tr>
              <tr class="table-row">
                <td class="px-4 py-2">
                  <strong>GL</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ shikigami.name.en }}</div>
                </td>
              </tr>
              <tr class="table-row">
                <td class="px-4 py-2">
                  <strong>VN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ shikigami.name.vn }}</div>
                </td>
              </tr>
              <tr>
                <td class="table-title-row" colspan="4">Voice Actor</td>
              </tr>
              <tr class="table-row">
                <td class="px-4 py-2">
                  <strong>{{
                    shikigami.id === 257 || shikigami.id === 256 ? "CN" : "JP"
                  }}</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div
                    class="whitespace-pre-line"
                    :class="shikigami.id === 257 || shikigami.id === 256 ? 'lang-zh' : ''"
                  >
                    {{ shikigami.name.va }}
                  </div>
                </td>
              </tr>
              <tr
                v-if="
                  !['SP', 'UR', 'N'].includes(shikigami.rarity) && shikigami.id !== 193
                "
              >
                <td class="table-title-row" colspan="4">Evo Materials</td>
              </tr>
              <tr v-if="shikigami.materials && shikigami.materials.length">
                <td
                  class="table-cell p-2"
                  v-for="material in shikigami.materials"
                  :key="material.type"
                >
                  <div class="w-12 h-12 flex items-center justify-center relative">
                    <img
                      :src="`/assets/materials/${material.type}.webp`"
                      :alt="material.type"
                      class="max-h-full max-w-full object-contain"
                      :title="material.name"
                    />
                    <span
                      class="absolute bottom-0 right-0"
                      style="
                        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
                          1px 1px 0 #000;
                      "
                      >{{ material.quantity }}</span
                    >
                  </div>
                </td>
              </tr>
              <tr v-if="shikigami.version !== null">
                <td class="table-title-row" colspan="4">Other Version</td>
              </tr>
              <tr v-if="shikigami.version !== null" class="table-row">
                <td colspan="4" class="p-1">
                  <div
                    class="gap-4 justify-items-center"
                    :class="shikigami.version.length > 1 ? 'grid grid-cols-2' : ''"
                  >
                    <div
                      v-for="ver in shikigami.version"
                      :key="ver"
                      class="flex flex-col items-center justify-start"
                    >
                      <a :href="`/shikigami/${ver.replace(/ /g, '_')}`">
                        <img
                          :src="`/assets/shikigami/shards/${ver.replace(
                            / /g,
                            '_'
                          )}_Shard.webp`"
                          class="h-16 w-16 object-contain mb-1"
                          @error="
                            (event) => (event.target.src = '/assets/Unknown_Shard.webp')
                          "
                        />
                      </a>
                      <a :href="`/shikigami/${ver.replace(/ /g, '_')}`">
                        {{ ver }}
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="table-title-row" colspan="4">Release Date</td>
              </tr>
              <tr class="table-row">
                <td class="px-4 py-2">
                  <p>CN</p>
                  <p v-if="shikigami.date.en">GL</p>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ shikigami.date.cn }}</div>
                  <div v-if="shikigami.date.en">
                    {{ shikigami.date.en }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Profile -->
      <div
        class="profile-section"
        v-if="shikigami.profile !== null"
        v-html="highlightProfileText(shikigami.profile, isEnglish)"
      ></div>

      <!-- Content -->
      <div class="tabs">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'Main' }"
          @click="changeTab('Main')"
        >
          {{ isEnglish ? "Main" : "Chính Điện" }}
        </button>

        <button
          class="tab-button"
          :class="{ active: activeTab === 'Gallery' }"
          @click="changeTab('Gallery')"
        >
          {{ isEnglish ? "Gallery" : "Hoạ Phòng" }}
        </button>

        <button
          class="tab-button"
          :class="{ active: activeTab === 'Dialogue' }"
          @click="changeTab('Dialogue')"
        >
          {{ isEnglish ? "Dialogue" : "Lời Thoại" }}
        </button>
      </div>

      <!-- Main Tab -->
      <div
        class="w-full"
        v-show="activeTab === 'Main'"
        :class="activeTab === 'Main' ? 'opacity-100' : 'opacity-0'"
      >
        <!-- Stats -->
        <h2 class="session-title top-0">
          {{ isEnglish ? "Stats" : "Chỉ số" }}
        </h2>
        <div class="stats-wrapper">
          <table class="stats-table">
            <tbody>
              <!-- HEADER -->
              <tr class="stats-header">
                <!-- 1 -->
                <th>&nbsp;</th>

                <!-- 2 -->
                <th></th>

                <!-- 3 + 4 -->
                <th colspan="2">
                  <div class="stats-title">
                    {{
                      shikigami.rarity !== "SP" &&
                      shikigami.rarity !== "UR" &&
                      shikigami.rarity !== "N"
                        ? isEnglish
                          ? "Unevolved"
                          : "Cơ bản"
                        : ""
                    }}
                    <br />
                    {{ isEnglish ? "Level 1" : "Cấp 1" }}
                  </div>
                </th>

                <!-- 5 + 6 -->
                <th colspan="2" v-if="hasLevel40">
                  <div class="stats-title">
                    {{
                      shikigami.rarity !== "SP" &&
                      shikigami.rarity !== "UR" &&
                      shikigami.rarity !== "N"
                        ? isEnglish
                          ? "Evolved"
                          : "Thức tỉnh"
                        : ""
                    }}
                    <br />
                    {{ isEnglish ? "Level 40" : "Cấp 40" }}
                  </div>
                </th>

                <!-- 7 + 8 -->
                <th colspan="2"></th>
              </tr>

              <!-- ICON -->
              <tr class="stats-header">
                <!-- 1 -->
                <th></th>

                <!-- 2 -->
                <th></th>

                <!-- 3 + 4 -->
                <th colspan="2" class="icon-cell">
                  <figure class="stats-figure">
                    <img
                      :src="`/assets/shikigami/icons/${route.params.name}_Icon.webp`"
                      :alt="shikigami.name.jp[1]"
                      class="stats-icon"
                      @error="(event) => (event.target.src = '/assets/Unknown_Icon.webp')"
                    />
                  </figure>
                </th>

                <!-- 5 + 6 -->
                <th colspan="2" v-if="hasLevel40" class="icon-cell">
                  <figure class="stats-figure">
                    <img
                      :src="`/assets/shikigami/icons/${route.params.name}_Icon${
                        shikigami.rarity !== 'SP' &&
                        shikigami.rarity !== 'UR' &&
                        shikigami.rarity !== 'N'
                          ? '_Evo'
                          : ''
                      }.webp`"
                      :alt="shikigami.name.jp[1]"
                      class="stats-icon"
                      @error="(event) => (event.target.src = '/assets/Unknown_Icon.webp')"
                    />
                  </figure>
                </th>

                <!-- 7 + 8-->
                <th colspan="2"></th>
              </tr>

              <!-- SPACING -->
              <tr>
                <th colspan="8" class="spacing-row"></th>
              </tr>

              <!-- BORDER -->
              <tr class="top-border-row spacing-row">
                <th colspan="8"></th>
              </tr>

              <!-- === ATK === -->
              <tr class="stats-row">
                <!-- 1 -->
                <td></td>

                <!-- 2 -->
                <td class="label-cell">
                  <img src="/assets/stats/ATK.webp" alt="ATK" />
                  ATK
                </td>

                <!-- 3 -->
                <td>
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('ATK', shikigami.stats.ATK[0])"
                      :alt="getStatRank('ATK', shikigami.stats.ATK[0])"
                    />
                  </div>
                </td>

                <!-- 4 -->
                <td>
                  {{ shikigami.stats.ATK[0] }}
                </td>

                <!-- 5 -->
                <td v-if="hasLevel40">
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('ATK_EVO', shikigami.stats.ATK[1])"
                      :alt="getStatRank('ATK_EVO', shikigami.stats.ATK[1])"
                    />
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 6 -->
                <td v-if="hasLevel40">
                  <div class="flex">
                    {{ shikigami.stats.ATK[1] }}
                    <span
                      v-if="shikigami.evolution && shikigami.evolution.no === 1"
                      class="increase-cell"
                    >
                      +{{
                        Math.round(
                          (shikigami.stats.ATK[1] * shikigami.evolution.count) / 100
                        )
                      }}
                    </span>
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 7 -->
                <td v-if="hasLevel40">
                  <div class="bonus-stat">
                    +{{
                      Math.round(
                        shikigami.stats.ATK[1] *
                          (1 +
                            (shikigami.evolution && shikigami.evolution.no === 1
                              ? shikigami.evolution.count / 100
                              : 0))
                      ) - shikigami.stats.ATK[0]
                    }}
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 8 -->
                <td class="right-border"></td>
              </tr>

              <!-- === HP === -->
              <tr class="stats-row">
                <!-- 1 -->
                <td></td>

                <!-- 2 -->
                <td class="label-cell">
                  <img src="/assets/stats/HP.webp" alt="HP" />
                  HP
                </td>

                <!-- 3 -->
                <td>
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('HP', shikigami.stats.HP[0])"
                      :alt="getStatRank('HP', shikigami.stats.HP[0])"
                    />
                  </div>
                </td>

                <!-- 4 -->
                <td>
                  {{ shikigami.stats.HP[0] }}
                </td>

                <!-- 5 -->
                <td v-if="hasLevel40">
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('HP_EVO', shikigami.stats.HP[1])"
                      :alt="getStatRank('HP_EVO', shikigami.stats.HP[1])"
                    />
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 6 -->
                <td v-if="hasLevel40">
                  <div class="flex">
                    {{ shikigami.stats.HP[1] }}

                    <span
                      v-if="shikigami.evolution && shikigami.evolution.no === 4"
                      class="increase-cell"
                    >
                      +{{
                        Math.round(
                          (shikigami.stats.HP[1] * shikigami.evolution.count) / 100
                        )
                      }}
                    </span>
                  </div>
                </td>
                <td v-else></td>

                <!-- 7  -->
                <td v-if="hasLevel40">
                  <div class="bonus-stat">
                    +{{
                      Math.round(
                        shikigami.stats.HP[1] *
                          (1 +
                            (shikigami.evolution && shikigami.evolution.no === 4
                              ? shikigami.evolution.count / 100
                              : 0))
                      ) - shikigami.stats.HP[0]
                    }}
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 8 -->
                <td class="right-border"></td>
              </tr>

              <!-- === DEF === -->
              <tr class="stats-row">
                <!-- 1 -->
                <td></td>

                <!-- 2 -->
                <td class="label-cell">
                  <img src="/assets/stats/DEF.webp" alt="DEF" />
                  DEF
                </td>

                <!-- 3 -->
                <td>
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('DEF', shikigami.stats.DEF[0])"
                      :alt="getStatRank('DEF', shikigami.stats.DEF[0])"
                    />
                  </div>
                </td>

                <!-- 4 -->
                <td>
                  {{ shikigami.stats.DEF[0] }}
                </td>

                <!-- 5 -->
                <td v-if="hasLevel40">
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('DEF_EVO', shikigami.stats.DEF[1])"
                      :alt="getStatRank('DEF_EVO', shikigami.stats.DEF[1])"
                    />
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 6 -->
                <td v-if="hasLevel40">
                  {{ shikigami.stats.DEF[1] }}
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 7 -->
                <td v-if="hasLevel40">
                  <div class="bonus-stat">
                    +{{
                      Math.round(
                        shikigami.stats.DEF[1] *
                          (1 +
                            (shikigami.evolution && shikigami.evolution.no === 12
                              ? shikigami.evolution.count / 100
                              : 0))
                      ) - shikigami.stats.DEF[0]
                    }}
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 8 -->
                <td class="right-border"></td>
              </tr>

              <!-- === SPD === -->
              <tr class="stats-row">
                <!-- 1 -->
                <td></td>

                <!-- 2 -->
                <td class="label-cell">
                  <img src="/assets/stats/SPD.webp" alt="SPD" />
                  SPD
                </td>

                <!-- 3 -->
                <td>
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('SPD', shikigami.stats.SPD[0])"
                      :alt="getStatRank('SPD', shikigami.stats.SPD[0])"
                    />
                  </div>
                </td>

                <!-- 4 -->
                <td>
                  {{ shikigami.stats.SPD[0] }}
                </td>

                <td v-if="hasLevel40">
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('SPD_EVO', shikigami.stats.SPD[1])"
                      :alt="getStatRank('SPD_EVO', shikigami.stats.SPD[1])"
                    />
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 5 -->
                <td v-if="hasLevel40">
                  <div class="flex">
                    {{ shikigami.stats.SPD[1] }}

                    <span
                      v-if="shikigami.evolution && shikigami.evolution.no === 7"
                      class="increase-cell"
                    >
                      +{{ shikigami.evolution.count }}
                    </span>
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 6 -->
                <td v-if="hasLevel40">
                  <div class="bonus-stat">
                    +{{
                      (shikigami.evolution && shikigami.evolution.no === 7
                        ? shikigami.stats.SPD[1] + shikigami.evolution.count
                        : shikigami.stats.SPD[1]) - shikigami.stats.SPD[0]
                    }}
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 7 -->
                <td class="right-border"></td>
              </tr>

              <!-- === CRIT === -->
              <tr class="stats-row">
                <!-- 1 -->
                <td></td>

                <!-- 2 -->
                <td class="label-cell">
                  <img src="/assets/stats/CRIT.webp" alt="CRIT" />
                  Crit
                </td>

                <!-- 3 -->
                <td>
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('CRIT', shikigami.stats.Crit[0])"
                      :alt="getStatRank('CRIT', shikigami.stats.Crit[0])"
                    />
                  </div>
                </td>

                <!-- 4 -->
                <td>{{ shikigami.stats.Crit[0] }}%</td>

                <!-- 5 -->
                <td v-if="hasLevel40">
                  <div class="rank-cell">
                    <img
                      :src="getStatRankImage('CRIT', shikigami.stats.Crit[1])"
                      :alt="getStatRank('CRIT', shikigami.stats.Crit[1])"
                    />
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 6 -->
                <td v-if="hasLevel40">{{ shikigami.stats.Crit[1] }}%</td>
                <td v-else class="empty-cell"></td>

                <!-- 7 -->
                <td v-if="hasLevel40">
                  <div class="bonus-stat">
                    +{{
                      (shikigami.evolution && shikigami.evolution.no === 6
                        ? shikigami.stats.Crit[1] + shikigami.evolution.count
                        : shikigami.stats.Crit[1]) - shikigami.stats.Crit[0]
                    }}%
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 8 -->
                <td class="right-border"></td>
              </tr>

              <!-- === CDMG === -->
              <tr class="stats-row">
                <!-- 1 -->
                <td></td>

                <!-- 2 -->
                <td class="label-cell">
                  <img src="/assets/stats/CDMG.webp" alt="CDMG" />
                  Crit DMG
                </td>

                <!-- 3 -->
                <td></td>

                <!-- 4 -->
                <td>
                  {{ shikigami.stats.CritDMG ? shikigami.stats.CritDMG[0] : "150" }}%
                </td>

                <!-- 5 -->
                <td></td>

                <!-- 6 -->
                <td v-if="hasLevel40">
                  {{ shikigami.stats.CritDMG ? shikigami.stats.CritDMG[1] : "150" }}%
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 7 -->
                <td v-if="hasLevel40">
                  <div class="bonus-stat">
                    +{{
                      shikigami.stats.CritDMG
                        ? shikigami.stats.CritDMG[1] - shikigami.stats.CritDMG[0]
                        : "0"
                    }}%
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <!-- 8 -->
                <td class="right-border"></td>
              </tr>

              <!-- === HIT === -->
              <tr class="stats-row">
                <td></td>

                <td class="label-cell">
                  <img src="/assets/stats/HIT.webp" alt="HIT" />
                  Effects HIT
                </td>

                <td></td>

                <td>
                  {{ shikigami.stats.EffectHIT ? shikigami.stats.EffectHIT[0] : "0" }}%
                </td>

                <td></td>

                <td v-if="hasLevel40">
                  {{
                    (shikigami.stats.EffectHIT ? shikigami.stats.EffectHIT[1] : 0) +
                    (shikigami.evolution && shikigami.evolution.no === 9
                      ? shikigami.evolution.count
                      : 0)
                  }}%
                </td>
                <td v-else class="empty-cell"></td>

                <td v-if="hasLevel40">
                  <div class="bonus-stat">
                    +{{
                      (shikigami.stats.EffectHIT
                        ? shikigami.stats.EffectHIT[1] - shikigami.stats.EffectHIT[0]
                        : 0) +
                      (shikigami.evolution && shikigami.evolution.no === 9
                        ? shikigami.evolution.count
                        : 0)
                    }}%
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <td class="right-border"></td>
              </tr>

              <!-- === RES === -->
              <tr class="stats-row">
                <td></td>

                <td class="label-cell">
                  <img src="/assets/stats/RES.webp" alt="RES" />
                  Effects RES
                </td>

                <td></td>

                <td>
                  {{ shikigami.stats.EffectRES ? shikigami.stats.EffectRES[0] : "0" }}%
                </td>

                <td></td>

                <td v-if="hasLevel40">
                  {{
                    (shikigami.stats.EffectRES ? shikigami.stats.EffectRES[1] : 0) +
                    (shikigami.evolution && shikigami.evolution.no === 10
                      ? shikigami.evolution.count
                      : 0)
                  }}%
                </td>
                <td v-else class="empty-cell"></td>

                <td v-if="hasLevel40">
                  <div class="bonus-stat">
                    +{{
                      (shikigami.stats.EffectRES
                        ? shikigami.stats.EffectRES[1] - shikigami.stats.EffectRES[0]
                        : 0) +
                      (shikigami.evolution && shikigami.evolution.no === 10
                        ? shikigami.evolution.count
                        : 0)
                    }}%
                  </div>
                </td>
                <td v-else class="empty-cell"></td>

                <td class="right-border"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Skills -->
        <h2 class="session-title">
          {{ isEnglish ? "Skills" : "Kĩ năng" }}
        </h2>
        <div class="tabs mb-5">
          <button
            v-for="(skill, index) in shikigami.skills.slice(0, 3)"
            :key="index"
            @click="changeSkill(index)"
            :class="[
              'tab-skill-button px-4 py-2',
              { active: activeSkillIndex === index },
            ]"
          >
            <template v-if="index === 1 && shikigami.skills[3]?.tab === 2">
              {{
                shikigami.skills[1].type !== shikigami.skills[3].type
                  ? `${
                      shikigami.skills[1].type === shikigami.skills[2].type
                        ? "Special 1"
                        : shikigami.skills[1].type
                    } / ${
                      shikigami.skills[3].type === shikigami.skills[2].type
                        ? "Special 1"
                        : shikigami.skills[3].type
                    }`
                  : shikigami.skills[1].type === shikigami.skills[2].type
                  ? "Special 1"
                  : shikigami.skills[1].type
              }}
            </template>
            <template v-else-if="index === 2 && shikigami.skills[3]?.tab === 2">
              {{
                shikigami.skills[1].type !== shikigami.skills[3].type
                  ? "Special 2"
                  : shikigami.skills[2].type === shikigami.skills[1].type
                  ? "Special 2"
                  : shikigami.skills[2].type
              }}
            </template>
            <template v-else-if="shikigami.skills[1]?.type === shikigami.skills[2]?.type">
              {{ skill.type + (index === 1 ? " 1" : index === 2 ? " 2" : "") }}
            </template>
            <template v-else>
              {{ skill.type }}
            </template>
          </button>
          <button
            v-if="!['SP', 'UR', 'N'].includes(shikigami.rarity) && shikigami.id !== 193"
            @click="changeSkill(3)"
            :class="['tab-skill-button px-4 py-2', { active: activeSkillIndex === 3 }]"
          >
            Evolution Effect
          </button>
          <button
            v-if="shikigami.rarity === 'UR'"
            @click="changeSkill(3)"
            :class="['tab-skill-button px-4 py-2', { active: activeSkillIndex === 3 }]"
          >
            Linked
          </button>
        </div>
        <div v-if="activeSkillIndex < 3">
          <div class="skill-section">
            <!-- Skill icon + title -->
            <div class="skill-top">
              <span class="skill-icon-wrapper">
                <img
                  :src="`/assets/shikigami/skills/${route.params.name}_Skill${
                    activeSkillIndex + 1
                  }.webp`"
                  :alt="shikigami.skills[activeSkillIndex].name.en"
                  :title="shikigami.skills[activeSkillIndex].name.en"
                />
              </span>
              <span class="skill-heading">
                <div class="skill-title">
                  <span class="skill-name">
                    {{
                      isEnglish
                        ? shikigami.skills[activeSkillIndex].name.en
                        : shikigami.skills[activeSkillIndex].name.vn
                    }}
                  </span>
                  <span class="skill-sub-name">
                    ({{
                      shikigami.skills[activeSkillIndex].name.cn ===
                      shikigami.skills[activeSkillIndex].name.jp
                        ? shikigami.skills[activeSkillIndex].name.cn
                        : shikigami.skills[activeSkillIndex].name.cn +
                          " / " +
                          shikigami.skills[activeSkillIndex].name.jp
                    }})
                  </span>
                  <button
                    class="skill-edit-btn"
                    @click="editSkill(shikigami.skills[activeSkillIndex])"
                  >
                    <i class="fas fa-edit"></i>
                    <!-- dùng font-awesome -->
                  </button>
                </div>
              </span>
            </div>

            <!-- Skill description -->
            <div class="skill-content">
              <div class="skill-header">
                <div class="skill-badges">
                  <div
                    v-for="tagId in shikigami.skills[activeSkillIndex].tags"
                    :key="tagId"
                    class="skill-badge"
                  >
                    <div
                      class="skill-badge-bg tint-base"
                      :class="'tint-' + (tagMap?.[tagId]?.color || 'grey')"
                    ></div>

                    <span class="skill-badge-text">
                      {{ tagMap?.[tagId]?.name }}
                    </span>
                  </div>
                </div>
                <div class="skill-info">
                  <span v-if="shikigami.skills[activeSkillIndex].cooldown !== 0">
                    <b>CD:</b>
                    {{ shikigami.skills[activeSkillIndex].cooldown }}
                  </span>
                  <span>
                    {{ shikigami.skills[activeSkillIndex].onibi }}
                    <img src="/assets/Onibi.webp" alt="Onibi" />
                  </span>
                </div>
              </div>
              <hr class="skill-divider" />

              <div
                class="skill-voice-wrapper"
                v-if="shikigami.skills[activeSkillIndex].voice"
              >
                <p class="skill-voice">
                  "{{ shikigami.skills[activeSkillIndex].voice }}"
                </p>
              </div>
              <p
                class="skill-description"
                v-html="
                  processHighlightText(
                    isEnglish
                      ? shikigami.skills[activeSkillIndex].description.en
                      : shikigami.skills[activeSkillIndex].description.vn
                  )
                "
              ></p>

              <div
                class="skill-effect-cards"
                v-if="
                  extractEffectCards(
                    getAllSkillEffectText(shikigami.skills[activeSkillIndex])
                  )
                "
              >
                <div
                  v-for="effect in extractEffectCards(
                    getAllSkillEffectText(shikigami.skills[activeSkillIndex])
                  )"
                  :key="effect.id"
                  class="effect-card"
                >
                  <div class="effect-card-title" :class="'title-color-' + effect.color">
                    {{ isEnglish ? effect.name?.en : effect.name?.vn }}

                    <span class="lang-zh"> ({{ effect.name?.cn }}) </span>
                  </div>

                  <div v-if="effect.images?.length">
                    <img
                      v-for="(img, i) in effect.images"
                      :key="i"
                      :src="'/assets/effects/' + img + '.webp'"
                      :alt="img"
                      class="tooltip-img rounded rounded-sm"
                    />
                  </div>

                  <div class="effect-tags" v-if="getParsedEffect(effect).tags.length">
                    <span
                      v-for="tag in getParsedEffect(effect).tags"
                      :key="tag"
                      class="effect-tag"
                      :class="'tag-' + effectTagType(tag)"
                    >
                      {{ tag }}
                    </span>
                  </div>

                  <div
                    class="effect-card-desc"
                    v-html="processHighlightText(getParsedEffect(effect).description)"
                  ></div>
                </div>
              </div>

              <div v-if="shikigami.id === 107 && activeSkillIndex === 0">
                <hr class="skill-divider" />

                <b class="sub-skill-title" @click="activeSkillIndex = 1">
                  {{
                    isEnglish ? shikigami.skills[1].name.en : shikigami.skills[1].name.vn
                  }}
                </b>

                <div class="sub-skill-grid">
                  <div v-for="i in [4, 5, 6, 7]" :key="i" class="sub-skill-item">
                    <img
                      :src="`/assets/shikigami/skills/${route.params.name}_SubSkill${
                        i - 3
                      }.webp`"
                    />

                    <span class="sub-skill-name" @click="activeSkillIndex = 1">
                      {{
                        isEnglish
                          ? shikigami.skills[i - 1].name.en.split(" ")[0]
                          : shikigami.skills[i - 1].name.vn
                              .split(" ")
                              .slice(0, 2)
                              .join(" ")
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="shikigami.id === 107 && activeSkillIndex === 2">
                <hr class="skill-divider" />

                <b class="sub-skill-title" @click="activeSkillIndex = 1">
                  {{
                    isEnglish ? shikigami.skills[1].name.en : shikigami.skills[1].name.vn
                  }}
                </b>

                <div class="sub-skill-grid">
                  <div v-for="i in [4, 5, 6, 7]" :key="i" class="sub-skill-item">
                    <img
                      :src="`/assets/shikigami/skills/${route.params.name}_SubSkill${
                        i + 1
                      }.webp`"
                    />

                    <span class="sub-skill-name" @click="activeSkillIndex = 1">
                      {{
                        isEnglish
                          ? shikigami.skills[i - 1].name.en.split(" ")[0]
                          : shikigami.skills[i - 1].name.vn
                              .split(" ")
                              .slice(0, 2)
                              .join(" ")
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="shikigami.id === 132 && activeSkillIndex === 2">
                <hr class="skill-divider" />

                <b class="sub-skill-title" @click="activeSkillIndex = 1">
                  {{
                    isEnglish ? shikigami.skills[1].name.en : shikigami.skills[1].name.vn
                  }}
                </b>

                <div class="sub-skill-grid">
                  <div v-for="i in [4, 5, 6, 7]" :key="i" class="sub-skill-item">
                    <img
                      :src="`/assets/shikigami/skills/${route.params.name}_SubSkill${
                        i - 3
                      }.webp`"
                    />

                    <span class="sub-skill-name" @click="activeSkillIndex = 1">
                      {{
                        isEnglish
                          ? shikigami.skills[i - 1].name.en
                          : shikigami.skills[i - 1].name.vn
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="shikigami.id === 141 && activeSkillIndex === 1">
                <hr class="skill-divider" />

                <b class="text-black mb-3 block cursor-pointer hover:text-[#a51919]">
                  {{ isEnglish ? "Knots" : "Duyên Kết" }}
                </b>

                <div class="sub-skill-grid">
                  <div v-for="i in [1, 2, 3, 4]" :key="i" class="sub-skill-item">
                    <img
                      :src="`/assets/shikigami/skills/${route.params.name}_Knot${i}.webp`"
                    />

                    <span class="sub-skill-name">
                      {{ isEnglish ? "Type " + i : "Loại " + i }}
                    </span>
                  </div>
                </div>
              </div>

              <hr class="skill-divider" />
              <table
                class="skill-level-table"
                v-if="
                  Array.isArray(
                    isEnglish
                      ? shikigami.skills[activeSkillIndex].levels.en
                      : shikigami.skills[activeSkillIndex].levels.vn
                  )
                "
              >
                <tbody>
                  <tr>
                    <th class="level-column">
                      {{ isEnglish ? "Level" : "Cấp" }}
                    </th>
                    <th>
                      {{ isEnglish ? "Effect" : "Hiệu ứng" }}
                    </th>
                  </tr>
                  <tr
                    v-for="lvl in isEnglish
                      ? shikigami.skills[activeSkillIndex].levels.en
                      : shikigami.skills[activeSkillIndex].levels.vn"
                    :key="lvl.level"
                  >
                    <td class="level-cell">{{ lvl.level }}</td>
                    <td
                      class="effect-cell"
                      v-html="processHighlightText(lvl.effect)"
                    ></td>
                  </tr>
                </tbody>
              </table>
              <div v-else>
                <p
                  class="no-level"
                  v-html="
                    processHighlightText(
                      isEnglish
                        ? shikigami.skills[activeSkillIndex].levels.en
                        : shikigami.skills[activeSkillIndex].levels.vn
                    )
                  "
                ></p>
              </div>
            </div>
          </div>

          <div
            v-for="({ skill, i }, index) in shikigami.skills
              .map((s, i) => ({ skill: s, i }))
              .filter(({ skill, i }) => i >= 3 && skill?.tab === activeSkillIndex + 1)"
            :key="'extra-' + i"
            class="skill-section"
          >
            <!-- Skill icon + title -->
            <div class="skill-top">
              <span class="skill-icon-wrapper">
                <img
                  :src="`/assets/shikigami/skills/${route.params.name}_Skill${
                    i + 1
                  }.webp`"
                  :alt="skill.name.en"
                  :title="skill.name.en"
                />
              </span>
              <span class="skill-heading">
                <div class="skill-title">
                  <span class="skill-name">
                    {{ isEnglish ? skill.name.en : skill.name.vn }}
                  </span>
                  <span class="skill-sub-name">
                    ({{
                      skill.name.cn === skill.name.jp
                        ? skill.name.cn
                        : skill.name.cn + " / " + skill.name.jp
                    }})
                  </span>
                  <button class="skill-edit-btn" @click="editSkill(skill)">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </span>
            </div>

            <!-- Skill description -->
            <div class="skill-content">
              <div class="skill-header">
                <div class="skill-badges">
                  <div v-for="tagId in skill.tags" :key="tagId" class="skill-badge">
                    <div
                      class="skill-badge-bg tint-base"
                      :class="'tint-' + (tagMap?.[tagId]?.color || 'grey')"
                    ></div>

                    <span class="skill-badge-text">
                      {{ tagMap?.[tagId]?.name }}
                    </span>
                  </div>
                </div>
                <div class="skill-info">
                  <span v-if="shikigami.skills[activeSkillIndex].cooldown !== 0">
                    <b>CD:</b>
                    {{ skill.cooldown }}
                  </span>
                  <span>
                    {{ skill.onibi }}
                    <img src="/assets/Onibi.webp" alt="Onibi" />
                  </span>
                </div>
              </div>
              <hr class="skill-divider" />

              <div class="skill-voice-wrapper" v-if="skill.voice">
                <p class="skill-voice">"{{ skill?.voice }}"</p>
              </div>
              <p
                class="skill-description"
                v-html="
                  processHighlightText(
                    isEnglish ? skill.description.en : skill.description.vn
                  )
                "
              ></p>
              <div v-if="shikigami.id === 132 && activeSkillIndex === 2">
                <hr class="skill-divider" />

                <b class="sub-skill-title" @click="activeSkillIndex = 1">
                  {{
                    isEnglish ? shikigami.skills[1].name.en : shikigami.skills[1].name.vn
                  }}
                </b>

                <div class="sub-skill-grid">
                  <div v-for="i in [4, 5, 6, 7]" :key="i" class="sub-skill-item">
                    <img
                      :src="`/assets/shikigami/skills/${route.params.name}_SubSkill${
                        i + 1
                      }.webp`"
                    />

                    <span class="sub-skill-name" @click="activeSkillIndex = 1">
                      {{
                        isEnglish
                          ? shikigami.skills[i - 1].name.en
                          : shikigami.skills[i - 1].name.vn
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <hr class="skill-divider" />
              <table
                class="skill-level-table"
                v-if="Array.isArray(isEnglish ? skill.levels.en : skill.levels.vn)"
              >
                <tbody>
                  <tr>
                    <th class="level-column">
                      {{ isEnglish ? "Level" : "Cấp" }}
                    </th>
                    <th>
                      {{ isEnglish ? "Effect" : "Hiệu ứng" }}
                    </th>
                  </tr>
                  <tr
                    v-for="lvl in isEnglish ? skill.levels.en : skill.levels.vn"
                    :key="lvl.level"
                  >
                    <td class="level-cell">{{ lvl.level }}</td>
                    <td
                      class="effect-cell"
                      v-html="processHighlightText(lvl.effect)"
                    ></td>
                  </tr>
                </tbody>
              </table>
              <div v-else>
                <p
                  class="no-level"
                  v-html="
                    processHighlightText(isEnglish ? skill.levels.en : skill.levels.vn)
                  "
                ></p>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div v-if="shikigami.rarity === 'UR'">
            <div class="skill-section">
              <!-- Skill icon + title -->
              <div class="skill-top">
                <span class="skill-icon-wrapper">
                  <img
                    :src="`/assets/shikigami/skills/${route.params.name}_Skill0.webp`"
                    :alt="shikigami.skills.find((s) => s.type === 'Linked').name.en"
                    :title="shikigami.skills.find((s) => s.type === 'Linked').name.en"
                  />
                </span>
                <span class="skill-heading">
                  <div class="skill-title">
                    <span class="skill-name">
                      {{
                        isEnglish
                          ? shikigami.skills.find((s) => s.type === "Linked").name.en
                          : shikigami.skills.find((s) => s.type === "Linked").name.vn
                      }}
                    </span>
                    <span class="skill-sub-name">
                      ({{
                        shikigami.skills.find((s) => s.type === "Linked").name.cn ===
                        shikigami.skills.find((s) => s.type === "Linked").name.jp
                          ? shikigami.skills.find((s) => s.type === "Linked").name.cn
                          : shikigami.skills.find((s) => s.type === "Linked").name.cn +
                            " / " +
                            shikigami.skills.find((s) => s.type === "Linked").name.jp
                      }})
                    </span>
                    <button
                      class="skill-edit-btn"
                      @click="
                        editSkill(shikigami.skills.find((s) => s.type === 'Linked'))
                      "
                    >
                      <i class="fas fa-edit"></i>
                      <!-- dùng font-awesome -->
                    </button>
                  </div>
                </span>
              </div>

              <!-- Skill description -->
              <div class="skill-content">
                <div class="skill-header">
                  <div class="skill-badges flex flex-wrap gap-2">
                    <div
                      v-for="tagId in shikigami.skills.find((s) => s.type === 'Linked')
                        .tags"
                      :key="tagId"
                      class="skill-badge"
                    >
                      <!-- brush nền -->
                      <div
                        class="skill-badge-bg tint-base"
                        :class="'tint-' + (tagMap?.[tagId]?.color || 'grey')"
                      ></div>

                      <span class="skill-badge-text">
                        {{ tagMap?.[tagId]?.name }}
                      </span>
                    </div>
                  </div>
                  <div class="skill-info">
                    <span v-if="shikigami.skills[activeSkillIndex].cooldown !== 0">
                      <b>CD:</b>
                      {{ shikigami.skills.find((s) => s.type === "Linked").cooldown }}
                    </span>
                    <span>
                      {{ shikigami.skills.find((s) => s.type === "Linked").onibi }}
                      <img src="/assets/Onibi.webp" alt="Onibi" />
                    </span>
                  </div>
                </div>
                <hr class="skill-divider" />

                <div class="skill-voice-wrapper">
                  <p class="skill-voice">
                    "{{ shikigami.skills.find((s) => s.type === "Linked").voice }}"
                  </p>
                </div>
                <p
                  class="skill-description"
                  v-html="
                    processHighlightText(
                      isEnglish
                        ? shikigami.skills.find((s) => s.type === 'Linked').description.en
                        : shikigami.skills.find((s) => s.type === 'Linked').description.vn
                    )
                  "
                ></p>
                <hr class="skill-divider" />
                <div>
                  <p
                    class="no-level"
                    v-html="
                      processHighlightText(
                        isEnglish
                          ? shikigami.skills.find((s) => s.type === 'Linked').notes.en
                          : shikigami.skills.find((s) => s.type === 'Linked').notes.vn
                      )
                    "
                  ></p>
                </div>
                <hr class="skill-divider" />
                <table
                  class="skill-level-table"
                  v-if="
                    Array.isArray(
                      isEnglish
                        ? shikigami.skills.find((s) => s.type === 'Linked').levels.en
                        : shikigami.skills.find((s) => s.type === 'Linked').levels.vn
                    )
                  "
                >
                  <tbody>
                    <tr>
                      <th class="level-column">
                        {{ isEnglish ? "Level" : "Cấp" }}
                      </th>
                      <th>
                        {{ isEnglish ? "Effect" : "Hiệu ứng" }}
                      </th>
                    </tr>
                    <tr
                      v-for="lvl in isEnglish
                        ? shikigami.skills.find((s) => s.type === 'Linked').levels.en
                        : shikigami.skills.find((s) => s.type === 'Linked').levels.vn"
                      :key="lvl.level"
                    >
                      <td class="level-cell">{{ lvl.level }}</td>
                      <td
                        class="effect-cell"
                        v-html="processHighlightText(lvl.effect)"
                      ></td>
                    </tr>
                  </tbody>
                </table>
                <div v-else>
                  <p
                    class="no-level"
                    v-html="
                      processHighlightText(
                        isEnglish
                          ? shikigami.skills.find((s) => s.type === 'Linked').levels.en
                          : shikigami.skills.find((s) => s.type === 'Linked').levels.vn
                      )
                    "
                  ></p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="evolution-box">
            <p class="evolution-text" v-html="renderEvoText(shikigami.evolution)"></p>
          </div>
        </div>

        <!-- Biography Unlock -->
        <h2 class="session-title" v-if="shikigami.id !== 193">
          {{ isEnglish ? "Biography Unlock" : "Mở khoá Tiểu sử" }}
        </h2>
        <table class="bio-table" v-if="shikigami.id !== 193">
          <thead>
            <tr>
              <th class="table-title no-column">No.</th>
              <th class="table-title">
                {{ isEnglish ? "Unlock Conditions" : "Điều kiện mở khóa" }}
              </th>
              <th class="table-title reward-column">
                {{ isEnglish ? "Rewards" : "Phần thưởng" }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="table-cell bio-number">1</td>

              <td class="table-cell bio-text">
                <span v-html="renderBioText(shikigami.biography[0])"></span>
              </td>

              <td class="table-cell reward-cell">
                <div class="reward-box">
                  <img
                    :src="
                      ![153, 154].includes(shikigami.id)
                        ? '/assets/Gold.webp'
                        : `/assets/shikigami/skinsInfo/${route.params.name}_SkinInfo1.webp`
                    "
                    alt="Gold"
                    class="reward-icon"
                  />
                  <span class="reward-amount">
                    {{ ![153, 154].includes(shikigami.id) ? 5000 : "" }}</span
                  >
                </div>
              </td>
            </tr>

            <tr>
              <td class="table-cell bio-number">2</td>
              <td class="table-cell bio-text">
                <span v-html="renderBioText(shikigami.biography[1])"></span>
              </td>

              <td v-if="shikigami.id === 78" class="table-cell reward-cell">
                <div class="reward-box">
                  <img src="/assets/Gold.webp" alt="Gold" class="reward-icon" />
                  <span class="reward-amount"> 5000</span>
                </div>
              </td>

              <td v-else class="table-cell reward-cell">
                <div class="reward-box">
                  <img
                    :src="
                      [144, 118, 131, 95].includes(shikigami.id)
                        ? '/assets/Jade.webp'
                        : [71, 84, 130, 117, 111].includes(shikigami.id)
                        ? '/assets/Black_Daruma.webp'
                        : `/assets/shikigami/shards/${route.params.name}_Shard.webp`
                    "
                    :alt="shikigami.name.jp"
                    class="reward-icon"
                  />
                  <span class="reward-amount">{{
                    shikigami.id >= 201 && shikigami.id <= 214
                      ? 2
                      : [71, 84, 130, 117, 111].includes(shikigami.id)
                      ? ""
                      : 10
                  }}</span>
                </div>
              </td>
            </tr>

            <tr>
              <td class="table-cell bio-number">3</td>
              <td class="table-cell bio-text px-3">
                <span v-html="renderBioText(shikigami.biography[2])"></span>
              </td>

              <td class="table-cell reward-cell">
                <div class="reward-box">
                  <img
                    :src="
                      ![144, 118, 131, 111].includes(shikigami.id)
                        ? '/assets/Jade.webp'
                        : `/assets/shikigami/shards/${route.params.name}_Shard.webp`
                    "
                    alt="Jade"
                    class="reward-icon"
                  />
                  <span class="reward-amount">10</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 class="session-title" v-if="shikigami.id !== 193">
          {{ isEnglish ? "Soul Choices" : "Ngự Hồn Đề Cử" }}
        </h2>

        <div v-if="shikigami.build?.length" class="build-list">
          <div v-for="build in shikigami.build" :key="build.no" class="build-card">
            <div class="build-header">
              <h3 class="build-title">Build {{ build.no }}</h3>

              <!-- ROLE BADGES -->
              <div class="build-roles">
                <span
                  v-for="role in parseRoles(build.role)"
                  :key="role"
                  class="build-role-badge"
                  :class="getRoleClass(role)"
                >
                  {{ role }}
                </span>
              </div>
            </div>

            <!-- 2 / 4 / 6 stats -->
            <div class="build-main-stats">
              <span
                v-for="(stat, index) in parseStats(build.indicate)"
                :key="index"
                class="build-stat-group"
              >
                <span
                  v-for="s in stat"
                  :key="s"
                  class="build-stat"
                  :class="getStatClass(s)"
                >
                  {{ s }}
                </span>

                <span v-if="index < 2" class="build-divider">/</span>
              </span>
            </div>

            <!-- Souls -->
            <div class="build-souls-grid">
              <router-link
                v-for="id in build.souls"
                :key="id"
                :to="`/souls/${getSoulSlug(id)}`"
                class="build-soul-item"
              >
                <img
                  :src="`/assets/souls/icons/${getSoulSlug(id)}_Icon.webp`"
                  class="build-soul-icon"
                />

                <span class="build-soul-name">
                  {{ getSoulName(id) }}
                </span>
              </router-link>
            </div>

            <!-- Substats -->
            <div v-if="build.substats" class="build-substats">
              <span class="build-label">Substats:</span>

              <template v-for="(item, i) in parseSubstats(build.substats)" :key="i">
                <span
                  v-if="item.type === 'stat'"
                  class="build-stat"
                  :class="getStatClass(item.value)"
                >
                  {{ item.value }}
                </span>

                <span v-else class="build-separator">
                  {{ item.value }}
                </span>
              </template>
            </div>

            <!-- Breakpoint -->
            <div v-if="build.breakpoint" class="build-breakpoint">
              <span class="build-label">Breakpoint:</span>

              <span
                v-for="tag in build.breakpoint.split('|').map((t) => t.trim())"
                :key="tag"
                class="build-breakpoint-tag"
              >
                {{ tag }}
              </span>
            </div>

            <!-- Note -->
            <div v-if="build.note" class="build-note">
              <span class="build-note-text">{{ build.note }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gallery Tab -->
      <div
        v-show="activeTab === 'Gallery'"
        :class="[activeTab === 'Gallery' ? 'opacity-100' : 'opacity-0']"
      >
        <!-- Skins -->
        <h2 class="session-title top-0">
          {{ isEnglish ? "Skins" : "Trang phục" }}
        </h2>
        <div class="skin-gallery">
          <div
            v-for="(skin, index) in shikigami.skins"
            :key="index"
            class="skin-card"
            :title="skin.name.en || skin.name.cn"
            @click="
              openModal(
                skin.name.en === 'Default' || skin.name.en === 'Evolution'
                  ? `/assets/shikigami/images/${route.params.name}${
                      skin.name.en === 'Evolution' ? '_Evo' : ''
                    }.webp`
                  : `/assets/shikigami/skins/${route.params.name}_Skin${
                      shikigami.rarity === 'SP' || shikigami.rarity === 'N'
                        ? index
                          ? index
                          : ''
                        : index - 1
                    }.webp`
              )
            "
          >
            <img
              :src="
                skin.name.en === 'Default' || skin.name.en === 'Evolution'
                  ? `/assets/shikigami/images/${route.params.name}${
                      skin.name.en === 'Evolution' ? '_Evo' : ''
                    }.webp`
                  : `/assets/shikigami/skins/${route.params.name}_Skin${
                      shikigami.rarity === 'SP' || shikigami.rarity === 'N'
                        ? index
                          ? index
                          : ''
                        : index - 1
                    }.webp`
              "
              :alt="skin.name.en || skin.name.cn"
              class="skin-image"
            />
            <p
              class="skin-name"
              :class="
                isEnglish
                  ? !skin.name.en && skin.name.cn
                    ? 'lang-zh'
                    : 'skin-name-en'
                  : 'skin-name-vn'
              "
            >
              {{ isEnglish ? skin.name.en || skin.name.cn : skin.name.vn }}
            </p>
          </div>
        </div>

        <!-- Modal -->
        <div v-if="isModalOpen" class="image-modal">
          <!-- Overlay -->
          <div class="image-modal-overlay" @click="closeModal"></div>

          <!-- Content -->
          <div class="image-modal-content">
            <!-- Close -->
            <button class="image-modal-close" @click="closeModal">✕</button>

            <!-- Image -->
            <img :src="selectedImage" alt="Skin Preview" class="image-modal-preview" />
          </div>
        </div>

        <!-- Skins Info -->
        <h2 class="session-title">
          {{ isEnglish ? "Skins Info" : "Thông tin trang phục" }}
        </h2>
        <table class="skin-info-table">
          <thead>
            <tr>
              <th class="table-title image-column">
                {{ isEnglish ? "Image" : "Ảnh" }}
              </th>
              <th class="table-title">
                {{ isEnglish ? "Name" : "Tên" }}
              </th>
              <th class="table-title">
                {{ isEnglish ? "Artist" : "Họa sĩ" }}
              </th>
              <th class="table-title obtained-column">
                {{ isEnglish ? "Obtained" : "Cách nhận" }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(skin, index) in shikigami.skins || []" :key="index">
              <tr v-if="skin && skin.obtained !== 'Cancelled'" class="skin-info-row">
                <!-- ICON -->
                <td class="table-cell skin-image-cell">
                  <div class="skin-info-image-wrapper">
                    <img
                      :src="
                        skin.name?.en === 'Default'
                          ? (index === 0 && shikigami.id >= 201 && shikigami.id <= 217) ||
                            shikigami.id === 193
                            ? `/assets/shikigami/shards/${route.params.name}_Shard.webp`
                            : `/assets/shikigami/skinsInfo/${route.params.name}_SkinInfo0.webp`
                          : skin.name?.en === 'Evolution'
                          ? `/assets/shikigami/skinsInfo/${route.params.name}_SkinInfo00.webp`
                          : `/assets/shikigami/skinsInfo/${route.params.name}_SkinInfo${
                              shikigami.rarity === 'SP' || shikigami.rarity === 'N'
                                ? index
                                  ? index
                                  : ''
                                : index - 1
                            }.webp`
                      "
                      :alt="skin.name?.en || skin.name?.cn"
                      class="skin-info-image"
                      :class="{
                        'skin-info-scale':
                          (index === 0 && shikigami.id >= 201 && shikigami.id <= 217) ||
                          shikigami.id === 193,
                      }"
                    />
                  </div>
                </td>

                <!-- NAME -->
                <td class="table-cell skin-name-cell">
                  <template
                    v-if="skin.name?.en === 'Default' || skin.name?.en === 'Evolution'"
                  >
                    <div class="skin-main-name">
                      {{ isEnglish ? skin.name?.en : skin.name?.vn }}
                    </div>
                  </template>

                  <template v-else>
                    <div class="skin-main-name">
                      {{ skin.name?.en }}
                    </div>

                    <div class="skin-sub-name">
                      <span class="lang-zh">
                        {{ skin.name?.cn }}
                      </span>

                      -

                      <span class="skin-name-vn">
                        {{ skin.name?.vn }}
                      </span>
                    </div>
                  </template>
                </td>

                <!-- ARTIST -->
                <td class="table-cell skin-artist-cell">
                  <span class="lang-zh">
                    {{ skin.artist }}
                  </span>
                </td>

                <!-- OBTAINED -->
                <td class="table-cell skin-obtained-cell">
                  {{ skin.obtained }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Biography Accessories -->
        <h2
          v-if="shikigami.accessories && shikigami.accessories.length"
          class="session-title"
        >
          {{ isEnglish ? "Biography Accessories" : "Phụ kiện Tiểu sử" }}
        </h2>
        <table
          v-if="shikigami.accessories && shikigami.accessories.length"
          class="bio-accessory-table"
        >
          <thead>
            <tr>
              <th class="table-title bio-no-column">
                Bio<br />
                No.
              </th>

              <th class="table-title accessory-image-column">
                {{ isEnglish ? "Image" : "Ảnh" }}
              </th>

              <th class="table-title">
                {{ isEnglish ? "Name" : "Tên" }}
              </th>

              <th class="table-title accessory-type-column">
                {{ isEnglish ? "Type" : "Loại" }}
              </th>

              <th class="table-title">
                {{ isEnglish ? "Obtained" : "Cách nhận" }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(bio, index) in shikigami.accessories"
              :key="index"
              class="bio-accessory-row"
            >
              <!-- No -->
              <td class="table-cell bio-no-cell">
                {{ index + 4 }}
              </td>

              <!-- Image -->
              <td class="table-cell accessory-image-cell">
                <div class="accessory-image-wrapper">
                  <img
                    :src="`/assets/shikigami/bios/${route.params.name}_Bio${
                      index + 4
                    }.webp`"
                    :alt="bio.name.en || bio.name.cn"
                    class="accessory-image"
                  />
                </div>
              </td>

              <!-- Name -->
              <td class="table-cell accessory-name-cell">
                <div class="accessory-main-name">
                  {{ bio.name.en }}
                </div>

                <div class="accessory-sub-name">
                  <span class="lang-zh">
                    {{ bio.name.cn }}
                  </span>

                  -

                  <span class="lang-vi">
                    {{ bio.name.vn }}
                  </span>
                </div>
              </td>

              <!-- Type -->
              <td class="table-cell accessory-type-cell">
                {{ bio.type }}
              </td>

              <!-- Obtained -->
              <td
                class="table-cell accessory-obtained-cell"
                v-html="highlightSkin(bio.obtained)"
              ></td>
            </tr>
          </tbody>
        </table>

        <!-- Illustrations -->
        <h2 class="session-title">
          {{ isEnglish ? "Illustrations" : "Hoạ Ảnh" }}
        </h2>
        <div class="illustration-gallery">
          <div
            v-for="(img, index) in illustrations"
            :key="index"
            class="illustration-card"
          >
            <img
              :src="getImgUrl(img.name)"
              :alt="img.name"
              :title="img.name"
              class="illustration-image"
              @click="openModal(getImgUrl(img.name))"
            />

            <div
              v-if="!/^No[ _]Name/i.test(img.name)"
              class="illustration-label"
              :class="/[\u4E00-\u9FFF]/.test(img.name) ? 'lang-zh' : 'skin-name-en'"
            >
              {{ img.name.replace(/[_ ]\d+$/, "").replace(/_/g, " ") }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-if="showTooltip && tooltipData"
      class="tooltip"
      :style="{
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px',
        borderColor: tooltipData.color,
        boxShadow: '0 0 12px ' + tooltipData.color,
        '--tooltip-color': tooltipData.color,
      }"
    >
      <!-- Note chính -->
      <div class="tooltip-title" :style="{ color: tooltipData.color }">
        {{ tooltipData.name }}
        <span class="lang-zh" v-if="tooltipData.cn">({{ tooltipData.cn }})</span>
      </div>
      <div v-if="imgs.length" class="tooltip-images pb-1">
        <img
          v-for="(img, i) in imgs"
          :key="i"
          :src="'/assets/effects/' + img + '.webp'"
          :alt="img"
          class="tooltip-img rounded rounded-sm"
        />
      </div>

      <div
        class="tooltip-description whitespace-pre-line"
        v-html="processHighlightText(tooltipData.description)"
      ></div>

      <!-- Nếu có subNotes match -->
      <div v-if="matchedSubNotes.length">
        <hr class="tooltip-divider" />
        <div class="subnotes-container">
          <div v-for="sub in matchedSubNotes" :key="sub.id" class="subnote-block">
            <div class="subnote-title">
              {{ isEnglish ? sub.name.en : sub.name.vn }}
              <span class="lang-zh" v-if="sub.name.cn">({{ sub.name.cn }})</span>
            </div>
            <div v-if="sub.images" class="tooltip-images flex gap-2 mb-2">
              <img
                v-for="(img, i) in sub.images"
                :key="i"
                :src="'/assets/effects/' + img + '.webp'"
                :alt="img"
                class="w-8 h-8"
              />
            </div>
            <div
              class="subnote-description"
              v-html="
                processHighlightText(isEnglish ? sub.description.en : sub.description.vn)
              "
            ></div>

            <!-- Sub-SubNotes -->
            <div v-if="sub.subNotes && sub.subNotes.length" class="mt-2">
              <div v-for="subsub in sub.subNotes" :key="subsub.id" class="subnote-block">
                <div class="subnote-title">
                  {{ isEnglish ? subsub.name.en : subsub.name.vn }}
                  <span class="lang-zh">({{ subsub.name.cn }})</span>
                </div>

                <div v-if="subsub.images" class="tooltip-images flex gap-2 mb-2">
                  <img
                    v-for="(img, i) in subsub.images"
                    :key="i"
                    :src="'/assets/effects/' + img + '.webp'"
                    :alt="img"
                    class="w-8 h-8"
                  />
                </div>

                <div
                  class="subnote-description"
                  v-html="
                    processHighlightText(
                      isEnglish ? subsub.description.en : subsub.description.vn
                    )
                  "
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    >
      <div
        class="bg-white rounded-2xl p-6 w-[800px] max-h-[90vh] shadow-xl flex flex-col"
      >
        <h2 class="text-xl font-bold mb-4 text-[#a51919]">Edit Skill</h2>
        <div div class="overflow-y-auto flex-1">
          <h3 class="text-md font-bold text-black">Skill Names</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-black">EN</label>
              <input
                v-model="editingSkill.name.en"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-black">VN</label>
              <input
                v-model="editingSkill.name.vn"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-black">CN</label>
              <input
                v-model="editingSkill.name.cn"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-black">JP</label>
              <input
                v-model="editingSkill.name.jp"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
              />
            </div>
          </div>

          <h3 class="text-md font-bold mt-5 text-black">Skill Info</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-black">Type</label>
              <input
                v-model="editingSkill.type"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-black">Onibi</label>
              <input
                v-model="editingSkill.onibi"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-black">Cooldown</label>
              <input
                v-model="editingSkill.cooldown"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div>
              <h3 class="text-md font-bold mt-5 text-black">Skill Tags</h3>
              <div class="gap-4">
                <input
                  v-model="tagsInput"
                  @input="updateTags"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
                />
              </div>
            </div>
          </div>

          <h3 class="text-md font-bold mt-5 text-black">Skill Voice</h3>
          <div class="gap-4">
            <input
              v-model="editingSkill.voice"
              class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
            />
          </div>

          <h3 class="text-md font-bold mt-5 text-black">Skill Description</h3>
          <div class="gap-4">
            <div>
              <label class="block text-sm font-medium text-black">EN</label>
              <textarea
                v-model="editingSkill.description.en"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 py-1"
                rows="4"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-black mt-2">VN</label>
              <textarea
                v-model="editingSkill.description.vn"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2 pt-1"
                rows="4"
              ></textarea>
            </div>
          </div>

          <h3 class="text-md font-bold mt-5 text-black">Skill Levels</h3>
          <div
            class="gap-4 grid grid-cols-2"
            v-if="Array.isArray(editingSkill.levels.en)"
          >
            <div class="gap-1 grid grid-cols-1">
              <div v-for="(lvl, index) in editingSkill.levels.en" :key="index">
                <label class="block text-sm font-medium mb-1 text-black"
                  >Level {{ lvl.level }}</label
                >
                <textarea
                  v-model="lvl.effect"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2"
                ></textarea>
              </div>
            </div>

            <div class="gap-1 grid grid-cols-1">
              <div v-for="(lvl, index) in editingSkill.levels.vn" :key="index">
                <label class="block text-sm font-medium mb-1 text-black"
                  >Level {{ lvl.level }}</label
                >
                <textarea
                  v-model="lvl.effect"
                  class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2"
                ></textarea>
              </div>
            </div>
          </div>
          <div v-else class="gap-4 grid grid-cols-2">
            <div>
              <textarea
                v-model="editingSkill.levels.en"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2"
              ></textarea>
            </div>
            <div>
              <textarea
                v-model="editingSkill.levels.vn"
                class="w-full border border-[#a3a3a3] rounded text-[#aaa] px-2"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="rank-cell gap-2 mt-5">
          <button
            class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 rounded-md text-black cursor-pointer"
            @click="closeEditModal"
          >
            Cancel
          </button>
          <button
            class="px-3 py-1 rounded bg-[#a51919] text-white hover:bg-[#891727] rounded-md cursor-pointer"
            @click="saveSkill"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/pages/styles.css"></style>
<style scoped src="@/pages/main.css"></style>
<style scoped src="@/pages/gallery.css"></style>

<style scoped>
/* =========================
  Profile 
========================= */
.profile-section {
  margin-top: 8px;

  white-space: pre-line;
  text-align: justify;
}

/* ========================= 
  Table Name 
========================= */
.table-row a {
  font-family: "Bona Nova SC", serif;
  font-size: 15px;
  margin-top: 4px;
}

.table-title-row {
  font-size: 15px;
}

.table-cell {
  border: 1px solid #a51919;
}

/* ========================= 
  Stats 
========================= */
.stats-wrapper {
  display: block;
}

.stats-table {
  width: 100%;

  border-bottom: 1px solid #a51919;
}

.stats-table td:nth-child(4),
.stats-table td:nth-child(6) {
  width: 100px;
}

.stats-header {
  color: #a51919;
}

.stats-title {
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
  padding-bottom: 8px;
}

.icon-cell {
  position: relative;
}

.stats-figure {
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
}

.stats-icon {
  object-fit: contain;
  width: 90px;
  height: 90px;
  border: 1px solid #a51919;

  padding: 4px;
  background: #121212;
}

.spacing-row {
  height: 40px;
}

.top-border-row {
  border: 1px solid #a51919;
  border-bottom: none;
}

.stats-row {
  border-left: 1px solid #a51919;
}

.label-cell {
  padding: 12px 10px;

  display: flex;
  align-items: center;
  gap: 8px;

  font-weight: 600;
  white-space: nowrap;
  border-bottom: 1px solid #e5e7eb27;
}

.label-cell img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.rank-cell {
  display: flex;
  justify-content: flex-end;
  padding-right: 10px;
}

.rank-cell img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.increase-cell {
  padding-left: 2px;
  text-align: left;
  vertical-align: middle;

  color: #c85a5a;
}

.bonus-stat {
  color: #a51919;
  margin-left: 4px;
}

.empty-cell {
  width: 100px;
}

.right-border {
  border-right: 1px solid #a51919;
}

/* =========================
  Bio 
========================= */
.bio-table {
  width: 100%;
  margin-top: 16px;
  border-spacing: 0;
  outline: 1px solid #a51919;
  overflow: hidden;
}

.bio-table td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

/* Columns */

.no-column {
  width: 50px;
}

.reward-column {
  width: 120px;
}

/* Cells */

.bio-table .table-title {
  padding: 12px;

  background: rgba(165, 25, 25, 0.08);

  color: #a51919;
  font-weight: 700;
  text-align: center;
}

.bio-table .table-cell {
  font-family: "Noto Sans", sans-serif;
  font-size: 15px;
  padding: 4px 12px;
  color: #fff;
  vertical-align: middle;
}

.bio-number {
  text-align: center;
  font-weight: 700;
}

.bio-text {
  line-height: 1.6;
}

.reward-cell {
  text-align: center;
}

/* Reward */

.reward-box {
  position: relative;

  width: 50px;
  height: 50px;

  margin: 0 auto;

  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-icon {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;

  transition: transform 0.25s ease;
}

.reward-amount {
  position: absolute;
  right: -4px;
  bottom: -2px;

  font-size: 13px;
  font-weight: 700;
  color: #fff;

  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}

/* ========================= 
  Soul 
========================= */
.build-list {
  margin-top: 16px;

  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Card */

.build-card {
  padding: 20px;

  border: 1px solid #a51919;
  border-radius: 16px;

  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.03),
    rgba(255, 255, 255, 0.015)
  );

  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);

  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.build-card:hover {
  transform: translateY(-3px);

  border-color: #c93030;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 0 12px rgba(165, 25, 25, 0.12);
}

/* Header */

.build-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  margin-bottom: 14px;
}

.build-title {
  font-family: "Bona Nova SC", serif;
  font-size: 20px;
  font-weight: 700;
  color: #a51919;
}

.build-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.build-role-badge {
  padding: 4px 12px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;

  color: #fff;

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

/* Stats */

.build-main-stats {
  margin-bottom: 18px;
}

.build-stat-group {
  display: inline-block;
  margin-right: 8px;
}

.build-stat {
  display: inline-block;

  margin-right: 6px;
  padding: 5px 10px;

  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);

  font-size: 13px;
  font-weight: 600;
}

.build-divider,
.build-separator {
  color: #888;
  font-size: 13px;
}

/* Souls List */

.build-souls-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));

  gap: 14px;

  margin-bottom: 18px;
}

.build-soul-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  text-align: center;

  text-decoration: none;
}

.build-soul-icon {
  width: 56px;
  height: 56px;

  border-radius: 999px;

  transition: transform 0.22s ease, filter 0.22s ease;
}

.build-soul-item:hover .build-soul-icon {
  transform: scale(1.1);

  filter: drop-shadow(0 0 8px rgba(165, 25, 25, 0.28));
}

.build-soul-name {
  margin-top: 6px;

  font-size: 12px;
  color: #fff;
}

/* Substats / Breakpoint */

.build-substats,
.build-breakpoint {
  margin-bottom: 14px;

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  font-size: 14px;
  color: #fff;
}

.build-label {
  margin-right: 4px;

  font-weight: 700;
}

.build-breakpoint-tag {
  padding: 4px 10px;

  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  background: rgba(255, 255, 255, 0.04);

  font-size: 12px;
}

/* Note */

.build-note {
  padding: 12px 14px;

  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  background: rgba(255, 255, 255, 0.03);
}

.build-note-text {
  font-size: 14px;
  line-height: 1.6;

  color: #bdbdbd;

  white-space: pre-line;
  font-style: italic;
}
</style>
