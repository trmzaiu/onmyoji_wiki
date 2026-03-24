<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { useTags } from "@/utils/useTags";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const supabase = useSupabase();

const onmyoji = ref(null);
const onmyojiList = ref([]);
const shikigamiList = ref([]);
const illustrations = ref([]);
const effects = ref([]);

const isEnglish = ref(true);

const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const showTooltip = ref(false);

const activeMainTab = ref(route.hash.replace("#", "") || "Main");
const activeTab = ref(route.params.name.replace(/_/g, " ").toLowerCase());
const activeSkinTab = ref(route.params.name.replace(/_/g, " ").toLowerCase());

const formattedName = route.params.name.replace(/_/g, " ");

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

const { tagMap, loadTags } = useTags();

const getImgUrl = (name) => `/assets/illustrations/${name.replace(/ /g, "_")}.jpg`;

const processTextWithTooltips = (text) => {
  if (!text || !effects.value?.length) return text;

  // =========================================================
  // 0) Build lookup maps
  // =========================================================
  const processed = { value: text };

  const effectById = new Map(effects.value.map((e) => [String(e.id), e]));
  const effectMap = new Map(); // name (lowercase) -> effect note
  const effectKeywordOverrides = new Map(); // effectId -> display keyword (after <n> replace)

  const colorMap = {
    red: "#a63f37",
    blue: "#4994d4",
    yellow: "#c07b2a",
  };

  const addEffectNameToMap = (note) => {
    const names = [];
    if (note.name?.en) names.push(note.name.en);
    if (note.name?.vn && note.name.vn !== note.name.en) names.push(note.name.vn);
    if (note.name?.cn && note.name.cn !== note.name.en && note.name.cn !== note.name.vn) {
      names.push(note.name.cn);
    }

    names.forEach((name) => {
      const key = name?.toLowerCase();
      if (key && !effectMap.has(key)) effectMap.set(key, note);
    });
  };

  // Build effectMap including subs
  effects.value.forEach((note) => {
    addEffectNameToMap(note);
    note.subs?.forEach((subId) => {
      const sub = effectById.get(String(subId));
      if (sub) addEffectNameToMap(sub);
    });
  });

  // =========================================================
  // 1) Helpers: Entities (Shikigami / Onmyoji)
  // =========================================================
  const replaceShikigami = (match, id) => {
    if (!shikigamiList?.value?.length) return match;
    const shiki = shikigamiList.value.find((s) => String(s.id) === String(id));
    if (!shiki) return match;

    const name = isEnglish.value
      ? shiki.name?.en || ""
      : shiki.name?.vn || shiki.name?.en || "";
    return `<span class="entity shikigami">${name}</span>`;
  };

  const replaceOnmyoji = (match, id) => {
    if (!onmyojiList?.value?.length) return match;
    const onm = onmyojiList.value.find((o) => String(o.id) === String(id));
    if (!onm) return match;

    const name = isEnglish.value
      ? onm.name?.en || ""
      : onm.name?.vn || onm.name?.en || "";
    return `<span class="entity onmyoji">${name}</span>`;
  };

  // =========================================================
  // 2) Helpers: Skills (current shikigami / referenced shikigami)
  // =========================================================
  // Tag: <c|m|o>index</c|m|o>  (skill index of current shikigami)
  const replaceSkill = (match, content, type) => {
    const index = parseInt(content, 10);
    if (isNaN(index) || !onmyoji.value?.skills?.length) return match;

    const skill = onmyoji.value.skills[index - 1];
    if (!skill) return match;

    const name = isEnglish.value
      ? skill.name?.en || ""
      : skill.name?.vn || skill.name?.en || "";
    if (type === "c")
      return `<span class="skill-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${name}">${name}</span>`;
    if (type === "m") return `<span class="skill-keyword text-[#c07b2a]">${name}</span>`;
    if (type === "o") return `<span>${name}</span>`;
    return match;
  };

  // Tag: <d|p>shikiId-skillIndex</d|p> (skill of another shikigami by id)
  const replaceSkillRef = (match, content, type) => {
    const [shikiIdStr, skillIndexStr] = String(content).split("-");
    const shikiId = parseInt(shikiIdStr, 10);
    const skillIndex = parseInt(skillIndexStr, 10);
    if (isNaN(shikiId) || isNaN(skillIndex) || !shikigamiList?.value?.length)
      return match;

    const shiki = shikigamiList.value.find((s) => String(s.id) === String(shikiId));
    if (!shiki?.skills?.length) return match;

    const skill = shiki.skills[skillIndex - 1];
    if (!skill) return match;

    const name = isEnglish.value
      ? skill.name?.en || ""
      : skill.name?.vn || skill.name?.en || "";

    if (type === "d")
      return `<span class="skill-keyword text-[#c07b2a] font-bold cursor-pointer" data-keyword="${name}">${name}</span>`;
    if (type === "p") return `<span class="skill-keyword text-[#c07b2a]">${name}</span>`;
    return match;
  };

  // =========================================================
  // 3) Helpers: Skins
  // =========================================================
  // Tag: <q>index</q>
  const replaceSkin = (match, content) => {
    const index = parseInt(content, 10);
    if (isNaN(index) || !onmyoji.value?.skins?.length) return match;

    const skin =
      onmyoji.value.rarity !== "SP"
        ? onmyoji.value.skins[index + 1]
        : onmyoji.value.skins[index];

    if (!skin) return match;

    let name = "";
    let extraClass = "";

    if (isEnglish.value) {
      if (skin.name?.en) name = skin.name.en;
      else if (skin.name?.cn) {
        name = skin.name.cn;
        extraClass = "lang-zh";
      }
    } else {
      name = skin.name?.vn || "";
      if (!name && skin.name?.cn) {
        name = skin.name.cn;
        extraClass = "lang-zh";
      }
    }

    return `<span class="${extraClass}">${name}</span>`;
  };

  // =========================================================
  // 4) Helpers: Effects tooltip/highlight
  // =========================================================
  const resolveEffectNote = (content) => {
    if (/^\d+$/.test(content)) return effectById.get(content);
    return effectMap.get(content.toLowerCase());
  };

  const replaceEffect = (match, content, type, hasIng = false) => {
    const note = resolveEffectNote(content);
    if (!note) return match;

    const noteDesc = isEnglish.value ? note.description?.en : note.description?.vn;
    const color = note.color ? colorMap[note.color] || "#a51919" : "#a51919";

    let keywordForDisplay;
    let keywordForTooltip;

    if (type === "b" || type === "h") {
      let override;
      const queue = effectKeywordOverrides.get(String(note.id));

      if (queue && queue.length) {
        override = queue.shift(); // 👈 lấy đúng thứ tự
      }
      keywordForDisplay =
        override ?? (isEnglish.value ? note.name?.en : note.name?.vn || note.name?.en);
      keywordForTooltip = isEnglish.value
        ? note.name?.en
        : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
    } else {
      keywordForDisplay = isEnglish.value
        ? note.name?.en
        : note.name?.vn?.replace("{count}", "").trim() || note.name?.en;
      keywordForTooltip = keywordForDisplay;
    }

    let keyword = keywordForDisplay || "";

    // grammar / casing rules
    if (type === "f" || type === "l") {
      if (keyword.startsWith("HP ")) keyword = "HP " + keyword.slice(3).toLowerCase();
      else if (keyword.toUpperCase() === "HP") keyword = "HP";
      else keyword = keyword.toLowerCase();
    }
    if (type === "g") {
      keyword = keyword.toLowerCase();
      keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
    if (hasIng) keyword = addIngForm(keyword);

    // Tooltip only for <b>
    if (type === "b") {
      return `<span class="effect-tooltip"
        data-id="${note.id}"
        data-name="${keywordForTooltip || ""}"
        data-name-cn="${note.name?.cn || ""}"
        data-desc="${noteDesc ? noteDesc.replace(/"/g, "&quot;") : ""}"
        data-img='${JSON.stringify(note.images || [])}'
        data-color="${color}"
        style="color:${color}">${keyword}</span>`;
    }

    // Highlight or plain spans
    if (type === "i" || type === "l") return `<span>${keyword}</span>`;
    return `<span class="effect-highlight" style="color:${color}">${keyword}</span>`;
  };

  // =========================================================
  // 5) Step A: Preprocess effect keyword overrides: <b|h>id</b|h><n>count</n>
  // =========================================================
  processed.value = processed.value.replace(
    /<(b|a|h)>(\d+)<\/\1>(?:<n>([\s\S]*?)<\/n>)?/g,
    (match, tag, id, nValue) => {
      const note = effectById.get(String(id));
      if (!note) return match;

      const textEN = note.name?.en || "";
      const textVN = (note.name?.vn || "").replace(/\{count\}/g, nValue ?? "").trim();

      const value = isEnglish.value ? textEN : textVN;

      // 👇 push vào array thay vì overwrite
      if (!effectKeywordOverrides.has(String(id))) {
        effectKeywordOverrides.set(String(id), []);
      }
      effectKeywordOverrides.get(String(id)).push(value);

      return `<${tag}>${id}</${tag}>`; // ✅ giữ nguyên format
    }
  );

  // remove leftover <n>
  processed.value = processed.value.replace(/<n>.*?<\/n>/g, "");

  // =========================================================
  // 6) Step B: Special tags (icons / entities / skills / skins)
  // =========================================================
  // <e>iconKey</e>
  processed.value = processed.value.replace(
    /<e>(.*?)<\/e>/g,
    (_, keyword) =>
      `<img src="/assets/effects/${keyword}.webp" alt="${keyword}" class="inline-block w-6 h-6 align-text-bottom rounded rounded-md" />`
  );

  // Entities:
  // <k>id</k>  => Shikigami
  // <r>id</r>  => Onmyoji
  processed.value = processed.value
    .replace(/<k>(.*?)<\/k>/g, (m, id) => replaceShikigami(m, id))
    .replace(/<r>(.*?)<\/r>/g, (m, id) => replaceOnmyoji(m, id));

  // Skills:
  // <d>shikiId-skillIndex</d> clickable
  // <p>shikiId-skillIndex</p> non-clickable
  processed.value = processed.value.replace(/<(d|p)>(.*?)<\/\1>/g, (m, type, content) =>
    replaceSkillRef(m, content, type)
  );

  // Current shikigami skills:
  // <c>1</c> clickable
  // <m>1</m> normal highlight
  // <o>1</o> plain
  processed.value = processed.value.replace(/<(c|m|o)>(.*?)<\/\1>/g, (m, type, content) =>
    replaceSkill(m, content, type)
  );

  // Skin:
  // <q>index</q>
  processed.value = processed.value.replace(/<q>(.*?)<\/q>/g, (m, content) =>
    replaceSkin(m, content)
  );

  // =========================================================
  // 7) Step C: Effects tags (tooltip/highlight)
  // =========================================================
  // <b>idOrName</b> tooltip
  // <a|f|g|h|i|l>idOrName</...> highlight / plain
  processed.value = processed.value.replace(
    /<(f|g|b|a|h|i|l)>(.*?)<\/\1>/g,
    (match, type, content, offset, fullString) => {
      const after = fullString.slice(offset + match.length);
      const hasIng = after.startsWith("ing");
      return replaceEffect(match, content, type, hasIng);
    }
  );

  return processed.value;
};

function changeMainTab(tab) {
  activeMainTab.value = tab;

  history.replaceState(null, "", `${window.location.pathname}#${tab}`);
}

const imgs = computed(() => tooltipData.value?.images || []);

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

  const rootId = tooltipData.value.id; // ✅ phải có
  const subs = findNotes(tooltipData.value.description, new Set([rootId]));

  const subIds = new Set(subs.map((s) => s.id));

  return subs.map((sub) => {
    const exclude = new Set([rootId, ...subIds, sub.id]); // chặn root + các sub + self
    const subNotes = findNotes(sub.description, exclude);
    return { ...sub, subNotes };
  });
});

