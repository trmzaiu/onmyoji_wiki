<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { useTags } from "@/utils/useTags";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const supabase = useSupabase();

/* ---------------------- STATE ---------------------- */
const shikigami = ref(null);
const shikigamiList = ref([]);
const onmyojiList = ref(null);
const effects = ref([]);
const isEnglish = ref(true);

const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

const activeTab = ref("main");
const activeSkillIndex = ref(0);

const formattedName = route.params.name.replace(/_/g, " ");

const { tagMap, loadTags } = useTags();

/* ---------------------- RANK + IMAGE ---------------------- */
// S: 140 -> 165, A: 127 -> 133, B: 123 -> 124, C: 102 -> 103, D: 79 -> 98
const getATKRank = (atk) => {
  if (atk >= 140 && atk <= 165) return "S";
  else if (atk >= 127 && atk <= 133) return "A";
  else if (atk >= 123 && atk <= 124) return "B";
  else if (atk >= 102 && atk <= 103) return "C";
  else if (atk >= 79 && atk <= 98) return "D";
  else return "E";
};

const getATKImage = (atk) => {
  const rank = getATKRank(atk);
  return `/assets/stats/${rank}.webp`;
};

// S: 2948 -> 3484, A: 2894 -> 2975, B: ? -> ?, C: 2305 -> 2385, D: 1822 -> ?
const getATKEvoRank = (atk) => {
  if (atk >= 2948 && atk <= 3484) return "S";
  else if (atk >= 2894 && atk <= 2975) return "A";
  else if (atk >= 2386 && atk <= 2386) return "B";
  else if (atk >= 2305 && atk <= 2385) return "C";
  else if (atk >= 1822 && atk <= 1822) return "D";
  else return "E";
};

const getATKEvoImage = (atk) => {
  const rank = getATKEvoRank(atk);
  return `/assets/stats/${rank}.webp`;
};

// S: 1174 -> 1270, A: 1067 -> 1163, B: 960 -> 1056, C: 854 -> 939, D: 843 -> ?
const getHPRank = (hp) => {
  if (hp >= 1174 && hp <= 1270) return "S";
  else if (hp >= 1067 && hp <= 1163) return "A";
  else if (hp >= 960 && hp <= 1056) return "B";
  else if (hp >= 854 && hp <= 939) return "C";
  else if (hp >= 843 && hp <= 843) return "D";
  else return "E";
};

const getHPImage = (hp) => {
  const rank = getHPRank(hp);
  return `/assets/stats/${rank}.webp`;
};

// S: 12646 -> 14241, A: 11393 -> 12532, B: 10254 -> 11279, C: 9684 -> 10026, D: ? -> ?
const getHPEvoRank = (hp) => {
  if (hp >= 12646 && hp <= 14241) return "S";
  else if (hp >= 11393 && hp <= 12532) return "A";
  else if (hp >= 10254 && hp <= 11279) return "B";
  else if (hp >= 9684 && hp <= 10026) return "C";
  else return "D";
};

const getHPEvoImage = (hp) => {
  const rank = getHPEvoRank(hp);
  return `/assets/stats/${rank}.webp`;
};

// S: ? -> ?, A: 75 -> 82, B: 71 -> 73, C: 60 -> 69, D: 58 -> ?
const getDEFRank = (def) => {
  if (def >= 8134 && def <= 8171) return "S";
  else if (def >= 75 && def <= 82) return "A";
  else if (def >= 71 && def <= 73) return "B";
  else if (def >= 60 && def <= 69) return "C";
  else if (def >= 58 && def <= 60) return "D";
  else return "E";
};

const getDEFImage = (def) => {
  const rank = getDEFRank(def);
  return `/assets/stats/${rank}.webp`;
};

// S: 490 -> ?, A: 441 -> 481, B: 397 -> 437, C: 370 -> 388, D: ? -> ?
const getDEFEvoRank = (def) => {
  if (def >= 490 && def <= 490) return "S";
  else if (def >= 441 && def <= 481) return "A";
  else if (def >= 397 && def <= 437) return "B";
  else if (def >= 370 && def <= 388) return "C";
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
  else if (spd >= 90 && spd <= 94) return "D";
  else return "E";
};

const getSPDImage = (spd) => {
  const rank = getSPDRank(spd);
  return `/assets/stats/${rank}.webp`;
};

const getCritRank = (crit) => {
  if (crit >= 12) return "SS";
  else if (crit >= 10 && crit <= 12) return "S";
  else if (crit >= 8 && crit <= 9) return "A";
  else if (crit >= 5 && crit <= 5) return "B";
  else if (crit >= 3 && crit <= 3) return "C";
  else if (crit >= 0 && crit <= 1) return "D";
  else return "E";
};

const getCritImage = (crit) => {
  const rank = getCritRank(crit);
  return `/assets/stats/${rank}.webp`;
};

