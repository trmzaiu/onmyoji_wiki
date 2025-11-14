<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const supabase = useSupabase();

const soul = ref(null);
const effects = ref([]);
const isEnglish = ref(true);
const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

const formattedName = route.params.name.replace(/_/g, " ");

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

  processedText = processedText.replace(/<(b|a)>(\d+)<\/\1>(?:<n>(.*?)<\/n>)?/g, (match, tag, id, nValue) => {
    const note = effectById.get(id);
    if (!note) return match;

    let textVN = note.name?.vn;
    let textEN = note.name?.en;

    textVN = textVN.replace("{count}", nValue || "").trim();

    effectKeywordOverrides.set(id, isEnglish.value ? textEN : textVN);

    return `<${tag}>${id}</${tag}>`;
  });

  processedText = processedText.replace(/<n>.*?<\/n>/g, "");

  const replaceWithTooltip = (match, content, type, hasIng = false) => {
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
      const keywordOverride = effectKeywordOverrides.get(String(note.id));
      keywordForDisplay = keywordOverride
        ? keywordOverride
        : (isEnglish.value ? note.name?.en : note.name?.vn || note.name?.en);
      keywordForTooltip = isEnglish.value
        ? note.name?.en
        : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
    } else {
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

    if (hasIng) {
      keyword = addIngForm(keyword);
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

  // === xử lý các tag đặc biệt ===
  processedText = processedText
    .replace(/<e>(.*?)<\/e>/g, (_, keyword) =>
      `<img src="/assets/effects/${keyword}.webp" alt="${keyword}" class="inline-block w-6 h-6 align-text-bottom rounded rounded-md" />`
    )

  // f, g, b, a, h
  processedText = processedText.replace(
    /<(f|g|b|a|h|i|l)>(.*?)<\/\1>/g,
    (match, type, content, offset, fullString) => {
      const after = fullString.slice(offset + match.length);
      const hasIng = after.startsWith("ing");

      return replaceWithTooltip(match, content, type, hasIng);
    }
  );
  return processedText;
};

const imgs = computed(() => tooltipData.value?.images || []);

const processBoldC = (text) => {
  if (!text) return "";
  return text.replace(
    /<c>(.*?)<\/c>/g,
    (_, keyword) =>
      `<span class="c-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${keyword}">${keyword}</span>`
  );
};

const matchedSubNotes = computed(() => {
  if (!tooltipData.value || !effects.value?.length) return [];

  const effectById = new Map(effects.value.map((e) => [e.id, e]));

  const findNotes = (descObj) => {
    const result = [];
    const text =
      typeof descObj === "string"
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

  // subNotes của tooltip chính
  const subs = findNotes(tooltipData.value.description);

  // sub-subNotes của mỗi sub
  subs.forEach((sub, i) => {
    subs[i].subNotes = findNotes(sub.description);
  });

  return subs;
});

// Mouse event handlers for tooltip
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

const handleMouseLeave = () => {
  showTooltip.value = false;
  tooltipData.value = null;
};

const handleMouseMove = (event) => {
  if (showTooltip.value) {
    updateTooltipPosition(event);
  }
};

const updateTooltipPosition = (event) => {
  tooltipPosition.value = {
    x: event.clientX,
    y: event.clientY + 10,
  };
};

// Add event listeners to dynamically created tooltip spans
const addTooltipListeners = () => {
  const tooltipSpans = document.querySelectorAll(".effect-tooltip");
  tooltipSpans.forEach((span) => {
    span.addEventListener("mouseenter", handleMouseEnter);
    span.addEventListener("mouseleave", handleMouseLeave);
    span.addEventListener("mousemove", handleMouseMove);
  });
};

// Remove event listeners
const removeTooltipListeners = () => {
  const tooltipSpans = document.querySelectorAll(".effect-tooltip");
  tooltipSpans.forEach((span) => {
    span.removeEventListener("mouseenter", handleMouseEnter);
    span.removeEventListener("mouseleave", handleMouseLeave);
    span.removeEventListener("mousemove", handleMouseMove);
  });
};

async function fetchAllEffects() {
  const { data, error } = await supabase
    .from("Effect")
    .select("*")
    .order("id", { ascending: true });
  if (error) console.error("Error fetching effects:", error);
  else effects.value = data;
}

async function fetchSoul() {
  const { data, error } = await supabase
    .from("Soul")
    .select("*")
    .eq("name->>en", formattedName)
    .single();

  if (error) {
    console.error("Error fetching soul:", error);
  } else {
    soul.value = data;
    await nextTick();
    addTooltipListeners();
  }
}

onMounted(async () => {
  document.title = `Soul - ${formattedName}`;
  await fetchSoul();
  await fetchAllEffects();
  await nextTick();
  addTooltipListeners();
});

watch(tooltipData, (val) => {
  console.log("tooltipData:", val);
});

// Watch for language changes to update tooltips
watch(isEnglish, async () => {
  await nextTick();
  removeTooltipListeners();
  addTooltipListeners();
});
</script>

<template>
  <div v-if="soul">
    <div class="content-section flex flex-col gap-4">
      <div class="header-row">
        <div class="character-title">{{ soul.name.en }}</div>

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
        <div class="flex justify-center w-2/3">
          <img
            :src="`/assets/souls/images/${soul.name.en.replace(/ /g, '_')}.webp`"
            :alt="soul.name.en"
            class="max-h-[500px] object-contain hover:scale-110 transition-transform duration-300"
          />
        </div>

        <div class="flex justify-end w-1/3">
          <table
            class="border border-gray-400 text-sm w-full max-w-[300px] max-h-[500px]"
          >
            <thead>
              <tr>
                <th class="border border-red table-title p-2 relative" colspan="4">
                  <div>{{ soul.name.en }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border border-red text-black">
                <td class="px-4 py-2">
                  <strong>CN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-zh">{{ soul.name.cn[0] }}</div>
                  <div>{{ soul.name.cn[1] }}</div>
                </td>
              </tr>
              <tr class="border border-red text-black">
                <td class="px-4 py-2">
                  <strong>JP</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-zh">{{ soul.name.jp[0] }}</div>
                  <div>{{ soul.name.jp[1] }}</div>
                </td>
              </tr>
              <tr class="border border-red text-black">
                <td class="px-4 py-2">
                  <strong>GL</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ soul.name.en }}</div>
                </td>
              </tr>
              <tr class="border border-red text-black">
                <td class="px-4 py-2">
                  <strong>VN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-vi">{{ soul.name.vn }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Effects" : "Hiệu ứng" }}
      </h2>

      <div v-if="soul.effects.fixed" :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }">
        <h3 class="px-3 text-red">{{ isEnglish ? "Fixed Stat" : "Chỉ số cố định" }}:</h3>
        <p class="px-3 text-black">
          {{ isEnglish ? soul.effects.fixed.en : soul.effects.fixed.vn }}
        </p>
      </div>

      <div v-if="soul.effects.piece2" :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }">
        <h3 class="px-3 text-red">
          {{ isEnglish ? "2-Piece Set Effect" : "Hiệu ứng 2 mảnh" }}:
        </h3>
        <p class="px-3 text-black">
          {{ isEnglish ? soul.effects.piece2.en : soul.effects.piece2.vn }}
        </p>
      </div>

      <div v-if="soul.effects.piece4" :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }">
        <h3 class="px-3 text-red">
          {{ isEnglish ? "4-Piece Set Effect" : "Hiệu ứng 4 mảnh" }}:
        </h3>
        <p
          class="px-3 text-black"
          v-html="
            isEnglish
              ? processTextWithTooltips(soul.effects.piece4.en)
              : processTextWithTooltips(soul.effects.piece4.vn)
          "
        ></p>
      </div>

      <h2
        class="session-title mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        {{ isEnglish ? "Obtainable" : "Có thể nhận" }}
      </h2>

      <ul class="px-3 list-disc pl-6 text-black" :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }">
        <li
          v-for="(item, index) in soul.obtainable"
          :key="index"
        >
          {{ item }}
        </li>
      </ul>
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
      :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
    >
      <!-- Note chính -->
      <div class="tooltip-title" :style="{ color: tooltipData.color }">
        {{ tooltipData.name }} <span class="lang-zh" v-if="tooltipData.cn">({{ tooltipData.cn }})</span>
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
              {{ isEnglish ? sub.name.en : sub.name.vn }} <span class="lang-zh" v-if="sub.name.cn">({{ sub.name.cn }})</span>
            </div>
            <img
              v-if="sub.images"
              v-for="(img, i) in sub.images"
              :key="i"
              :src="'/assets/effects/' + img + '.webp'"
              :alt="img"
              style="width: 32px; height: 32px; margin-bottom: 8px"
            />
            <div
              class="subnote-description"
              v-html="processTextWithTooltips(isEnglish ? sub.description.en : sub.description.vn)"
            ></div>

            <!-- Sub-SubNotes -->
            <div v-if="sub.subNotes && sub.subNotes.length" class="mt-2">
              <div v-for="(subsub, j) in sub.subNotes" :key="j" class="subnote-block">
                <div class="subnote-title">
                  {{ isEnglish ? subsub.name.en : subsub.name.vn }} <span class="lang-zh" v-if="subsub.name.cn">({{ subsub.name.cn }})</span>
                </div>
                <img
                  v-if="subsub.images"
                  v-for="(img, k) in subsub.images"
                  :key="k"
                  :src="'/assets/effects/' + img + '.webp'"
                  :alt="img"
                  style="width: 32px; height: 32px; margin-bottom: 8px"
                />
                <div
                  class="subnote-description"
                  v-html="processBoldC(isEnglish ? subsub.description.en : subsub.description.vn)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
.lang-zh {
  font-family: "stkaiti", sans-serif;
  font-size: 16px;
}
.lang-en {
  font-family: "Rubik", sans-serif;
}
.lang-vi {
  font-family: "Nunito", serif;
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

.text-red {
  color: #a51919;
  font-weight: bold;
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
