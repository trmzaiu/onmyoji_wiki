<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { useShikigami } from "~/composables/useShikigami";

import { getOnmyojiByIds } from "~/services/onmyoji.service";
import { getShikigamiByIds } from "~/services/shikigami.service";

import {
  effectTagType,
  parseEffectDescription,
  parseEffectTags,
} from "~/utils/parser/effectParser";
import { renderBiographyText } from "~/utils/parser/renderBiographyText";
import { renderEvolutionText } from "~/utils/parser/renderEvolutionText";
import { parseSkillDescription } from "~/utils/parser/skillParser";

import {
  findSoulByIdName,
  findSoulByIdSlug,
  getRoleClass,
  getStatClass,
  parseRoles,
  parseStats,
  parseSubstats,
} from "~/utils/helper/buildHelper";
import {
  collectNestedEffects,
  getAllSkillEffectText,
  markFirstAppearances,
} from "~/utils/effectCollecter";
import { getStatRank, getStatRankImage } from "~/utils/helper/statHelper";

import ProfileSection from "~/components/ProfileSection.vue";
/* ---------------------- GLOBAL ---------------------- */
const route = useRoute();

const formattedName = computed(() => {
  return route.params.name.replace(/_/g, " ");
});

/* ---------------------- STATE ---------------------- */
const {
  shikigami,
  listShikigami,
  listOnmyoji,
  tagMap,
  effects,
  conditions,
  souls,
  illustrations,
  evolution,
  loadShikigami,
} = useShikigami();

const isEnglish = ref(true);

const activeTab = ref(route.hash.replace("#", "") || "Main");

// UI
const tooltipData = ref(null);

const activeSkillIndex = ref(0);

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

const collapsedEffects = ref(new Set());

const toggleEffectCard = (effectId) => {
  if (collapsedEffects.value.has(effectId)) {
    collapsedEffects.value.delete(effectId);
  } else {
    collapsedEffects.value.add(effectId);
  }

  collapsedEffects.value = new Set(collapsedEffects.value);
};

const isEffectCollapsed = (effectId) => collapsedEffects.value.has(effectId);

/* ---------------------- HELPERS ---------------------- */
const getIllustrationUrl = (name) =>
  `/assets/images/illustrations/${name.replace(/ /g, "_")}.jpg`;

/* ---------------------- RENDER ---------------------- */
const evolutionText = computed(() =>
  renderEvolutionText({
    evolutionData: shikigami.value?.evolution,
    evolutionTemplate: evolution.value,
    shikigami: shikigami.value,
    isEnglish: isEnglish.value,
  })
);

const conditionMap = computed(() => {
  return new Map((conditions.value || []).map((c) => [c.id, c]));
});

const bioShikigamiMap = ref(new Map());
const bioOnmyojiMap = ref(new Map());

const biographyText = (bio) =>
  renderBiographyText({
    biography: bio,
    conditionMap: conditionMap.value,
    shikigami: shikigami.value,
    shikigamiMap: bioShikigamiMap.value,
    onmyojiMap: bioOnmyojiMap.value,
    isEnglish: isEnglish.value,
  });

const skillShikigamiMap = computed(() => {
  return new Map((listShikigami.value || []).map((s) => [String(s.id), s]));
});

const skillOnmyojiMap = computed(() => {
  return new Map((listOnmyoji.value || []).map((o) => [String(o.id), o]));
});

const effectMap = computed(
  () => new Map((effects.value || []).map((e) => [String(e.id), e]))
);

const processedSkills = computed(() => {
  if (!shikigami.value?.skills?.length) {
    return [];
  }

  return shikigami.value.skills.map((skill) =>
    markFirstAppearances({
      skill,
      isEnglish: isEnglish.value,
    })
  );
});

const skillDescriptionText = (text, skillIndex) => {
  return parseSkillDescription({
    text,
    shikigami: shikigami.value,
    shikigamiMap: skillShikigamiMap.value,
    onmyojiMap: skillOnmyojiMap.value,
    effectMap: effectMap.value,
    isEnglish: isEnglish.value,
    currentSkillIndex: skillIndex,
  });
};

