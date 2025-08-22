<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const supabase = useSupabase();

/* ---------------------- STATE ---------------------- */
const shikigami = ref(null);
const shikigamiList = ref([]);
const isEnglish = ref(true);

const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

const activeTab = ref("default");
const activeSkillIndex = ref(0);

const formattedName = route.params.name.replace(/_/g, " ");

/* ---------------------- UTILS ---------------------- */
const between = (val, min, max) => val >= min && val <= max;

/* ---------------------- RANK + IMAGE ---------------------- */
const rankRanges = {
  // S: 165 -> ?, A: 127 -> 133, B: 123 -> 124, C: 102 -> 103, D: ? -> ?
  atk: [
    { min: 165, max: 171, rank: "S" },
    { min: 127, max: 133, rank: "A" },
    { min: 123, max: 124, rank: "B" },
    { min: 102, max: 103, rank: "C" },
    { min: 97, max: 98, rank: "D" },
  ],
  // S: 3002 -> 3484, A: 2894 -> 2975, B: ? -> ?, C: 2385 -> ?, D: ? -> ?
  atkEvo: [
    { min: 3002, max: 3484, rank: "S" },
    { min: 2894, max: 2975, rank: "A" },
    { min: 2386, max: 2386, rank: "B" },
    { min: 2385, max: 2385, rank: "C" },
  ],
  // S: 1174 -> ?, A: ? -> ?, B: 960 -> ?, C: 864 -> 939, D: 843 -> ?
  hp: [
    { min: 1174, max: 1323, rank: "S" },
    { min: 1310, max: 1312, rank: "A" },
    { min: 960, max: 966, rank: "B" },
    { min: 864, max: 939, rank: "C" },
    { min: 843, max: 843, rank: "D" },
  ],
  // S: 13785 -> ?, A: 12532 -> ?, B: 10254 -> 11165, C: 9684 -> 10026, D: ? -> ?
  hpEvo: [
    { min: 13785, max: 13786, rank: "S" },
    { min: 12532, max: 12535, rank: "A" },
    { min: 10254, max: 11165, rank: "B" },
    { min: 9684, max: 10026, rank: "C" },
  ],
  // S: ? -> ?, A: 75 -> ?, B: ? -> ?, C: 61 -> 67, D: 58 -> ?
  def: [
    { min: 8134, max: 8171, rank: "S" },
    { min: 75, max: 170, rank: "A" },
    { min: 68, max: 70, rank: "B" },
    { min: 61, max: 67, rank: "C" },
    { min: 58, max: 60, rank: "D" },
  ],
  // S: 490 -> ?, A: ? -> ?, B: 397 -> 437, C: 375 -> ?, D: ? -> ?
  defEvo: [
    { min: 490, max: 490, rank: "S" },
    { min: 488, max: 489, rank: "A" },
    { min: 397, max: 437, rank: "B" },
    { min: 375, max: 411, rank: "C" },
  ],
  spd: [
    { min: 110, max: 127, rank: "S" },
    { min: 105, max: 109, rank: "A" },
    { min: 100, max: 104, rank: "B" },
    { min: 95, max: 99, rank: "C" },
    { min: 90, max: 94, rank: "D" },
  ],
  crit: [
    { min: 12, max: 999, rank: "SS" },
    { min: 10, max: 12, rank: "S" },
    { min: 8, max: 9, rank: "A" },
    { min: 5, max: 5, rank: "B" },
    { min: 3, max: 3, rank: "C" },
    { min: 0, max: 1, rank: "D" },
  ],
};

function getRank(type, value) {
  const ranges = rankRanges[type] || [];
  for (const { min, max, rank } of ranges) {
    if (between(value, min, max)) return rank;
  }
  return "E";
}

function getRankImage(type, value) {
  return `/assets/stats/${getRank(type, value)}.webp`;
}

/* ---------------------- TOOLTIP ---------------------- */
const colorMap = { red: "#a63f37", blue: "#4994d4", yellow: "#c07b2a" };