// Mouse event handlers for tooltip
const handleMouseEnter = (e) => {
  const target = e.currentTarget;
  tooltipData.value = {
    id: Number(target.getAttribute("data-id")),
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

async function fetchAllEffects() {
  const { data, error } = await supabase
    .from("Effect")
    .select("*")
    .order("id", { ascending: true });
  if (error) console.error("Error fetching effects:", error);
  else effects.value = data;
}

async function fetchOnmyoji() {
  const { data, error } = await supabase
    .from("Onmyoji")
    .select("*")
    .eq("name->>en", formattedName)
    .single();

  if (error) {
    console.error("Error fetching onmyoji:", error);
  } else {
    onmyoji.value = data;
    await nextTick();
    addTooltipListeners();
  }
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

async function fetchIllustrations(onmyojiId) {
  const { data, error } = await supabase
    .from("Illustration")
    .select("*")
    .contains("onmyoji", [onmyojiId])
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching illustrations:", error);
  } else {
    illustrations.value = data;
  }
}

onMounted(async () => {
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const saved = localStorage.getItem("lang");
  if (saved) {
    isEnglish.value = saved === "en";
  }

  document.title = `${formattedName}`;
  await fetchAllEffects();
  await fetchOnmyoji();
  await loadTags();
  await fetchAllOnmyoji();
  await fetchAllShikigami();
});

async function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    console.log("Tab active → reconnect realtime");

    // refresh data
    await fetchAllEffects();
    await fetchIllustrations(onmyoji.value?.id);
  }
}

