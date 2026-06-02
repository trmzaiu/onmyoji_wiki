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

import ProfileSection from "~/components/ProfileSection.vue";
import CharacterSection from "~/components/CharacterSection.vue";
import TabSection from "~/components/TabSection.vue";
import StatSection from "~/components/StatSection.vue";
import BiographySection from "~/components/BiographySection.vue";
import SoulChoicesSection from "~/components/SoulChoicesSection.vue";
/* ---------------------- GLOBAL ---------------------- */
const route = useRoute();

const formattedName = computed(() => {
  return route.params.name.replace(/_/g, " ");
});

const routeName = computed(() => {
  return route.params.name;
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

const bioShikigamiMap = ref(new Map());
const bioOnmyojiMap = ref(new Map());

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

      <!-- Character -->
      <CharacterSection 
        :route-name="routeName" 
        :shikigami="shikigami"
      />

      <!-- Profile -->
      <ProfileSection
        :profile="shikigami.profile"
        :shikigami="shikigami"
        :list-shikigami="listShikigami"
        :list-onmyoji="listOnmyoji"
        :is-english="isEnglish"
      />

      <!-- Content -->
      <TabSection
        :active-tab="activeTab"
        :is-english="isEnglish"
        @change="changeTab"
      />

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

        <StatSection 
          :route-name="routeName" 
          :shikigami="shikigami"
          :is-english="isEnglish"
        />

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

        <BiographySection 
          :route-name="routeName"
          :shikigami="shikigami"
          :conditions="conditions"
          :bio="shikigami.biography"
          :bio-shikigami-map="bioShikigamiMap"
          :bio-onmyoji-map="bioOnmyojiMap"
          :is-english="isEnglish"
        />

        <h2 class="session-title" v-if="shikigami.id !== 193">
          {{ isEnglish ? "Soul Choices" : "Ngự Hồn Đề Cử" }}
        </h2>

        <SoulChoicesSection 
          :souls="souls"
          :shikigami="shikigami"
          />
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