function processTextWithTooltips(text) {
  if (!text || !shikigami.value?.skills) return text;

  let processedText = text;
  const effectMap = new Map();

  // gom tất cả notes + subNotes vào effectMap
  shikigami.value.skills.forEach((skill) => {
    (skill.notes || []).forEach((noteItem) => {
      const addToMap = (name, item) => {
        if (name && !effectMap.has(name.toLowerCase())) {
          effectMap.set(name.toLowerCase(), item);
        }
      };
      addToMap(noteItem.name?.en, noteItem);
      addToMap(noteItem.name?.vn, noteItem);
      (noteItem.subNotes || []).forEach((sub) => {
        addToMap(sub.name?.en, sub);
        addToMap(sub.name?.vn, sub);
      });
    });
  });

  const replaceTag = (regex, className) =>
    processedText.replace(regex, (match, keyword) => {
      const note = effectMap.get(keyword.toLowerCase());
      if (!note) return match;

      const desc = isEnglish.value ? note.description?.en : note.description?.vn;
      const color = note.color ? colorMap[note.color] || "#a51919" : "#a51919";

      return `<span
        class="${className}"
        data-name="${keyword}"
        data-desc="${desc?.replace(/"/g, "&quot;") || ""}"
        data-img="${note.image || ""}"
        data-color="${color}"
        style="color:${color}"
      >${keyword}</span>`;
    });

  processedText = replaceTag(/<b>(.*?)<\/b>/g, "effect-tooltip");
  processedText = replaceTag(/<a>(.*?)<\/a>/g, "effect-highlight");
  processedText = processedText.replace(/<c>(.*?)<\/c>/g, "<strong>$1</strong>");

  return processedText;
}

const processBoldC = (text) =>
  text?.replace(/<c>(.*?)<\/c>/g, "<strong>$1</strong>") || "";

/* ---------------------- TOOLTIP EVENTS ---------------------- */
const handleMouseEnter = (e) => {
  const target = e.currentTarget;
  tooltipData.value = {
    name: target.getAttribute("data-name"),
    description: target.getAttribute("data-desc"),
    image: target.getAttribute("data-img"),
    color: target.getAttribute("data-color"),
  };
  updateTooltipPosition(e);
  showTooltip.value = true;
};
const handleMouseLeave = () => (showTooltip.value = false);
const handleMouseMove = (e) => showTooltip.value && updateTooltipPosition(e);
const updateTooltipPosition = (e) =>
  (tooltipPosition.value = { x: e.clientX + 10, y: e.clientY + 10 });

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
async function fetchAllShikigami() {
  const { data, error } = await supabase
    .from("Shikigami")
    .select("*")
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
      }
    )
    .subscribe();
}