/* ---------------------- TOOLTIP ---------------------- */
const processTextWithTooltips = (text) => {
  if (!text || !shikigami.value?.skills) return text;

  let processedText = text;
  const effectById = new Map(effects.value.map((e) => [e.id, e]));
  const effectMap = new Map();

  shikigami.value.skills.forEach((skill) => {
    if (!skill.notes) return;

    skill.notes.forEach((id) => {
      const note = effectById.get(id);
      if (!note) return;

      const names = [];
      if (note.name?.en) names.push(note.name.en);
      if (note.name?.vn && note.name.vn !== note.name.en) names.push(note.name.vn);

      names.forEach((name) => {
        if (!effectMap.has(name.toLowerCase())) effectMap.set(name.toLowerCase(), note);
      });

      // ✅ thêm subNotes vào map
      if (note.subs?.length) {
        note.subs.forEach((subId) => {
          const sub = effectById.get(subId);
          if (!sub) return;
          const subNames = [];
          if (sub.name?.en) subNames.push(sub.name.en);
          if (sub.name?.vn && sub.name.vn !== sub.name.en) subNames.push(sub.name.vn);
          subNames.forEach((subName) => {
            if (!effectMap.has(subName.toLowerCase()))
              effectMap.set(subName.toLowerCase(), sub);
          });
        });
      }
    });
  });

  const regexBold = /<b>(.*?)<\/b>/g;
  processedText = processedText.replace(regexBold, (match, keyword) => {
    const note = effectMap.get(keyword.toLowerCase());
    if (!note) return match;

    const noteDesc = isEnglish.value ? note.description?.en : note.description?.vn;
    const colorMap = { red: "#a63f37", blue: "#4994d4", yellow: "#c07b2a" };
    const color = note.color ? colorMap[note.color] || "#a51919" : "#a51919";

    return `<span
      class="effect-tooltip"
      data-name="${keyword}"
      data-desc="${noteDesc ? noteDesc.replace(/"/g, "&quot;") : ""}"
      data-img='${JSON.stringify(note.images || [])}'
      data-color="${color}"
      style="color:${color}"
    >${keyword}</span>`;
  });

  const regexAnchor = /<a>(.*?)<\/a>/g;
  processedText = processedText.replace(regexAnchor, (match, keyword) => {
    const note = effectMap.get(keyword.toLowerCase());
    if (!note) return match;

    const noteDesc = isEnglish.value ? note.description?.en : note.description?.vn;
    const colorMap = { red: "#a63f37", blue: "#4994d4", yellow: "#c07b2a" };
    const color = note.color ? colorMap[note.color] || "#a51919" : "#a51919";

    return `<span
      class="effect-highlight"
      data-name="${keyword}"
      data-desc="${noteDesc ? noteDesc.replace(/"/g, "&quot;") : ""}"
      data-img='${JSON.stringify(note.images || [])}'
      data-color="${color}"
      style="color:${color}"
    >${keyword}</span>`;
  });

  const regexCnchor = /<c>(.*?)<\/c>/g;
  processedText = processedText.replace(
    regexCnchor,
    (_, keyword) => `<strong>${keyword}</strong>`
  );

  return processedText;
};

const imgs = computed(() => tooltipData.value?.images || []);

const processBoldC = (text) => {
  if (!text) return "";
  return text.replace(/<c>(.*?)<\/c>/g, (_, keyword) => `<strong>${keyword}</strong>`);
};

const matchedSubNotes = computed(() => {
  if (!tooltipData.value || !shikigami.value?.skills || !effects.value) return [];

  const desc = tooltipData.value.description || "";
  const tooltipName = tooltipData.value.name?.toLowerCase();

  const effectById = new Map(effects.value.map((e) => [e.id, e]));
  const seen = new Set();
  let result = [];

  shikigami.value.skills.forEach((skill) => {
    if (!skill.notes?.length) return;

    skill.notes.forEach((noteId) => {
      const note = effectById.get(noteId);
      if (!note) return;

      const noteNameEn = note.name?.en?.toLowerCase() || "";
      const noteNameVn = note.name?.vn?.toLowerCase() || "";

      if (tooltipName !== noteNameEn && tooltipName !== noteNameVn) return;
      if (!note.subs?.length) return;

      note.subs.forEach((subId) => {
        const sub = effectById.get(subId);
        if (!sub) return;

        const subNameEn = sub.name?.en || "";
        const subNameVn = sub.name?.vn || "";

        const matched =
          (subNameEn && desc.toLowerCase().includes(subNameEn.toLowerCase())) ||
          (subNameVn && desc.toLowerCase().includes(subNameVn.toLowerCase()));

        if (matched && !seen.has(sub.id)) {
          seen.add(sub.id);
          result.push(sub);
        }
      });
    });
  });

  return result;
});