watch(tooltipData, (val) => {
  console.log("tooltipData:", val);
});

watch(
  () => route.hash,
  (hash) => {
    activeMainTab.value = hash.replace("#", "") || "Main";
  }
);

watch(isEnglish, (val) => {
  localStorage.setItem("lang", val ? "en" : "vn");
});

// Watch for language changes to update tooltips
watch(isEnglish, async () => {
  await nextTick();
  removeTooltipListeners();
  addTooltipListeners();
});

watch(activeMainTab, async (newTab) => {
  if (newTab === "Gallery" && illustrations.value.length === 0) {
    await fetchIllustrations(onmyoji.value?.id);
  }
});
</script>

<template>
  <div v-if="onmyoji">
    <div class="content-section flex flex-col gap-4">
      <!-- Name -->
      <div class="header-row">
        <div class="character-title">{{ onmyoji.name.en }}</div>
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
          <div class="flex justify-center items-center">
            <img
              :src="`/assets/onmyoji/images/${route.params.name}.webp`"
              :alt="onmyoji.name.en"
              class="max-h-full max-w-full object-contain transition-opacity hover:scale-115 transition-transform duration-300"
            />
          </div>
        </div>

        <!-- Name -->
        <div class="flex justify-end w-1/3 max-h-[400px]">
          <table class="w-full">
            <thead>
              <tr class="table-title">
                <th class="p-2" colspan="4">
                  {{ onmyoji.name.jp[1] }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="table-row table-row-limit-long">
                <td class="px-4 py-2">
                  <strong>CN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-zh">{{ onmyoji.name.cn[0] }}</div>
                  <div>{{ onmyoji.name.cn[1] }}</div>
                </td>
              </tr>
              <tr class="table-row table-row-limit-long">
                <td class="px-4 py-2">
                  <strong>JP</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-zh">{{ onmyoji.name.jp[0] }}</div>
                  <div>{{ onmyoji.name.jp[1] }}</div>
                </td>
              </tr>
              <tr class="table-row table-row-limit">
                <td class="px-4 py-2">
                  <strong>GL</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ onmyoji.name.en }}</div>
                </td>
              </tr>
              <tr class="table-row table-row-limit">
                <td class="px-4 py-2">
                  <strong>VN</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div class="lang-vi">{{ onmyoji.name.vn }}</div>
                </td>
              </tr>
              <tr>
                <td class="table-title-row text-xs p-2 h-10" colspan="4">Voice Actor</td>
              </tr>
              <tr class="table-row table-row-limit">
                <td class="px-4 py-2">
                  <strong>JP</strong>
                </td>
                <td class="px-4 py-2" colspan="3">
                  <div>{{ onmyoji.name.va }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        class="flex border-b border-gray-300 mt-5"
        :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
      >
        <button
          class="flex py-2 px-4 text-center"
          :class="
            activeMainTab === 'Main'
              ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
              : 'text-[#a3a3a3] cursor-pointer'
          "
          @click="changeMainTab('Main')"
        >
          {{ isEnglish ? "Main" : "Chính Điện" }}
        </button>
        <button
          class="flex py-2 px-4 text-center"
          :class="
            activeMainTab === 'Gallery'
              ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
              : 'text-[#a3a3a3] cursor-pointer'
          "
          @click="changeMainTab('Gallery')"
        >
          {{ isEnglish ? "Gallery" : "Hoạ Phòng" }}
        </button>
        <button
          class="flex py-2 px-4 text-center"
          :class="
            activeMainTab === 'Dialogue'
              ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
              : 'text-[#a3a3a3] cursor-pointer'
          "
          @click="changeMainTab('Dialogue')"
        >
          {{ isEnglish ? "Dialogue" : "Lời Thoại" }}
        </button>
      </div>

      <div
        class="w-full"
        v-show="activeMainTab === 'Main'"
        :class="[
          activeMainTab === 'Main' ? 'opacity-100' : 'opacity-0',
          isEnglish ? 'lang-en' : 'lang-vi',
        ]"
      >
        <!-- Stats -->
        <h2 class="session-title">
          {{ isEnglish ? "Stats" : "Chỉ số" }}
        </h2>
        <div class="mt-2" style="display: block">
          <table class="stats" style="padding: 0 20px; border-bottom: 1px solid #a51919">
            <tbody>
              <tr class="" style="color: #a51919">
                <th></th>
                <th></th>
                <th colspan="2">
                  <div class="font-bold">
                    <br />
                    Level 60
                  </div>
                </th>
                <th colspan="2">
                  <div class="font-bold">
                    With Level <br />
                    40 Totem
                  </div>
                </th>
                <th></th>
                <th></th>
              </tr>
              <tr style="color: #a51919">
                <th></th>
                <th></th>

                <!-- Icon thường -->
                <th colspan="2" style="position: relative">
                  <figure
                    style="
                      position: absolute;
                      top: -5px;
                      left: 50%;
                      transform: translateX(-50%);
                    "
                  >
                    <img
                      :src="`/assets/onmyoji/icons/${route.params.name}_Icon.webp`"
                      :alt="onmyoji.name.jp[1]"
                      style="
                        object-fit: contain;
                        border: 1px solid #a51919;
                        padding: 4px;
                        background: #fff;
                        max-width: none;
                      "
                      width="90"
                      @error="(event) => (event.target.src = '/assets/Unknown_Icon.webp')"
                    />
                  </figure>
                </th>

                <!-- Icon evo -->
                <th colspan="2" style="position: relative">
                  <figure
                    style="
                      position: absolute;
                      top: -5px;
                      left: 50%;
                      transform: translateX(-50%);
                    "
                  >
                    <img
                      :src="`/assets/onmyoji/icons/${route.params.name}_Icon2.webp`"
                      :alt="onmyoji.name.jp[1]"
                      style="
                        object-fit: contain;
                        border: 1px solid #a51919;
                        padding: 4px;
                        background: #fff;
                        max-width: none;
                      "
                      width="90"
                      @error="(event) => (event.target.src = '/assets/Unknown_Icon.webp')"
                    />
                  </figure>
                </th>

                <th></th>
                <th></th>
              </tr>

              <tr>
                <th colspan="1">&nbsp;</th>
              </tr>

              <tr
                style="
                  color: #a51919;
                  border-left: 1px solid #a51919;
                  border-top: 1px solid #a51919;
                  border-right: 1px solid #a51919;
                "
              >
                <th colspan="1">&nbsp;</th>
              </tr>

              <!-- ATK -->
              <tr style="color: #a51919; border-left: 1px solid #a51919">
                <th></th>
                <th class="label-cell p-2">
                  <img src="/assets/stats/ATK.webp" alt="ATK" />
                  ATK
                </th>

                <td></td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">
                    {{ onmyoji.stats.ATK[0] }}
                  </div>
                </td>

                <td></td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">
                    {{ onmyoji.stats.ATK[1] }}
                  </div>
                </td>

                <td>
                  <div class="flex justify-start">
                    +{{ onmyoji.stats.ATK[1] - onmyoji.stats.ATK[0] }}
                  </div>
                </td>
                <td style="border-right: 1px solid #a51919"></td>
              </tr>

              <!-- HP -->
              <tr style="color: #a51919; border-left: 1px solid #a51919">
                <th></th>
                <th class="label-cell">
                  <img src="/assets/stats/HP.webp" alt="HP" />
                  HP
                </th>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">
                    {{ onmyoji.stats.HP[0] }}
                  </div>
                </td>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">
                    {{ onmyoji.stats.HP[1] }}
                  </div>
                </td>

                <td>
                  <div class="flex justify-start">
                    +{{ onmyoji.stats.HP[1] - onmyoji.stats.HP[0] }}
                  </div>
                </td>
                <td style="border-right: 1px solid #a51919"></td>
              </tr>

              <!-- DEF -->
              <tr style="color: #a51919; border-left: 1px solid #a51919">
                <th></th>
                <th class="label-cell">
                  <img src="/assets/stats/DEF.webp" alt="DEF" />
                  DEF
                </th>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">
                    {{ onmyoji.stats.DEF[0] }}
                  </div>
                </td>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">
                    {{ onmyoji.stats.DEF[1] }}
                  </div>
                </td>

                <td>
                  <div class="flex justify-start">
                    +{{ onmyoji.stats.DEF[1] - onmyoji.stats.DEF[0] }}
                  </div>
                </td>
                <td style="border-right: 1px solid #a51919"></td>
              </tr>

              <!-- SPD -->
              <tr style="color: #a51919; border-left: 1px solid #a51919">
                <th></th>
                <th class="label-cell">
                  <img src="/assets/stats/SPD.webp" alt="SPD" />
                  SPD
                </th>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">
                    {{ onmyoji.stats.SPD[0] }}
                  </div>
                </td>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">
                    {{ onmyoji.stats.SPD[1] }}
                  </div>
                </td>

                <td>
                  <div class="flex justify-start">
                    +{{ onmyoji.stats.SPD[1] - onmyoji.stats.SPD[0] }}
                  </div>
                </td>
                <td style="border-right: 1px solid #a51919"></td>
              </tr>

              <!-- Crit -->
              <tr style="color: #a51919; border-left: 1px solid #a51919">
                <th></th>
                <th class="label-cell">
                  <img src="/assets/stats/CRIT.webp" alt="CRIT" />
                  Crit
                </th>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">{{ onmyoji.stats.Crit[0] }}%</div>
                </td>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">{{ onmyoji.stats.Crit[1] }}%</div>
                </td>

                <td>
                  <div class="flex justify-start">
                    +{{ onmyoji.stats.Crit[1] - onmyoji.stats.Crit[0] }}%
                  </div>
                </td>
                <td style="border-right: 1px solid #a51919"></td>
              </tr>

              <!-- CDMG -->
              <tr style="color: #a51919; border-left: 1px solid #a51919">
                <th></th>
                <th class="label-cell">
                  <img src="/assets/stats/CDMG.webp" alt="CDMG" />
                  Crit DMG
                </th>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">150%</div>
                </td>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">150%</div>
                </td>

                <td>
                  <div class="flex justify-start">+0%</div>
                </td>
                <td style="border-right: 1px solid #a51919"></td>
              </tr>

              <!-- HIT -->
              <tr style="color: #a51919; border-left: 1px solid #a51919">
                <th></th>
                <th class="label-cell">
                  <img src="/assets/stats/HIT.webp" alt="HIT" />
                  Effects HIT
                </th>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">0%</div>
                </td>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">0%</div>
                </td>

                <td>
                  <div class="flex justify-start">+0%</div>
                </td>
                <td style="border-right: 1px solid #a51919"></td>
              </tr>

              <!-- RES -->
              <tr style="color: #a51919; border-left: 1px solid #a51919">
                <th></th>
                <th class="label-cell" style="border-bottom: none">
                  <img src="/assets/stats/RES.webp" alt="RES" />
                  Effects RES
                </th>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">0%</div>
                </td>

                <td>&nbsp;</td>
                <td class="centered-number w-[100px]">
                  <div class="flex justify-start">0%</div>
                </td>

                <td>
                  <div class="flex justify-start">+0%</div>
                </td>
                <td style="border-right: 1px solid #a51919"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Skill -->
        <h2
          class="session-title mt-5"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
          {{ isEnglish ? "Skills" : "Kĩ năng" }}
        </h2>
        <div
          v-for="(skill, index) in onmyoji.skills"
          :key="index"
          style="
            position: relative;
            padding-left: 40px;
            margin-bottom: 20px;
            margin-top: 20px;
          "
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
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
              class="skill-icon"
            >
              <img
                :src="`/assets/onmyoji/skills/${route.params.name}_Skill${
                  index + 1
                }.webp`"
                :alt="skill.name.en"
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
                  {{ isEnglish ? skill.name.en : skill.name.vn }}
                </span>
                <span class="sub-name lang-zh">
                  ({{ skill.name.cn }}/{{ skill.name.jp }})
                </span>
              </div>
            </span>
          </div>
          <div style="padding: 10px 25px; border: 1px solid #a51919">
            <div class="text-black pb-5 skill-header">
              <div class="skill-info flex">
                <span style="margin-left: 25px">
                  <b>{{ isEnglish ? "Type" : "Loại" }}:</b> {{ skill.type }}
                </span>
                <span class="flex" style="margin-left: 40px">
                  <b>{{ isEnglish ? "Onibi" : "Quỷ hoả" }}:</b>
                  <img src="/assets/Onibi.webp" alt="Onibi" />
                  0
                </span>
                <span style="margin-left: 25px">
                  <b>{{ isEnglish ? "Cooldown" : "Hồi chiêu" }}:</b>
                  {{ skill.cooldown }}
                </span>
              </div>
              <div class="skill-badges flex flex-wrap gap-2">
                <div
                  v-for="tagId in skill.tags"
                  :key="tagId"
                  class="relative inline-flex items-center justify-center w-20 h-8 overflow-visible rounded-md text-center"
                >
                  <!-- brush nền -->
                  <div
                    class="absolute inset-0 tint-base"
                    :class="'tint-' + (tagMap?.[tagId]?.color || 'grey')"
                  ></div>

                  <!-- chữ đè lên -->
                  <span
                    class="relative z-10 text-xs text-white break-words"
                    style="line-height: 10px"
                  >
                    {{ tagMap?.[tagId]?.name }}
                  </span>
                </div>
              </div>
            </div>
            <hr style="border: none; border-top: 1px solid #a51919; margin: 8px 0" />
            <p
              class="text-justify whitespace-pre-line"
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
                  processTextWithTooltips(isEnglish ? skill.levels.en : skill.levels.vn)
                "
              ></p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-show="activeMainTab === 'Gallery'"
        :class="[
          activeMainTab === 'Gallery' ? 'opacity-100' : 'opacity-0',
          isEnglish ? 'lang-en' : 'lang-vi',
        ]"
      >
        <!-- Skins -->
        <h2
          class="session-title"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
          {{ isEnglish ? "Skins" : "Ngoại hình" }}
        </h2>

        <div class="w-full">
          <div class="flex border-b border-gray-300 mb-4 mt-2">
            <button
              class="flex py-2 px-4 text-center"
              :class="
                activeTab === onmyoji.name.en.toLowerCase()
                  ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
                  : 'text-[#a3a3a3] cursor-pointer'
              "
              @click="activeTab = onmyoji.name.en.toLowerCase()"
            >
              {{ onmyoji.name.en }}
            </button>
            <button
              class="flex py-2 px-4 text-center"
              :class="
                activeTab === onmyoji.totem[0].name.en.toLowerCase()
                  ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
                  : 'text-[#a3a3a3] cursor-pointer'
              "
              @click="activeTab = onmyoji.totem[0].name.en.toLowerCase()"
            >
              {{ onmyoji.totem[0].name.en }}
            </button>
          </div>
        </div>

        <div
          v-show="activeTab === onmyoji.name.en.toLowerCase()"
          class="grid grid-cols-3 gap-5 mt-4"
          :class="[
            activeTab === onmyoji.name.en.toLowerCase() ? 'opacity-100' : 'opacity-0',
            isEnglish ? 'lang-en' : 'lang-vi',
          ]"
        >
          <div
            v-for="(skin, index) in onmyoji.skins"
            :key="index"
            class="flex flex-col items-center"
            :title="skin.name.en || skin.name.cn"
          >
            <img
              :src="
                index === 0
                  ? `/assets/onmyoji/images/${route.params.name}.webp`
                  : `/assets/onmyoji/skins/${route.params.name}_Skin${index}.webp`
              "
              :alt="skin.name.en || skin.name.cn"
              @click="
                openModal(
                  index === 0
                    ? `/assets/onmyoji/images/${route.params.name}.webp`
                    : `/assets/onmyoji/skins/${route.params.name}_Skin${index}.webp`
                )
              "
              class="w-full h-80 object-contain hover:scale-110 transition-transform duration-300 overflow-visible"
            />
            <p class="mt-4 text-center font-medium text-black">
              {{ isEnglish ? skin.name.en || skin.name.cn : skin.name.vn }}
            </p>
          </div>
        </div>

        <div
          v-show="activeTab === onmyoji.totem[0].name.en.toLowerCase()"
          class="grid grid-cols-3 gap-5 mt-4"
          :class="[
            activeTab === onmyoji.totem[0].name.en.toLowerCase()
              ? 'opacity-100'
              : 'opacity-0',
            isEnglish ? 'lang-en' : 'lang-vi',
          ]"
        >
          <div
            v-for="(skin, index) in onmyoji.totem"
            :key="index"
            class="flex flex-col items-center"
            :title="skin.name.en || skin.name.cn"
          >
            <img
              :src="`/assets/onmyoji/totems/${onmyoji.totem[0].name.en}_Skin${
                index + 1
              }.webp`"
              :alt="skin.name.en || skin.name.cn"
              @click="
                openModal(
                  `/assets/onmyoji/totems/${onmyoji.totem[0].name.en}_Skin${
                    index + 1
                  }.webp`
                )
              "
              class="w-full h-80 object-contain hover:scale-110 transition-transform duration-300 overflow-visible"
            />
            <p
              class="mt-4 text-center font-medium text-black"
              :class="{ 'lang-zh': isEnglish ? !skin.name.en && skin.name.cn : false }"
            >
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
          <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>

          <!-- Modal content -->
          <div class="relative z-10 bg-white max-w-3xl w-full p-4 rounded-lg shadow-2xl">
            <button
              class="absolute top-2 right-3 text-black text-[40px] cursor-pointer"
              @click="closeModal"
            >
              ✕
            </button>
            <img :src="selectedImage" alt="Skin Preview" class="w-full h-auto" />
          </div>
        </div>

        <!-- Skins Info -->
        <h2
          class="session-title mt-5"
          :class="{ 'lang-en': isEnglish, 'lang-vi': !isEnglish }"
        >
          {{ isEnglish ? "Skins Info" : "Thông tin ngoại hình" }}
        </h2>

        <div class="w-full">
          <div class="flex border-b border-gray-300 mb-4 mt-2">
            <button
              class="flex py-2 px-4 text-center"
              :class="
                activeSkinTab === onmyoji.name.en.toLowerCase()
                  ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
                  : 'text-[#a3a3a3] cursor-pointer'
              "
              @click="activeSkinTab = onmyoji.name.en.toLowerCase()"
            >
              {{ onmyoji.name.en }}
            </button>
            <button
              class="flex py-2 px-4 text-center"
              :class="
                activeSkinTab === onmyoji.totem[0].name.en.toLowerCase()
                  ? 'border-b-2 border-[#a51919] text-[#a51919] font-semibold'
                  : 'text-[#a3a3a3] cursor-pointer'
              "
              @click="activeSkinTab = onmyoji.totem[0].name.en.toLowerCase()"
            >
              {{ onmyoji.totem[0].name.en }}
            </button>
          </div>
        </div>

        <table
          v-show="activeSkinTab === onmyoji.name.en.toLowerCase()"
          class="w-full"
          :class="
            activeSkinTab === onmyoji.name.en.toLowerCase() ? 'opacity-100' : 'opacity-0'
          "
          style="border: 1px solid #a51919"
        >
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
            <tr class="text-black" v-for="(skin, index) in onmyoji.skins" :key="index">
              <td
                class="px-2 py-1 text-center w-[105px]"
                style="border: 1px solid #a51919"
              >
                <img
                  :src="`/assets/onmyoji/skinsInfo/${route.params.name}_SkinInfo${index}.webp`"
                  :alt="skin.name.en || skin.name.cn"
                  class="w-24 h-24 object-contain mx-auto"
                />
              </td>
              <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
                <div>{{ skin.name.en }}</div>
                <div>
                  <span class="lang-zh">{{ skin.name.cn }}</span>
                  {{ index === 0 ? "" : "-" }}
                  <span class="lang-vi">{{ skin.name.vn }}</span>
                </div>
              </td>
              <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
                <span class="lang-zh">{{ skin.artist }}</span>
              </td>
              <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
                {{ skin.obtained }}
              </td>
            </tr>
          </tbody>
        </table>

        <table
          v-show="activeSkinTab === onmyoji.totem[0].name.en.toLowerCase()"
          class="w-full"
          :class="
            activeSkinTab === onmyoji.totem[0].name.en.toLowerCase()
              ? 'opacity-100'
              : 'opacity-0'
          "
          style="border: 1px solid #a51919"
        >
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
            <tr class="text-black" v-for="(skin, index) in onmyoji.totem" :key="index">
              <td
                class="px-2 py-1 text-center w-26 w-[105px]"
                style="border: 1px solid #a51919"
              >
                <img
                  :src="`/assets/onmyoji/totemsInfo/${onmyoji.totem[0].name.en}_SkinInfo${
                    index + 1
                  }.webp`"
                  :alt="skin.name.en || skin.name.cn"
                  class="w-24 h-24 object-contain mx-auto"
                />
              </td>
              <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
                <div>{{ skin.name.en }}</div>
                <div>
                  <span class="lang-zh">{{ skin.name.cn }}</span> -
                  <span class="lang-vi">{{ skin.name.vn }}</span>
                </div>
              </td>
              <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
                <span class="lang-zh">{{ skin.artist }}</span>
              </td>
              <td class="px-2 py-1 text-center" style="border: 1px solid #a51919">
                {{ skin.obtained }}
              </td>
            </tr>
          </tbody>
        </table>

        <h2 class="session-title mt-5">
          {{ isEnglish ? "Illustrations" : "Hoạ Ảnh" }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 mt-4">
          <div
            v-for="(img, index) in illustrations"
            :key="index"
            class="overflow-hidden shadow-md relative aspect-video"
          >
            <img
              :src="getImgUrl(img.name)"
              :alt="img.name"
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              :title="img.name"
              @click="openModal(getImgUrl(img.name))"
            />
            <div
              class="absolute bottom-3 right-5 bg-gradient-to-b from-white to-gray-200 text-black font-bold text-sm px-4 py-1 border border-gray-400 shadow-md"
            >
              {{ img.name }}
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
          class="tooltip-img rounded rounded-sm"
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
          <div v-for="sub in matchedSubNotes" :key="sub.id" class="subnote-block">
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
              <div v-for="subsub in sub.subNotes" :key="subsub.id" class="subnote-block">
                <div class="subnote-title">
                  {{ isEnglish ? subsub.name.en : subsub.name.vn }}
                  <span class="lang-zh">({{ subsub.name.cn }})</span>
                </div>

                <img
                  v-if="subsub.images"
                  v-for="(img, k) in subsub.images"
                  :key="k"
                  :src="'/assets/effects/' + img + '.webp'"
                  :alt="img"
                  class="rounded rounded-sm"
                  style="width: 32px; height: 32px; margin-bottom: 8px"
                />

                <div
                  class="subnote-description"
                  v-html="
                    processTextWithTooltips(
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

<style>
.lang-zh {
  font-family: "stkaiti", sans-serif;
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

.table-row-limit {
  max-height: 60px;
  min-height: 40px;
}

.table-row-limit-long {
  max-height: 80px;
  min-height: 60px;
}

.session-title {
  color: #3a3a3a;
  font-size: 24px;
  font-weight: 500;
  overflow: auto;
  padding: 6px 0;
  border-bottom: 0.5px solid #9c9c9c;
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