const currentSkillEffects = computed(() => {
  const skill = processedSkills.value?.[activeSkillIndex.value];

  if (!skill) {
    return [];
  }

  return collectNestedEffects({
    text: getAllSkillEffectText({
      skill,
      isEnglish: isEnglish.value,
    }),
    effects: effects.value,
    isEnglish: isEnglish.value,
  });
});

const effectDescriptionText = (effect) =>
  parseEffectDescription({
    text: parseEffectTags(effect, isEnglish.value).description,
    shikigami: shikigami.value,
    shikigamiMap: skillShikigamiMap.value,
    onmyojiMap: skillOnmyojiMap.value,
    effectMap: effectMap.value,
    isEnglish: isEnglish.value,
    currentEffectId: effect.id,
  });

const soulName = (souls, id) => findSoulByIdName(souls, id);

const soulSlug = (souls, id) => findSoulByIdSlug(souls, id);

/* ---------------------- TOOLTIP ---------------------- */
const imgs = computed(() => tooltipData.value?.images || []);

function removeTrailingE(word) {
  if (word.endsWith("e")) {
    return word.slice(0, -1);
  }

  return word;
}

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

  await loadShikigami(formattedName.value);

  const shikiIds = [
    ...new Set(shikigami.value?.biography?.map((b) => b.shiki)?.filter(Boolean)),
  ];

  const onmyojiIds = [
    ...new Set(shikigami.value?.biography?.map((b) => b.onmyoji)?.filter(Boolean)),
  ];

  const [shikiData, onmyojiData] = await Promise.all([
    getShikigamiByIds(shikiIds),
    getOnmyojiByIds(onmyojiIds),
  ]);

  bioShikigamiMap.value = new Map(shikiData.map((s) => [s.id, s]));

  bioOnmyojiMap.value = new Map(onmyojiData.map((o) => [o.id, o]));
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

      <div class="character-header">
        <div class="character-image-wrapper">
          <div class="character-image-box">
            <img
              :src="`/assets/images/shikigami/images/${route.params.name}.webp`"
              :alt="shikigami.name.jp[1]"
              class="character-image"
            />
          </div>
        </div>

        <!-- Name -->
        <div class="character-info">
          <table>
            <thead>
              <tr>
                <th class="character-name-header" colspan="4">
                  <div class="character-name">{{ shikigami.name.jp[1] }}</div>
                  <img
                    :src="`/assets/images/rarity/${shikigami.rarity}.webp`"
                    :alt="shikigami.rarity"
                    :class="['rarity-icon', shikigami.rarity === 'UR' ? 'ur' : 'normal']"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>CN</strong>
                </td>
                <td colspan="3">
                  <div class="lang-zh">{{ shikigami.name?.cn[0] }}</div>
                  <div>{{ shikigami.name.cn[1] }}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>JP</strong>
                </td>
                <td colspan="3">
                  <div class="lang-zh">{{ shikigami.name.jp[0] }}</div>
                  <div>{{ shikigami.name.jp[1] }}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>GL</strong>
                </td>
                <td colspan="3">
                  <div>{{ shikigami.name.en }}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>VN</strong>
                </td>
                <td colspan="3">
                  <div>{{ shikigami.name.vn }}</div>
                </td>
              </tr>
              <tr>
                <td class="character-title" colspan="4">Voice Actor</td>
              </tr>
              <tr>
                <td>
                  <strong>{{
                    shikigami.id === 257 || shikigami.id === 256 ? "CN" : "JP"
                  }}</strong>
                </td>
                <td colspan="3">
                  <div
                    class="voice-actor"
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
                <td class="character-title" colspan="4">Evo Materials</td>
              </tr>
              <tr v-if="shikigami.materials && shikigami.materials.length">
                <td
                  class="material-cell"
                  v-for="material in shikigami.materials"
                  :key="material.type"
                >
                  <div class="material-wrapper">
                    <img
                      :src="`/assets/images/materials/${material.type}.webp`"
                      :alt="material.type"
                      class="material-image"
                      :title="material.name"
                    />
                    <span class="material-quantity">{{ material.quantity }}</span>
                  </div>
                </td>
              </tr>
              <tr v-if="shikigami.version !== null">
                <td class="character-title" colspan="4">Other Version</td>
              </tr>
              <tr v-if="shikigami.version !== null">
                <td colspan="4" class="p-1">
                  <div :class="shikigami.version.length > 1 ? 'version-grid' : ''">
                    <div v-for="ver in shikigami.version" :key="ver" class="version-item">
                      <a :href="`/shikigami/${ver.replace(/ /g, '_')}`">
                        <img
                          :src="`/assets/images/shikigami/shards/${ver.replace(
                            / /g,
                            '_'
                          )}_Shard.webp`"
                          class="version-image"
                          @error="
                            (event) =>
                              (event.target.src = '/assets/images/Unknown_Shard.webp')
                          "
                        />
                      </a>
                      <a
                        class="version-name"
                        :href="`/shikigami/${ver.replace(/ /g, '_')}`"
                      >
                        {{ ver }}
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="character-title" colspan="4">Release Date</td>
              </tr>
              <tr>
                <td>
                  <p>CN</p>
                  <p v-if="shikigami.date.en">GL</p>
                </td>
                <td colspan="3">
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
      <ProfileSection
        :profile="shikigami.profile"
        :shikigami="shikigami"
        :list-shikigami="listShikigami"
        :list-onmyoji="listOnmyoji"
        :is-english="isEnglish"
      />

      <!-- Content -->
      <div class="tabs">
        <button
          class="tab tab-button"
          :class="{ active: activeTab === 'Main' }"
          @click="changeTab('Main')"
        >
          {{ isEnglish ? "Main" : "Chính Điện" }}
        </button>

        <button
          class="tab tab-button"
          :class="{ active: activeTab === 'Gallery' }"
          @click="changeTab('Gallery')"
        >
          {{ isEnglish ? "Gallery" : "Hoạ Phòng" }}
        </button>

        <button
          class="tab tab-button"
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
                      :src="`/assets/images/shikigami/icons/${route.params.name}_Icon.webp`"
                      :alt="shikigami.name.jp[1]"
                      class="stats-icon"
                      @error="
                        (event) => (event.target.src = '/assets/images/Unknown_Icon.webp')
                      "
                    />
                  </figure>
                </th>

                <!-- 5 + 6 -->
                <th colspan="2" v-if="hasLevel40" class="icon-cell">
                  <figure class="stats-figure">
                    <img
                      :src="`/assets/images/shikigami/icons/${route.params.name}_Icon${
                        shikigami.rarity !== 'SP' &&
                        shikigami.rarity !== 'UR' &&
                        shikigami.rarity !== 'N'
                          ? '_Evo'
                          : ''
                      }.webp`"
                      :alt="shikigami.name.jp[1]"
                      class="stats-icon"
                      @error="
                        (event) => (event.target.src = '/assets/images/Unknown_Icon.webp')
                      "
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
                  <img src="/assets/images/stats/ATK.webp" alt="ATK" />
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
                  <img src="/assets/images/stats/HP.webp" alt="HP" />
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
                  <img src="/assets/images/stats/DEF.webp" alt="DEF" />
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
                  <img src="/assets/images/stats/SPD.webp" alt="SPD" />
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
                  <img src="/assets/images/stats/CRIT.webp" alt="CRIT" />
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
                  <img src="/assets/images/stats/CDMG.webp" alt="CDMG" />
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
                  <img src="/assets/images/stats/HIT.webp" alt="HIT" />
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
                  <img src="/assets/images/stats/RES.webp" alt="RES" />
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
            :class="['tab tab-skill-button', { active: activeSkillIndex === index }]"
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
            :class="['tab tab-skill-button', { active: activeSkillIndex === 3 }]"
          >
            Evolution Effect
          </button>
          <button
            v-if="shikigami.rarity === 'UR'"
            @click="changeSkill(3)"
            :class="['tab tab-skill-button', { active: activeSkillIndex === 3 }]"
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
                  :src="`/assets/images/shikigami/skills/${route.params.name}_Skill${
                    activeSkillIndex + 1
                  }.webp`"
                  :alt="processedSkills[activeSkillIndex].name.en"
                  :title="processedSkills[activeSkillIndex].name.en"
                />
              </span>
              <span class="skill-heading">
                <div class="skill-title">
                  <span class="skill-name">
                    {{
                      isEnglish
                        ? processedSkills[activeSkillIndex].name.en
                        : processedSkills[activeSkillIndex].name.vn
                    }}
                  </span>
                  <span class="skill-sub-name">
                    ({{
                      processedSkills[activeSkillIndex].name.cn ===
                      processedSkills[activeSkillIndex].name.jp
                        ? processedSkills[activeSkillIndex].name.cn
                        : processedSkills[activeSkillIndex].name.cn +
                          " / " +
                          processedSkills[activeSkillIndex].name.jp
                    }})
                  </span>
                  <button
                    class="skill-edit-btn"
                    @click="editSkill(processedSkills[activeSkillIndex])"
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
                    v-for="tagId in processedSkills[activeSkillIndex].tags"
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
                  <span v-if="processedSkills[activeSkillIndex].cooldown !== 0">
                    <b>CD:</b>
                    {{ processedSkills[activeSkillIndex].cooldown }}
                  </span>
                  <span>
                    {{ processedSkills[activeSkillIndex].onibi }}
                    <img src="/assets/images/Onibi.webp" alt="Onibi" />
                  </span>
                </div>
              </div>
              <hr class="skill-divider" />

              <div
                class="skill-voice-wrapper"
                v-if="processedSkills[activeSkillIndex].voice"
              >
                <p class="skill-voice">"{{ processedSkills[activeSkillIndex].voice }}"</p>
              </div>
              <p
                class="skill-description"
                v-html="
                  skillDescriptionText(
                    isEnglish
                      ? processedSkills[activeSkillIndex].description.en
                      : processedSkills[activeSkillIndex].description.vn,
                    activeSkillIndex
                  )
                "
              ></p>

              <div class="skill-effect-cards" v-if="currentSkillEffects.length">
                <div
                  v-for="effect in currentSkillEffects"
                  :key="effect.id"
                  class="effect-card"
                  :class="{ collapsed: isEffectCollapsed(effect.id) }"
                >
                  <div
                    class="effect-card-title"
                    :class="'title-color-' + effect.color"
                    @click="toggleEffectCard(effect.id)"
                  >
                    {{ isEnglish ? effect.name?.en : effect.name?.vn }}

                    <span class="lang-zh"> ({{ effect.name?.cn }}) </span>
                  </div>

                  <Transition name="effect-collapse">
                    <div v-if="isEffectCollapsed(effect.id)">
                      <div v-if="effect.images?.length">
                        <img
                          v-for="(img, i) in effect.images"
                          :key="i"
                          :src="'/assets/images/effects/' + img + '.webp'"
                          :alt="img"
                        />
                      </div>

                      <div
                        class="effect-tags"
                        v-if="parseEffectTags(effect, isEnglish.value).tags.length"
                      >
                        <span
                          v-for="tag in parseEffectTags(effect, isEnglish.value).tags"
                          :key="tag"
                          class="effect-tag"
                          :class="'tag-' + effectTagType(tag)"
                        >
                          {{ tag }}
                        </span>
                      </div>

                      <div
                        class="effect-card-desc"
                        v-html="effectDescriptionText(effect)"
                      ></div>
                    </div>
                  </Transition>
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
                      :src="`/assets/images/shikigami/skills/${
                        route.params.name
                      }_SubSkill${i - 3}.webp`"
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
                      :src="`/assets/images/shikigami/skills/${
                        route.params.name
                      }_SubSkill${i + 1}.webp`"
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
                      :src="`/assets/images/shikigami/skills/${
                        route.params.name
                      }_SubSkill${i - 3}.webp`"
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
                      :src="`/assets/images/shikigami/skills/${route.params.name}_Knot${i}.webp`"
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
                      ? processedSkills[activeSkillIndex].levels.en
                      : processedSkills[activeSkillIndex].levels.vn"
                    :key="lvl.level"
                  >
                    <td class="level-cell">{{ lvl.level }}</td>
                    <td
                      class="effect-cell"
                      v-html="skillDescriptionText(lvl.effect, activeSkillIndex)"
                    ></td>
                  </tr>
                </tbody>
              </table>
              <div v-else>
                <p class="no-level">
                  { isEnglish ? processedSkills[activeSkillIndex].levels.en :
                  processedSkills[activeSkillIndex].levels.vn }
                </p>
              </div>
            </div>
          </div>

          <div
            v-for="({ skill, i }, index) in processedSkills
              .map((s, i) => ({ skill: s, i }))
              .filter(({ skill, i }) => i >= 3 && skill?.tab === activeSkillIndex + 1)"
            :key="'extra-' + i"
            class="skill-section"
          >
            <!-- Skill icon + title -->
            <div class="skill-top">
              <span class="skill-icon-wrapper">
                <img
                  :src="`/assets/images/shikigami/skills/${route.params.name}_Skill${
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
                  <span v-if="processedSkills[activeSkillIndex].cooldown !== 0">
                    <b>CD:</b>
                    {{ skill.cooldown }}
                  </span>
                  <span>
                    {{ skill.onibi }}
                    <img src="/assets/images/Onibi.webp" alt="Onibi" />
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
                  skillDescriptionText(
                    isEnglish ? skill.description.en : skill.description.vn,
                    activeSkillIndex
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
                      :src="`/assets/images/shikigami/skills/${
                        route.params.name
                      }_SubSkill${i + 1}.webp`"
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
                      v-html="skillDescriptionText(lvl.effect, activeSkillIndex)"
                    ></td>
                  </tr>
                </tbody>
              </table>
              <div v-else>
                <p class="no-level">{ isEnglish ? skill.levels.en : skill.levels.vn }</p>
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
                    :src="`/assets/images/shikigami/skills/${route.params.name}_Skill0.webp`"
                    :alt="processedSkills.find((s) => s.type === 'Linked').name.en"
                    :title="processedSkills.find((s) => s.type === 'Linked').name.en"
                  />
                </span>
                <span class="skill-heading">
                  <div class="skill-title">
                    <span class="skill-name">
                      {{
                        isEnglish
                          ? processedSkills.find((s) => s.type === "Linked").name.en
                          : processedSkills.find((s) => s.type === "Linked").name.vn
                      }}
                    </span>
                    <span class="skill-sub-name">
                      ({{
                        processedSkills.find((s) => s.type === "Linked").name.cn ===
                        processedSkills.find((s) => s.type === "Linked").name.jp
                          ? processedSkills.find((s) => s.type === "Linked").name.cn
                          : processedSkills.find((s) => s.type === "Linked").name.cn +
                            " / " +
                            processedSkills.find((s) => s.type === "Linked").name.jp
                      }})
                    </span>
                    <button
                      class="skill-edit-btn"
                      @click="editSkill(processedSkills.find((s) => s.type === 'Linked'))"
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
                      v-for="tagId in processedSkills.find((s) => s.type === 'Linked')
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
                    <span v-if="processedSkills[activeSkillIndex].cooldown !== 0">
                      <b>CD:</b>
                      {{ processedSkills.find((s) => s.type === "Linked").cooldown }}
                    </span>
                    <span>
                      {{ processedSkills.find((s) => s.type === "Linked").onibi }}
                      <img src="/assets/images/Onibi.webp" alt="Onibi" />
                    </span>
                  </div>
                </div>
                <hr class="skill-divider" />

                <div class="skill-voice-wrapper">
                  <p class="skill-voice">
                    "{{ processedSkills.find((s) => s.type === "Linked").voice }}"
                  </p>
                </div>
                <p
                  class="skill-description"
                  v-html="
                    skillDescriptionText(
                      isEnglish
                        ? processedSkills.find((s) => s.type === 'Linked').description.en
                        : processedSkills.find((s) => s.type === 'Linked').description.vn,
                      activeSkillIndex
                    )
                  "
                ></p>
                <hr class="skill-divider" />
                <div>
                  <p class="no-level">
                    { isEnglish ? processedSkills.find((s) => s.type ===
                    'Linked').notes.en : processedSkills.find((s) => s.type ===
                    'Linked').notes.vn }
                  </p>
                </div>
                <hr class="skill-divider" />
                <table
                  class="skill-level-table"
                  v-if="
                    Array.isArray(
                      isEnglish
                        ? processedSkills.find((s) => s.type === 'Linked').levels.en
                        : processedSkills.find((s) => s.type === 'Linked').levels.vn
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
                        v-html="skillDescriptionText(lvl.effect, activeSkillIndex)"
                      ></td>
                    </tr>
                  </tbody>
                </table>
                <div v-else>
                  <p class="no-level">
                    { isEnglish ? processedSkills.find((s) => s.type ===
                    'Linked').levels.en : processedSkills.find((s) => s.type ===
                    'Linked').levels.vn }
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="evolution-box">
            <p class="evolution-text" v-html="evolutionText"></p>
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
                <span v-html="biographyText(shikigami.biography[0])"></span>
              </td>

              <td class="table-cell reward-cell">
                <div class="reward-box">
                  <img
                    :src="
                      ![153, 154].includes(shikigami.id)
                        ? '/assets/images/Gold.webp'
                        : `/assets/images/shikigami/skinsInfo/${route.params.name}_SkinInfo1.webp`
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
                <span v-html="biographyText(shikigami.biography[1])"></span>
              </td>

              <td v-if="shikigami.id === 78" class="table-cell reward-cell">
                <div class="reward-box">
                  <img src="/assets/images/Gold.webp" alt="Gold" class="reward-icon" />
                  <span class="reward-amount"> 5000</span>
                </div>
              </td>

              <td v-else class="table-cell reward-cell">
                <div class="reward-box">
                  <img
                    :src="
                      [144, 118, 131, 95].includes(shikigami.id)
                        ? '/assets/images/Jade.webp'
                        : [71, 84, 130, 117, 111].includes(shikigami.id)
                        ? '/assets/images/Black_Daruma.webp'
                        : `/assets/images/shikigami/shards/${route.params.name}_Shard.webp`
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
              <td class="table-cell bio-text">
                <span v-html="biographyText(shikigami.biography[2])"></span>
              </td>

              <td class="table-cell reward-cell">
                <div class="reward-box">
                  <img
                    :src="
                      ![144, 118, 131, 111].includes(shikigami.id)
                        ? '/assets/images/Jade.webp'
                        : `/assets/images/shikigami/shards/${route.params.name}_Shard.webp`
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
                :to="`/souls/${soulSlug(souls, id)}`"
                class="build-soul-item"
              >
                <img
                  :src="`/assets/images/souls/icons/${soulSlug(souls, id)}_Icon.webp`"
                  class="build-soul-icon"
                />

                <span class="build-soul-name">
                  {{ soulName(souls, id) }}
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
                  ? `/assets/images/shikigami/images/${route.params.name}${
                      skin.name.en === 'Evolution' ? '_Evo' : ''
                    }.webp`
                  : `/assets/images/shikigami/skins/${route.params.name}_Skin${
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
                  ? `/assets/images/shikigami/images/${route.params.name}${
                      skin.name.en === 'Evolution' ? '_Evo' : ''
                    }.webp`
                  : `/assets/images/shikigami/skins/${route.params.name}_Skin${
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
                            ? `/assets/images/shikigami/shards/${route.params.name}_Shard.webp`
                            : `/assets/images/shikigami/skinsInfo/${route.params.name}_SkinInfo0.webp`
                          : skin.name?.en === 'Evolution'
                          ? `/assets/images/shikigami/skinsInfo/${route.params.name}_SkinInfo00.webp`
                          : `/assets/images/shikigami/skinsInfo/${
                              route.params.name
                            }_SkinInfo${
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
                    :src="`/assets/images/shikigami/bios/${route.params.name}_Bio${
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
              :src="getIllustrationUrl(img.name)"
              :alt="img.name"
              :title="img.name"
              class="illustration-image"
              @click="openModal(getIllustrationUrl(img.name))"
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
  </div>
</template>

<style src="@/assets/css/profile.css"></style>
<style src="@/assets/css/stat.css"></style>
<style src="@/assets/css/skill.css"></style>
<style src="@/assets/css/evolution.css"></style>
<style src="@/assets/css/biography.css"></style>
<style src="@/assets/css/build.css"></style>
<style src="@/assets/css/skin.css"></style>
<style src="@/assets/css/illustration.css"></style>