const highlightNoteText = (bio, isEnglish) => {
  const text = isEnglish ? bio.condition.en : bio.condition.vn;
  if (!bio.note) return text;

  const noteName = isEnglish ? bio.note.en : bio.note.vn;
  if (!noteName || !shikigamiList.value?.length) return text;

  // escape regex
  const escapedNote = noteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedNote})`, "gi");

  let targetType = null;
  let targetData = null;

  // check Shikigami
  const targetShikigami = shikigamiList.value.find((s) => {
    const n = s.name || {};
    if (n.en?.toLowerCase() === noteName.toLowerCase()) return true;
    if (n.vn?.toLowerCase() === noteName.toLowerCase()) return true;
    if (
      Array.isArray(n.cn) &&
      n.cn.some((c) => c.toLowerCase() === noteName.toLowerCase())
    )
      return true;
    if (
      Array.isArray(n.jp) &&
      n.jp.some((j) => j.toLowerCase() === noteName.toLowerCase())
    )
      return true;
    if (typeof n.jp === "string" && n.jp.toLowerCase() === noteName.toLowerCase())
      return true;
    return false;
  });
  if (targetShikigami) {
    targetType = "shikigami";
    targetData = targetShikigami;
  }

  // check Onmyoji (nếu chưa tìm thấy)
  if (!targetData && onmyojiList?.value?.length) {
    const targetOnmyoji = onmyojiList.value.find((o) => {
      const n = o.name || {};
      if (n.en?.toLowerCase() === noteName.toLowerCase()) return true;
      if (n.vn?.toLowerCase() === noteName.toLowerCase()) return true;
      if (
        Array.isArray(n.cn) &&
        n.cn.some((c) => c.toLowerCase() === noteName.toLowerCase())
      )
        return true;
      if (
        Array.isArray(n.jp) &&
        n.jp.some((j) => j.toLowerCase() === noteName.toLowerCase())
      )
        return true;
      if (typeof n.jp === "string" && n.jp.toLowerCase() === noteName.toLowerCase())
        return true;
      return false;
    });
    if (targetOnmyoji) {
      targetType = "onmyoji";
      targetData = targetOnmyoji;
    }
  }

  let finalName = noteName;

  if (targetType === "shikigami") {
    const n = targetData.name;
    if (Array.isArray(n.jp)) {
      finalName = n.jp[1] || n.jp[0] || noteName;
    } else if (typeof n.jp === "string") {
      finalName = n.jp;
    }
  } else if (targetType === "onmyoji") {
    finalName = targetData.name.en || noteName;
  }

  finalName = finalName.replace(/\s+/g, "_");

  if (targetType) {
  // Nếu có <b>...</b> thì chỉ replace trong phần đó
  if (/<b>.*?<\/b>/.test(text)) {
    return text.replace(/<b>(.*?)<\/b>/g, (match, inner) => {
      return `<b>${inner.replace(
        regex,
        `<a href="/${targetType}/${encodeURIComponent(
          finalName
        )}" class="text-[#891727] font-bold">$1</a>`
      )}</b>`;
    });
  }

  // Nếu không có <b> thì replace như cũ
  return text.replace(
    regex,
    `<a href="/${targetType}/${encodeURIComponent(
      finalName
    )}" class="text-[#891727] font-bold">$1</a>`
  );
}

  return text;
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

/* ---------------------- FETCH DATA + REALTIME ---------------------- */
async function fetchAllEffects() {
  const { data, error } = await supabase
    .from("Effect")
    .select("*")
    .order("id", { ascending: true });
  if (error) console.error("Error fetching effects:", error);
  else effects.value = data;
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
    .select("id, name")
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
  }
}

// realtime subscribe
function subscribeRealtime() {
  supabase
    .channel("shikigami-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "Shikigami" },
      async () => {
        await fetchAllShikigami();
        await fetchShikigami();
        await fetchAllOnmyoji();
      }
    )
    .subscribe();
}

