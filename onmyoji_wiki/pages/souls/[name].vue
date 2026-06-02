<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useSupabase } from "~/composables/useSupabase";

const route = useRoute();
const supabase = useSupabase();

const soul = ref(null);
const effects = ref([]);
const isEnglish = ref(true);
const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

const formattedName = route.params.name.replace(/_/g, " ");

function addIngForm(word) {
  if (word.endsWith("e")) {
    return word.slice(0, -1);
  }

  return word;
}

const statMap = {
  ATK: {
    en: "ATK Bonus 15%",
    vn: "Tăng 15% ATK",
  },
  DEF: {
    en: "DEF Bonus 30%",
    vn: "Tăng 30% DEF",
  },
  HP: {
    en: "HP Bonus 15%",
    vn: "Tăng 15% HP",
  },
  Crit: {
    en: "Crit +15%",
    vn: "Tăng 15% Crit",
  },
  RES: {
    en: "Effect RES +15%",
    vn: "Tăng 15% Effect RES",
  },
  HIT: {
    en: "Effect HIT +15%",
    vn: "Tăng 15% Effect HIT",
  },
  "Crit DMG": {
    en: "Crit DMG +20%",
    vn: "Tăng 20% Crit DMG",
  },
};

function getPiece2(type) {
  // ưu tiên data từ DB trước
  if (soul.value?.effects?.piece2) {
    return isEnglish.value ? soul.value.effects.piece2.en : soul.value.effects.piece2.vn;
  }

  // fallback theo type
  const stat = statMap[type];
  if (stat) {
    return isEnglish.value ? stat.en : stat.vn;
  }

  return null;
}

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

  processedText = processedText.replace(
    /<(b|a)>(\d+)<\/\1>(?:<n>(.*?)<\/n>)?/g,
    (match, tag, id, nValue) => {
      const note = effectById.get(id);
      if (!note) return match;

      let textVN = note.name?.vn;
      let textEN = note.name?.en;

      textVN = textVN.replace("{count}", nValue || "").trim();

      effectKeywordOverrides.set(id, isEnglish.value ? textEN : textVN);

      return `<${tag}>${id}</${tag}>`;
    }
  );

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
        : isEnglish.value
        ? note.name?.en
        : note.name?.vn || note.name?.en;
      keywordForTooltip = isEnglish.value
        ? note.name?.en
        : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
    } else {
      keywordForDisplay = isEnglish.value
        ? note.name?.en
        : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
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
      return type === "i" || type === "l"
        ? `<span>${keyword}</span>`
        : `<span class="effect-highlight" style="color:${color}">${keyword}</span>`;
    }
  };

  // === xử lý các tag đặc biệt ===
  processedText = processedText.replace(
    /<e>(.*?)<\/e>/g,
    (_, keyword) =>
      `<img src="/assets/effects/${keyword}.webp" alt="${keyword}" class="inline-block w-6 h-6 align-text-bottom rounded rounded-md" />`
  );

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

setInterval(async () => {
  if (document.visibilityState === "visible") {
    await fetchSoul();
  }
}, 5000);

let soulChannel = null;
let effectChannel = null;

function subscribeRealtime() {
  // --- Channel Soul ---
  if (!soulChannel) {
    soulChannel = supabase
      .channel("soul-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Soul" },
        async () => {
          await fetchSoul();
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

onMounted(async () => {
  document.title = `Soul - ${formattedName}`;
  await fetchSoul();
  await fetchAllEffects();
  await nextTick();
  addTooltipListeners();
  const saved = localStorage.getItem("lang");
  if (saved) {
    isEnglish.value = saved === "en";
  }
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
            class="h-auto w-[350px] object-contain hover:scale-110 transition-transform duration-300"
          />
        </div>

        <div class="flex justify-end w-1/3">
          <table class="border border-gray-400 text-sm w-full max-w-[300px]">
            <thead>
              <tr>
                <th class="border border-red table-title p-2 relative" colspan="4">
                  <div>{{ soul.name.en }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border border-red text-black">
                <td class="px-4 py-2" colspan="1">
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
              <tr>
                <td class="table-title-row" colspan="4">Effects</td>
              </tr>
              <tr v-if="soul.type !== 'Random Stat'" class="border border-red text-black">
                <td class="px-4 py-2 border border-red text-center" colspan="2">
                  <strong>Type</strong>
                  <div>{{ soul.type }}</div>
                </td>
                <td class="px-4 py-2 border border-red text-center" colspan="2">
                  <strong>Set 2</strong>
                  <div v-html="processTextWithTooltips(getPiece2(soul.type))"></div>
                </td>
              </tr>
              <tr v-else class="border border-red text-black">
                <td class="px-4 py-2 border border-red" colspan="4">
                  <strong>Type</strong>
                  <div>
                    <span>Increases a random base stat:</span>
                    <ul class="list-disc pl-5 mt-1">
                      <li>ATK Bonus 8%</li>
                      <li>DEF Bonus 16%</li>
                      <li>HP Bonus 8%</li>
                      <li>Crit +8%</li>
                      <li>Effect RES +8%</li>
                      <li>Effect HIT +8%</li>
                    </ul>
                  </div>
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

      <div
        v-if="soul.effects.piece2"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        <p
          class="ps-3 text-black"
          v-html="
            isEnglish
              ? processTextWithTooltips(soul.effects.piece2.en)
              : processTextWithTooltips(soul.effects.piece2.vn)
          "
        ></p>
      </div>

      <div
        v-if="soul.effects.piece4"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        <p
          class="ps-3 text-black"
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

      <ul
        class="px-3 list-disc pl-6 text-black"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        <li v-for="(item, index) in soul.obtainable" :key="index">
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
        {{ tooltipData.name }}
        <span class="lang-zh" v-if="tooltipData.cn">({{ tooltipData.cn }})</span>
      </div>
      <div v-if="imgs.length" class="tooltip-images pb-1">
        <img
          v-for="(img, i) in imgs"
          :key="i"
          :src="'/assets/effects/' + img + '.webp'"
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
              <span class="lang-zh" v-if="sub.name.cn">({{ sub.name.cn }})</span>
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
              v-html="
                processTextWithTooltips(
                  isEnglish ? sub.description.en : sub.description.vn
                )
              "
            ></div>

            <!-- Sub-SubNotes -->
            <div v-if="sub.subNotes && sub.subNotes.length" class="mt-2">
              <div v-for="(subsub, j) in sub.subNotes" :key="j" class="subnote-block">
                <div class="subnote-title">
                  {{ isEnglish ? subsub.name.en : subsub.name.vn }}
                  <span class="lang-zh" v-if="subsub.name.cn"
                    >({{ subsub.name.cn }})</span
                  >
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
                  v-html="
                    processBoldC(
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
  </div>
</template>