/* ---------------------- LIFECYCLE ---------------------- */
onMounted(async () => {
  document.title = `Shikigami - ${formattedName}`;
  await fetchAllShikigami();
  await fetchShikigami();
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
  <div class="main-container" v-if="shikigami">
    <div class="content-section flex flex-col gap-4">
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

      <div class="flex gap-6">
        <div class="w-2/3 mx-auto">
          <!-- Tabs -->
          <div v-if="shikigami.rarity !== 'SP'" class="w-full">
            <div class="flex border-b border-gray-300 mb-4">
              <button
                class="flex py-2 px-4 text-center"
                :class="
                  activeTab === 'default'
                    ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
                    : 'text-[#a3a3a3] cursor-pointer'
                "
                @click="activeTab = 'default'"
              >
                {{ isEnglish ? "Default" : "Mặc định" }}
              </button>
              <button
                class="flex py-2 px-4 text-center"
                :class="
                  activeTab === 'evo'
                    ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
                    : 'text-[#a3a3a3] cursor-pointer'
                "
                @click="activeTab = 'evo'"
              >
                {{ isEnglish ? "Evolution" : "Thức tỉnh" }}
              </button>
            </div>
          </div>

          <!-- Images -->
          <div class="flex justify-center">
            <img
              v-show="activeTab === 'default'"
              :src="shikigami.images.image"
              :alt="shikigami.name.jp[1]"
              class="max-h-[600px] object-contain transition-opacity hover:scale-105 transition-transform duration-300"
              :class="activeTab === 'default' ? 'opacity-100' : 'opacity-0'"
            />
            <img
              v-show="activeTab === 'evo'"
              :src="shikigami.images.image_evo"
              :alt="shikigami.name.jp[1]"
              class="max-h-[600px] object-contain transition-opacity hover:scale-105 transition-transform duration-300"
              :class="activeTab === 'evo' ? 'opacity-100' : 'opacity-0'"
            />
          </div>
        </div>

        <div class="flex justify-end w-1/3 max-h-[400px]">
          <table class="border border-gray-400 text-sm w-full">
            <thead>
              <tr>
                <th class="border border-red table-title p-2 relative" colspan="4">
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
              <tr class="border border-red text-black h-[60px]">
                <td class="px-4">
                  <strong>CN</strong>
                </td>
                <td class="px-4" colspan="3">
                  <div>{{ shikigami.name.cn[0] }}</div>
                  <div>{{ shikigami.name.cn[1] }}</div>
                </td>
              </tr>
              <tr class="border border-red text-black h-[60px]">
                <td class="px-4">
                  <strong>JP</strong>
                </td>
                <td class="px-4" colspan="3">
                  <div>{{ shikigami.name.jp[0] }}</div>
                  <div>{{ shikigami.name.jp[1] }}</div>
                </td>
              </tr>
              <tr class="border border-red text-black h-[40px]">
                <td class="px-4">
                  <strong>GL</strong>
                </td>
                <td class="px-4" colspan="3">
                  <div>{{ shikigami.name.en }}</div>
                </td>
              </tr>
              <tr class="border border-red text-black h-[40px]">
                <td class="px-4">
                  <strong>VN</strong>
                </td>
                <td class="px-4" colspan="3">
                  <div>{{ shikigami.name.vn }}</div>
                </td>
              </tr>
              <tr v-if="shikigami.rarity !== 'SP'">
                <td
                  class="border border-red p-2 h-10"
                  colspan="4"
                  style="background-color: #a51919; text-align: center; font-weight: 600"
                >
                  Evo Materials
                </td>
              </tr>
              <tr
                v-if="shikigami.materials && shikigami.materials.length"
                class="h-[60px]"
              >
                <td
                  class="border border-red px-2"
                  v-for="material in shikigami.materials"
                  :key="material.type"
                >
                  <div class="w-12 h-12 flex items-center justify-center relative">
                    <img
                      :src="`/assets/materials/${material.type}.webp`"
                      :alt="material.type"
                      class="max-h-full max-w-full object-contain"
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
                <td
                  class="border border-red p-2 h-10"
                  colspan="4"
                  style="background-color: #a51919; text-align: center; font-weight: 600"
                >
                  Other Version
                </td>
              </tr>
              <tr v-if="shikigami.version !== null" class="h-[100px]">
                <td class="border border-red" colspan="4">
                  <div class="flex flex-col items-center justify-center">
                    <img
                      :src="shikigami.version.image"
                      :alt="shikigami.version.name"
                      class="max-h-16 max-w-16 object-contain mb-1"
                    />
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
      <div class="text-black text-justify mt-2" v-if="shikigami.profile !== null">
        {{ isEnglish ? shikigami.profile.en : shikigami.profile.vn }}
      </div>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Stats" : "Chỉ số" }}
      </h2>
      <div
        style="
          display: block;
          border: 1px solid #a51919;
          padding: 0 20px;
          margin-top: 80px;
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

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Skills" : "Kĩ năng" }}
      </h2>
      <div class="flex border-b border-gray-300 mb-4">
        <button
          v-for="(skill, index) in shikigami.skills"
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
          @click="activeSkillIndex = shikigami.skills.length"
          :class="[
            'px-4 py-2',
            activeSkillIndex === shikigami.skills.length
              ? 'font-bold border-b-2 border-[#a51919] text-[#a51919]'
              : 'text-[#a3a3a3] cursor-pointer',
          ]"
        >
          Evolution Effect
        </button>
      </div>
      <div v-if="activeSkillIndex < shikigami.skills.length">
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
                    class="name"
                    :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
                  >
                    {{
                      isEnglish
                        ? shikigami.skills[activeSkillIndex].name.en
                        : shikigami.skills[activeSkillIndex].name.vn
                    }}
                  </span>
                  <span class="sub-name">
                    ({{ shikigami.skills[activeSkillIndex].name.cn }}/{{
                      shikigami.skills[activeSkillIndex].name.jp
                    }})
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
                    {{ shikigami.skills[activeSkillIndex].type }}
                  </span>
                  <span class="flex" style="margin-left: 45px; font-size: smaller">
                    <b>{{ isEnglish ? "Onibi" : "Quỷ hoả" }}:</b>
                    <img src="/assets/Onibi.webp" alt="Onibi" />
                    {{ shikigami.skills[activeSkillIndex].onibi }}
                  </span>
                  <span style="margin-left: 45px; font-size: smaller">
                    <b>{{ isEnglish ? "Cooldown" : "Hồi chiêu" }}:</b>
                    {{ shikigami.skills[activeSkillIndex].cooldown }}
                  </span>
                </div>
                <div class="skill-badges">
                  <span
                    v-for="tag in shikigami.skills[activeSkillIndex].tags"
                    :key="tag.name"
                    class="badge"
                    :class="'badge-' + tag.color"
                  >
                    {{ tag.name }}
                  </span>
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
            v-if="shikigami.skills[activeSkillIndex].skill"
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
                <img
                  :src="shikigami.skills[activeSkillIndex].skill.image"
                  :alt="shikigami.skills[activeSkillIndex].skill.name.en"
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
                    class="name"
                    :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
                  >
                    {{
                      isEnglish
                        ? shikigami.skills[activeSkillIndex].skill.name.en
                        : shikigami.skills[activeSkillIndex].skill.name.vn
                    }}
                  </span>
                  <span class="sub-name">
                    ({{ shikigami.skills[activeSkillIndex].skill.name.cn }}/{{
                      shikigami.skills[activeSkillIndex].skill.name.jp
                    }})
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
                    {{ shikigami.skills[activeSkillIndex].skill.type }}
                  </span>
                  <span class="flex" style="margin-left: 45px; font-size: smaller">
                    <b>{{ isEnglish ? "Onibi" : "Quỷ hoả" }}:</b>
                    <img src="/assets/Onibi.webp" alt="Onibi" />
                    {{ shikigami.skills[activeSkillIndex].skill.onibi }}
                  </span>
                  <span style="margin-left: 45px; font-size: smaller">
                    <b>{{ isEnglish ? "Cooldown" : "Hồi chiêu" }}:</b>
                    {{ shikigami.skills[activeSkillIndex].skill.cooldown }}
                  </span>
                </div>
                <div class="skill-badges">
                  <span
                    v-for="tag in shikigami.skills[activeSkillIndex].skill.tags"
                    :key="tag.name"
                    class="badge"
                    :class="'badge-' + tag.color"
                  >
                    {{ tag.name }}
                  </span>
                </div>
              </div>
              <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
              <p
                class="text-center italic text-[#a3a3a3]"
                v-if="shikigami.skills[activeSkillIndex].skill.voice"
              >
                "{{ shikigami.skills[activeSkillIndex].skill.voice }}"
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
                      ? shikigami.skills[activeSkillIndex].skill.description.en
                      : shikigami.skills[activeSkillIndex].skill.description.vn
                  )
                "
              ></p>
              <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
              <table
                style="width: 100%; border-collapse: collapse; font-size: 14px"
                v-if="
                  Array.isArray(
                    isEnglish
                      ? shikigami.skills[activeSkillIndex].skill.levels.en
                      : shikigami.skills[activeSkillIndex].skill.levels.vn
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
                      ? shikigami.skills[activeSkillIndex].skill.levels.en
                      : shikigami.skills[activeSkillIndex].skill.levels.vn"
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
                        ? shikigami.skills[activeSkillIndex].skill.levels.en
                        : shikigami.skills[activeSkillIndex].skill.levels.vn
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

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Biography Unlock" : "Mở khoá Tiểu sử" }}
      </h2>

      <table>
        <thead>
          <tr class="border border-[#a51919]">
            <th class="table-title-bio">No.</th>
            <th class="table-title-bio">
              {{ isEnglish ? "Unlock Conditions" : "Điều kiện mở khóa" }}
            </th>
            <th class="table-title-bio">
              {{ isEnglish ? "Rewards" : "Phần thưởng" }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(bio, index) in shikigami.bio" :key="index">
            <td class="text-black border border-[#a51919] text-center w-[50px]">
              {{ bio.no }}
            </td>
            <td class="text-black border border-[#a51919] px-3 py-2">
              <span v-html="highlightNoteText(bio, isEnglish)"></span>
            </td>

            <td class="text-black border border-[#a51919] w-[100px]">
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

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Skins" : "Ngoại hình" }}
      </h2>
      <div class="grid grid-cols-3 gap-5 mt-4">
        <div class="flex flex-col items-center" title="Default">
          <img
            :src="shikigami.images.image"
            :alt="shikigami.name.jp[1]"
            class="w-full h-70 object-cover hover:scale-110 transition-transform duration-300"
          />
          <p
            class="mt-4 text-center font-medium text-black"
            :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
          >
            {{ isEnglish ? "Default" : "Mặc định" }}
          </p>
        </div>
        <div
          class="flex flex-col items-center"
          title="Evolution"
          v-if="shikigami.rarity !== 'SP'"
        >
          <img
            :src="shikigami.images.image_evo"
            :alt="shikigami.name.jp[1]"
            class="w-full h-70 object-cover hover:scale-110 transition-transform duration-300"
          />
          <p class="mt-4 text-center font-medium text-black">
            {{ isEnglish ? "Evolution" : "Thức tỉnh" }}
          </p>
        </div>
        <div
          v-for="(skin, index) in shikigami.skins.slice(0, -2)"
          :key="index"
          class="flex flex-col items-center"
          :title="skin.name.en || skin.name.cn"
        >
          <img
            :src="skin.image"
            :alt="skin.name.en || skin.name.cn"
            class="w-full h-70 object-cover hover:scale-110 transition-transform duration-300 overflow-visible"
          />
          <p class="mt-4 text-center font-medium text-black">
            {{ isEnglish ? skin.name.en || skin.name.cn : skin.name.vn }}
          </p>
        </div>
      </div>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Skins Info" : "Thông tin ngoại hình" }}
      </h2>

      <table class="w-full" style="border: 1px solid #a51919">
        <thead>
          <tr style="background-color: #a51919; font-weight: bold">
            <th class="px-2 py-1 cursor-pointer">
              {{ isEnglish ? "Image" : "Ảnh" }}
            </th>
            <th class="px-2 py-1 cursor-pointer">
              {{ isEnglish ? "Name" : "Tên" }}
            </th>
            <th class="px-2 py-1 cursor-pointer">
              {{ isEnglish ? "Artist" : "Họa sĩ" }}
            </th>
            <th class="px-2 py-1 cursor-pointer">
              {{ isEnglish ? "Obtained" : "Cách nhận" }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="text-black">
            <td class="w-26 h-26 px-2 py-1 text-center" style="border: 1px solid #a51919">
              <img
                :src="shikigami.images.image_skin"
                alt="Default Skin"
                class="w-24 h-24 object-contain mx-auto"
              />
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              Default
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              {{ shikigami.skins[shikigami.skins.length - 2].artist || "" }}
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919"></td>
          </tr>
          <tr class="text-black" v-if="shikigami.rarity !== 'SP'">
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              <img
                :src="shikigami.images.image_skin_evo"
                alt="Evolution Skin"
                class="w-24 h-24 object-contain mx-auto"
              />
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              Evolution
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              {{ shikigami.skins[shikigami.skins.length - 1].artist }}
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              After evolution
            </td>
          </tr>
          <tr
            class="text-black"
            v-for="(skin, index) in shikigami.skins.slice(0, -2)"
            :key="index"
          >
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              <img
                :src="skin.image_info"
                :alt="skin.name.en || skin.name.cn"
                class="w-24 h-24 object-contain mx-auto"
              />
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              <div>{{ skin.name.en }}</div>
              <div>{{ skin.name.cn }} - {{ skin.name.vn }}</div>
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              {{ skin.artist }}
            </td>
            <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
              {{ skin.obtained }}
            </td>
          </tr>
        </tbody>
      </table>
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
      <img
        v-if="tooltipData.image"
        :src="'/assets/effects/' + tooltipData.image"
        :alt="tooltipData.image"
        style="width: 32px; height: 32px; margin-bottom: 8px"
      />
      <div
        class="tooltip-description"
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
              v-if="sub.image"
              :src="'/assets/effects/' + sub.image"
              :alt="tooltipData.image"
              style="width: 32px; height: 32px; margin-bottom: 8px"
            />
            <div class="subnote-description">
              {{ isEnglish ? sub.description.en : sub.description.vn }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  gap: 30px;
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

.border-red {
  border-color: #a51919;
}

.table-title {
  font-size: 24px;
  font-weight: bold;
  color: #f4f1e8;
  text-align: center;
  padding: 8px;
  background-color: #a51919;
}

.table-title-bio {
  font-size: 14px;
  font-weight: bold;
  color: #f4f1e8;
  text-align: center;
  padding: 8px;
  background-color: #a51919;
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

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 25px;
}

.skill-info span {
  margin-left: 45px;
  font-size: smaller;
}

.skill-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: smaller;
  font-weight: bold;
  color: white;
}

.badge-red {
  background-color: #a63f37;
}

.badge-blue {
  background-color: #4994d4;
}

.badge-grey {
  background-color: #959494;
}

.badge-yellow {
  background-color: #c07b2a;
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