/* ---------------------- LIFECYCLE ---------------------- */
onMounted(async () => {
  document.title = `${formattedName}`;
  await Promise.all([
    fetchAllEffects(),
    fetchAllShikigami(),
    fetchShikigami(),
    fetchAllOnmyoji(),
    loadTags(),
  ]);
  subscribeRealtime();
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
          <div class="flex justify-center h-[600px]">
            <img
              :src="shikigami.images.image"
              :alt="shikigami.name.jp[1]"
              class="h-full object-contain transition-opacity hover:scale-115 transition-transform duration-300"
            />
          </div>
        </div>

        <!-- Name -->
        <div class="flex justify-end w-1/3 max-h-[450px]">
          <table class="w-full">
            <thead>
              <tr class="table-title">
                <th class="p-2 relative text-[20px]" colspan="4">
                  <div>{{ shikigami.name.jp[1] }}</div>
                  <img
                    :src="`/assets/rarity/${shikigami.rarity}.webp`"
                    :alt="shikigami.rarity"
                    class="w-16 h-16 object-contain absolute top-[-30px] left-[-40px]"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <strong>CN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ shikigami.name.cn[0] }}</div>
                  <div>{{ shikigami.name.cn[1] }}</div>
                </td>
              </tr>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <strong>JP</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ shikigami.name.jp[0] }}</div>
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
                  <div>{{ shikigami.name.vn }}</div>
                </td>
              </tr>
              <tr>
                <td class="table-title-row" colspan="4">Voice Actor</td>
              </tr>
              <tr class="table-row text-sm">
                <td class="px-4 py-2">
                  <strong>JP</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ shikigami.name.va }}</div>
                </td>
              </tr>
              <tr v-if="shikigami.rarity !== 'SP'">
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
                      class="absolute bottom-0 right-0 text-white font-bold"
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
                <td colspan="4" class="p-2">
                  <div class="flex flex-col items-center justify-center">
                    <a :href="`/shikigami/${shikigami.version.name.replace(/ /g, '_')}`">
                      <img
                        :src="shikigami.version.image"
                        :alt="shikigami.version.name"
                        class="h-16 w-16 object-contain mb-1"
                    /></a>
                    <router-link
                      :to="`/shikigami/${shikigami.version.name.replace(/ /g, '_')}`"
                      class="text-black font-bold hover:text-[#a51919]"
                    >
                      {{ shikigami.version.name }}
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Profile -->
      <div class="text-black text-justify mt-2 whitespace-pre-line" v-if="shikigami.profile !== null">
        {{ isEnglish ? shikigami.profile.en : shikigami.profile.vn }}
      </div>

      <!-- Content -->
      <div class="flex border-b border-gray-300 mt-5">
        <button
          class="flex py-2 px-4 text-center"
          :class="
            activeTab === 'main'
              ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
              : 'text-[#a3a3a3] cursor-pointer'
          "
          @click="activeTab = 'main'"
        >
          {{ isEnglish ? "Main" : "Chính Điện" }}
        </button>
        <button
          class="flex py-2 px-4 text-center"
          :class="
            activeTab === 'gallery'
              ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
              : 'text-[#a3a3a3] cursor-pointer'
          "
          @click="activeTab = 'gallery'"
        >
          {{ isEnglish ? "Gallery" : "Hoạ Phòng" }}
        </button>
      </div>

      <!-- Main Tab -->
      <div
        class="w-full"
        v-show="activeTab === 'main'"
        :class="activeTab === 'main' ? 'opacity-100' : 'opacity-0'"
      >
        <!-- Stats -->
        <h2
          class="session-title"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
          {{ isEnglish ? "Stats" : "Chỉ số" }}
        </h2>
        <div
          style="
            display: block;
            border: 1px solid #a51919;
            padding: 0 20px;
            margin-top: 85px;
          "
        >
          <table class="stats">
            <tbody>
              <tr class="image-icon" style="color: #a51919">
                <th></th>
                <th rowspan="9">&nbsp;</th>
                <th colspan="2">
                  <figure class="icon-img" style="position: relative">
                    <img
                      :src="shikigami.images.image_icon"
                      :alt="shikigami.name.jp[1]"
                      style="object-fit: contain"
                      width="90"
                    />
                    <div
                      style="
                        color: #a51919;
                        font-weight: bold;
                        position: absolute;
                        top: -50px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                      "
                    >
                      {{
                        shikigami.rarity !== "SP"
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
                    <img
                      :src="
                        shikigami.rarity !== 'SP'
                          ? shikigami.images.image_icon_evo
                          : shikigami.images.image_icon
                      "
                      :alt="shikigami.name.jp[1]"
                      style="object-fit: contain"
                      width="90"
                    />
                    <div
                      style="
                        color: #a51919;
                        font-weight: bold;
                        position: absolute;
                        top: -50px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                      "
                    >
                      {{
                        shikigami.rarity !== "SP"
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
                    <img
                      :src="getATKImage(shikigami.stats.ATK[0])"
                      :alt="getATKRank(shikigami.stats.ATK[0])"
                      class="w-6 h-6"
                    />
                  </div>
                </td>
                <td class="centered-number">
                  <div class="flex justify-start">
                    {{ shikigami.stats.ATK[0] }}
                  </div>
                </td>

                <td class="centered-number">
                  <div class="flex justify-end">
                    <img
                      :src="getATKEvoImage(shikigami.stats.ATK[1])"
                      :alt="getATKEvoImage(shikigami.stats.ATK[1])"
                      class="w-6 h-6"
                    />
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
                    <img
                      :src="getHPImage(shikigami.stats.HP[0])"
                      :alt="getHPRank(shikigami.stats.HP[0])"
                      class="w-6 h-6"
                    />
                  </div>
                </td>
                <td class="centered-number">
                  <div class="flex justify-start">
                    {{ shikigami.stats.HP[0] }}
                  </div>
                </td>

                <td class="centered-number">
                  <div class="flex justify-end">
                    <img
                      :src="getHPEvoImage(shikigami.stats.HP[1])"
                      :alt="getHPEvoRank(shikigami.stats.HP[1])"
                      class="w-6 h-6"
                    />
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
                    <img
                      :src="getDEFImage(shikigami.stats.DEF[0])"
                      :alt="getDEFRank(shikigami.stats.DEF[0])"
                      class="w-6 h-6"
                    />
                  </div>
                </td>
                <td class="centered-number">
                  <div class="flex justify-start">
                    {{ shikigami.stats.DEF[0] }}
                  </div>
                </td>

                <td class="centered-number">
                  <div class="flex justify-end">
                    <img
                      :src="getDEFEvoImage(shikigami.stats.DEF[1])"
                      :alt="getDEFEvoRank(shikigami.stats.DEF[1])"
                      class="w-6 h-6"
                    />
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
                    <img
                      :src="getSPDImage(shikigami.stats.SPD[0])"
                      :alt="getSPDRank(shikigami.stats.SPD[0])"
                      class="w-6 h-6"
                    />
                  </div>
                </td>
                <td class="centered-number">
                  <div class="flex justify-start">
                    {{ shikigami.stats.SPD[0] }}
                  </div>
                </td>
                <td class="centered-number">
                  <div class="flex justify-end">
                    <img
                      :src="getSPDImage(shikigami.stats.SPD[1])"
                      :alt="getSPDRank(shikigami.stats.SPD[1])"
                      class="w-6 h-6"
                    />
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
                    <img
                      :src="getCritImage(shikigami.stats.Crit[0])"
                      :alt="getCritRank(shikigami.stats.Crit[0])"
                      class="w-6 h-6"
                    />
                  </div>
                </td>
                <td class="centered-number">
                  <div class="flex justify-start">{{ shikigami.stats.Crit[0] }}%</div>
                </td>
                <td class="centered-number">
                  <div class="flex justify-end">
                    <img
                      :src="getCritImage(shikigami.stats.Crit[1])"
                      :alt="getCritRank(shikigami.stats.Crit[1])"
                      class="w-6 h-6"
                    />
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
                  <div class="flex justify-start">150%</div>
                </td>

                <td></td>

                <td class="centered-number">
                  <div class="flex justify-start">150%</div>
                </td>

                <td>
                  <div class="flex justify-start">+0%</div>
                </td>
              </tr>

              <tr>
                <th class="label-cell">
                  <img src="/assets/stats/HIT.webp" alt="HIT" />
                  Effects HIT
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
        <h2
          class="session-title mt-5"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
          {{ isEnglish ? "Skills" : "Kĩ năng" }}
        </h2>
        <div class="flex border-b border-gray-300 mb-4 mt-2">
          <button
            v-for="(skill, index) in shikigami.skills.slice(0, 3)"
            :key="index"
            @click="activeSkillIndex = index"
            :class="[
              'px-4 py-2',
              activeSkillIndex === index
                ? 'font-bold border-b-2 border-[#a51919] text-[#a51919]'
                : 'text-[#a3a3a3] cursor-pointer',
            ]"
          >
            {{ skill.type }}
          </button>
          <button
            v-if="shikigami.rarity !== 'SP'"
            @click="activeSkillIndex = 3"
            :class="[
              'px-4 py-2',
              activeSkillIndex === 3
                ? 'font-bold border-b-2 border-[#a51919] text-[#a51919]'
                : 'text-[#a3a3a3] cursor-pointer',
            ]"
          >
            Evolution Effect
          </button>
        </div>
        <div v-if="activeSkillIndex < 3">
          <div>
            <div style="position: relative; padding-left: 40px; margin-bottom: 20px">
              <!-- Skill icon + title -->
              <div>
                <span
                  style="
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
                  "
                >
                  <img
                    :src="shikigami.skills[activeSkillIndex].image"
                    :alt="shikigami.skills[activeSkillIndex].name.en"
                    :title="shikigami.skills[activeSkillIndex].name.en"
                  />
                </span>
                <span
                  style="
                    display: table-cell;
                    vertical-align: bottom;
                    font-weight: 900;
                    font-size: 20px;
                    color: #a51919;
                    height: 65px;
                    text-indent: 70px;
                    padding-bottom: 5px;
                  "
                >
                  <div class="skill-title">
                    <span
                      class="skill-name"
                      :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
                    >
                      {{
                        isEnglish
                          ? shikigami.skills[activeSkillIndex].name.en
                          : shikigami.skills[activeSkillIndex].name.vn
                      }}
                    </span>
                    <span class="skill-sub-name">
                      ({{ shikigami.skills[activeSkillIndex].name.cn }}/{{
                        shikigami.skills[activeSkillIndex].name.jp
                      }})
                    </span>
                  </div>
                </span>
              </div>

              <!-- Skill description -->
              <div style="padding: 10px 20px; border: 1px solid #a51919">
                <div class="text-black pb-5 skill-header">
                  <div class="skill-info flex">
                    <span style="margin-left: 25px; font-size: smaller">
                      <b>{{ isEnglish ? "Type" : "Loại" }}:</b>
                      {{ shikigami.skills[activeSkillIndex].type }}
                    </span>
                    <span class="flex" style="margin-left: 40px; font-size: smaller">
                      <b>{{ isEnglish ? "Onibi" : "Quỷ hoả" }}:</b>
                      <img
                        src="https://twdujdgoxkgbvdkstske.supabase.co/storage/v1/object/public/Shikigami/Onibi.webp"
                        alt="Onibi"
                      />
                      {{ shikigami.skills[activeSkillIndex].onibi }}
                    </span>
                    <span style="margin-left: 40px; font-size: smaller">
                      <b>{{ isEnglish ? "Cooldown" : "Hồi chiêu" }}:</b>
                      {{ shikigami.skills[activeSkillIndex].cooldown }}
                    </span>
                  </div>
                  <div class="skill-badges flex flex-wrap gap-2">
                    <div
                      v-for="tagId in shikigami.skills[activeSkillIndex].tags"
                      :key="tagId"
                      class="relative inline-flex items-center justify-center w-20 h-6 overflow-hidden rounded-md"
                    >
                      <!-- brush nền -->
                      <div
                        class="absolute inset-0 tint-base"
                        :class="'tint-' + (tagMap?.[tagId]?.color || 'grey')"
                      ></div>

                      <!-- chữ đè lên -->
                      <span class="relative z-10 text-xs text-white">
                        {{ tagMap?.[tagId]?.name }}
                      </span>
                    </div>
                  </div>
                </div>
                <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />

                <p class="text-center italic text-[#a3a3a3]">
                  "{{ shikigami.skills[activeSkillIndex].voice }}"
                </p>
                <p
                  class="whitespace-pre-line text-justify"
                  style="
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.5;
                    color: #444;
                    padding: 10px 0;
                  "
                  v-html="
                    processTextWithTooltips(
                      isEnglish
                        ? shikigami.skills[activeSkillIndex].description.en
                        : shikigami.skills[activeSkillIndex].description.vn
                    )
                  "
                ></p>
                <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
                <table
                  style="width: 100%; border-collapse: collapse; font-size: 14px"
                  v-if="
                    Array.isArray(
                      isEnglish
                        ? shikigami.skills[activeSkillIndex].levels.en
                        : shikigami.skills[activeSkillIndex].levels.vn
                    )
                  "
                >
                  <tbody>
                    <tr style="color: #a51919; font-weight: bold">
                      <th style="padding: 6px; text-align: left; width: 70px">
                        {{ isEnglish ? "Level" : "Cấp" }}
                      </th>
                      <th style="padding: 6px 10px; text-align: left">
                        {{ isEnglish ? "Effect" : "Hiệu ứng" }}
                      </th>
                    </tr>
                    <tr
                      v-for="lvl in isEnglish
                        ? shikigami.skills[activeSkillIndex].levels.en
                        : shikigami.skills[activeSkillIndex].levels.vn"
                      :key="lvl.level"
                      style="color: #444"
                    >
                      <td style="padding: 6px 10px">{{ lvl.level }}</td>
                      <td
                        style="padding: 6px 10px"
                        v-html="processTextWithTooltips(lvl.effect)"
                      ></td>
                    </tr>
                  </tbody>
                </table>
                <div v-else>
                  <p
                    style="color: #a3a3a3"
                    class="no-level"
                    v-html="
                      processTextWithTooltips(
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
              v-if="shikigami.skills.length > 3"
              v-for="(skill, index) in shikigami.skills.filter(
                (s, i) => i >= 3 && s?.tab === activeSkillIndex + 1
              )"
              :key="'extra-' + index"
              style="
                position: relative;
                padding-left: 40px;
                margin-bottom: 20px;
                margin-top: 50px;
              "
            >
              <!-- Skill icon + title -->
              <div>
                <span
                  style="
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
                  "
                >
                  <img :src="skill.image" :alt="skill.name.en" :title="skill.name.en" />
                </span>
                <span
                  style="
                    display: table-cell;
                    vertical-align: bottom;
                    font-size: 20px;
                    color: #a51919;
                    height: 65px;
                    text-indent: 70px;
                    padding-bottom: 5px;
                  "
                >
                  <div class="skill-title">
                    <span
                      class="skill-name"
                      :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
                    >
                      {{ isEnglish ? skill.name.en : skill.name.vn }}
                    </span>
                    <span class="skill-sub-name">
                      ({{ skill.name.cn }}/{{ skill.name.jp }})
                    </span>
                  </div>
                </span>
              </div>

              <!-- Skill description -->
              <div style="padding: 10px 25px; border: 1px solid #a51919">
                <div class="text-black pb-5 skill-header">
                  <div class="skill-info flex">
                    <span style="margin-left: 45px; font-size: smaller">
                      <b>{{ isEnglish ? "Type" : "Loại" }}:</b>
                      {{ skill.type }}
                    </span>
                    <span class="flex" style="margin-left: 45px; font-size: smaller">
                      <b>{{ isEnglish ? "Onibi" : "Quỷ hoả" }}:</b>
                      <img src="/assets/Onibi.webp" alt="Onibi" />
                      {{ skill.onibi }}
                    </span>
                    <span style="margin-left: 45px; font-size: smaller">
                      <b>{{ isEnglish ? "Cooldown" : "Hồi chiêu" }}:</b>
                      {{ skill.cooldown }}
                    </span>
                  </div>
                  <div class="skill-badges flex flex-wrap gap-2">
                    <div
                      v-for="tagId in skill.tags"
                      :key="tagId"
                      class="relative inline-flex items-center justify-center w-20 h-6 overflow-hidden rounded-md"
                    >
                      <!-- brush nền -->
                      <div
                        class="absolute inset-0 tint-base"
                        :class="'tint-' + (tagMap?.[tagId]?.color || 'grey')"
                      ></div>

                      <!-- chữ đè lên -->
                      <span class="relative z-10 text-xs text-white">
                        {{ tagMap?.[tagId]?.name }}
                      </span>
                    </div>
                  </div>
                </div>
                <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
                <p
                  class="whitespace-pre-line text-justify"
                  style="
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.5;
                    color: #444;
                    padding: 10px 0;
                  "
                  v-html="
                    processTextWithTooltips(
                      isEnglish ? skill.description.en : skill.description.vn
                    )
                  "
                ></p>
                <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
                <table
                  style="width: 100%; border-collapse: collapse; font-size: 14px"
                  v-if="Array.isArray(isEnglish ? skill.levels.en : skill.levels.vn)"
                >
                  <tbody>
                    <tr style="color: #a51919; font-weight: bold">
                      <th style="padding: 6px; text-align: left; width: 70px">
                        {{ isEnglish ? "Level" : "Cấp" }}
                      </th>
                      <th style="padding: 6px 10px; text-align: left">
                        {{ isEnglish ? "Effect" : "Hiệu ứng" }}
                      </th>
                    </tr>
                    <tr
                      v-for="lvl in isEnglish ? skill.levels.en : skill.levels.vn"
                      :key="lvl.level"
                      style="color: #444"
                    >
                      <td style="padding: 6px 10px">{{ lvl.level }}</td>
                      <td
                        style="padding: 6px 10px"
                        v-html="processTextWithTooltips(lvl.effect)"
                      ></td>
                    </tr>
                  </tbody>
                </table>
                <div v-else>
                  <p
                    style="color: #a3a3a3"
                    class="no-level"
                    v-html="
                      processTextWithTooltips(
                        isEnglish ? skill.levels.en : skill.levels.vn
                      )
                    "
                  ></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div style="padding: 10px; border: 1px solid #a51919">
            <p
              class="whitespace-pre-line text-justify"
              style="
                margin: 0;
                font-size: 15px;
                line-height: 1.5;
                color: #444;
                padding: 10px 0;
              "
              v-html="
                isEnglish
                  ? processBoldC(shikigami.evolution.en)
                  : processBoldC(shikigami.evolution.vn)
              "
            ></p>
          </div>
        </div>

        <!-- Biography Unlock -->
        <h2
          class="session-title mt-5"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
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
            <tr v-for="(bio, index) in shikigami.bio" :key="index">
              <td class="text-black table-cell text-center w-[50px]">
                {{ bio.no }}
              </td>
              <td class="text-black table-cell px-3">
                <span v-html="highlightNoteText(bio, isEnglish)"></span>
              </td>

              <td class="py-1 text-black table-cell w-[100px]">
                <div class="w-12 h-12 flex items-center justify-center mx-auto relative">
                  <img
                    :src="bio.image"
                    :alt="bio.no"
                    class="max-h-full max-w-full object-contain"
                  />
                  <span
                    class="absolute bottom-0 right-0 text-white font-bold"
                    style="
                      text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000,
                        1px 1px 0 #000;
                    "
                    >{{ bio.reward }}</span
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Gallery Tab -->
      <div
        v-show="activeTab === 'gallery'"
        :class="activeTab === 'gallery' ? 'opacity-100' : 'opacity-0'"
      >
        <!-- Skins -->
        <h2
          class="session-title mt-5"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
          {{ isEnglish ? "Skins" : "Ngoại hình" }}
        </h2>
        <div class="grid grid-cols-3 gap-5 mt-4">
          <div
            v-for="(skin, index) in shikigami.skins"
            :key="index"
            class="flex flex-col items-center"
            :title="skin.name.en || skin.name.cn"
          >
            <img
              :src="skin.image"
              :alt="skin.name.en || skin.name.cn"
              class="w-full h-80 object-contain hover:scale-110 transition-transform duration-300 overflow-visible"
            />
            <p class="mt-4 text-center font-medium text-black">
              {{ isEnglish ? skin.name.en || skin.name.cn : skin.name.vn }}
            </p>
          </div>
        </div>

        <!-- Skins Info -->
        <h2
          class="session-title mt-5"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
          {{ isEnglish ? "Skins Info" : "Thông tin ngoại hình" }}
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
              <td class="px-2 py-1 text-center table-cell w-[105px]">
                <img
                  :src="skin.image_info"
                  :alt="skin.name.en || skin.name.cn"
                  class="w-24 h-24 object-contain mx-auto"
                />
              </td>
              <td
                class="px-2 py-1 text-center table-cell"
                v-if="skin.name.en === 'Default' || skin.name.en === 'Evolution'"
              >
                <div>{{ isEnglish ? skin.name.en : skin.name.vn }}</div>
              </td>

              <td class="px-2 py-1 text-center table-cell" v-else>
                <div>{{ skin.name.en }}</div>
                <div>{{ skin.name.cn }} - {{ skin.name.vn }}</div>
              </td>

              <td class="px-2 py-1 text-center table-cell">
                {{ skin.artist }}
              </td>
              <td class="px-2 py-1 text-center table-cell">
                {{ skin.obtained }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Biography Accessories -->
        <h2
          v-if="shikigami.accessories && shikigami.accessories.length"
          class="session-title mt-5"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
          {{ isEnglish ? "Biography Accessories" : "Phụ kiện Tiểu sử" }}
        </h2>

        <table
          v-if="shikigami.accessories && shikigami.accessories.length"
          class="w-full mt-4"
          style="border: 1px solid #a51919"
        >
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
            <tr
              class="text-black"
              v-for="(bio, index) in shikigami.accessories"
              :key="index"
            >
              <td class="px-2 py-1 text-center table-cell w-[50px]">{{ bio.no }}</td>
              <td class="px-2 py-1 text-center table-cell w-[105px]">
                <img
                  :src="bio.image"
                  :alt="bio.name.en || bio.name.cn"
                  class="w-24 h-24 object-contain mx-auto"
                />
              </td>
              <td class="px-2 py-1 text-center table-cell">
                <div>{{ bio.name.en }}</div>
                <div>{{ bio.name.cn }} - {{ bio.name.vn }}</div>
              </td>
              <td class="px-2 py-1 text-center table-cell">
                {{ bio.type }}
              </td>
              <td class="px-2 py-1 text-center table-cell">
                {{ bio.obtained }}
              </td>
            </tr>
          </tbody>
        </table>
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
      </div>
      <div v-if="imgs.length" class="tooltip-images pb-1">
        <img
          v-for="(img, i) in imgs"
          :key="i"
          :src="'/assets/effects/' + img"
          :alt="img"
          class="tooltip-img"
        />
      </div>

      <div
        class="tooltip-description whitespace-pre-line"
        v-html="processTextWithTooltips(tooltipData.description)"
      ></div>

      <!-- Nếu có subNotes match -->
      <div v-if="matchedSubNotes.length">
        <hr class="tooltip-divider" />
        <div class="subnotes-container">
          <div v-for="(sub, idx) in matchedSubNotes" :key="idx" class="subnote-block">
            <div class="subnote-title">
              {{ isEnglish ? sub.name.en : sub.name.vn }}
            </div>
            <img
              v-if="sub.images"
              v-for="(img, i) in sub.images"
              :key="i"
              :src="'/assets/effects/' + img"
              :alt="img"
              style="width: 32px; height: 32px; margin-bottom: 8px"
            />
            <div
              class="subnote-description whitespace-pre-line"
              v-html="processBoldC(isEnglish ? sub.description.en : sub.description.vn)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
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
  font-size: 16px;
  color: #f4f1e8;
  text-align: center;
  padding: 8px;
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

.text-vn {
  font-family: "Nunito", sans-serif;
}

.session-title {
  color: #3a3a3a;
  font-size: 24px;
  font-weight: 500;
  overflow: auto;
  padding: 6px 0;
  border-bottom: 0.5px solid #9c9c9c;
}

.lang-en .session-title {
  font-family: "Rubik", sans-serif;
}
.lang-vi .session-title {
  font-family: "Nunito", sans-serif;
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
  margin-left: 45px;
  font-size: smaller;
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

.scroll-hide {
  scrollbar-width: none;
}
.scroll-hide::-webkit-scrollbar {
  display: none;
}

.voice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.voice-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9f9f9;
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 0 2px 6px rgba(122, 6, 6, 0.08);
}

.voice-type {
  min-width: 120px;
  font-weight: bold;
  color: #a51919;
}

.voice-text {
  flex: 1;
  font-size: 0.95rem;
  color: #333;
}

.voice-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}
.voice-btn:hover {
  transform: scale(1.1);
}

/* Tooltip Styles */
.effect-tooltip {
  font-weight: bold;
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
