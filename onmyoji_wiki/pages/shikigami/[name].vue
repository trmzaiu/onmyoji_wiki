<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { useShikigami } from "~/composables/useShikigami";

import { getOnmyojiByIds } from "~/services/onmyoji.service";
import { getShikigamiByIds } from "~/services/shikigami.service";

import { renderEvolutionText } from "~/utils/parser/renderEvolutionText";
import { parseSkillDescription } from "~/utils/parser/skillParser";

import {
  markFirstAppearances,
} from "~/utils/effectCollecter";

import BiographySection from "~/components/BiographySection.vue";
import CharacterSection from "~/components/CharacterSection.vue";
import AccessorySection from "~/components/gallery/AccessorySection.vue";
import IllustrationSection from "~/components/gallery/IllustrationSection.vue";
import SkinInfoSection from "~/components/gallery/SkinInfoSection.vue";
import SkinSection from "~/components/gallery/SkinSection.vue";
import ModalSection from "~/components/ModalSection.vue";
import ProfileSection from "~/components/ProfileSection.vue";
import SkillSection from "~/components/skills/SkillSection.vue";
import SoulChoicesSection from "~/components/SoulChoicesSection.vue";
import StatSection from "~/components/StatSection.vue";
import TabSection from "~/components/TabSection.vue";

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

const skillDescriptionText = (text) => {
  return parseSkillDescription({
    text,
    shikigami: shikigami.value,
    shikigamiMap: skillShikigamiMap.value,
    onmyojiMap: skillOnmyojiMap.value,
    effectMap: effectMap.value,
    isEnglish: isEnglish.value,
    currentSkillIndex: activeSkillIndex.value,
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
        :entity="shikigami"
        :is-shikigami="true"
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
      <TabSection :active-tab="activeTab" :is-english="isEnglish" @change="changeTab" />

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
          <SkillSection
            :route-name="routeName"
            :entity="shikigami"
            :skill="processedSkills[activeSkillIndex]"
            :tag-map="tagMap"
            :effects="effects"
            :list-shikigami="listShikigami"
            :list-onmyoji="listOnmyoji"
            :is-english="isEnglish"
            :active-skill-index="activeSkillIndex"
            :is-shikigami="true"
          />

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

        <SoulChoicesSection :souls="souls" :shikigami="shikigami" />
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

        <SkinSection
          :route-name="routeName"
          :entity="shikigami"
          :is-shikigami="true"
          :is-english="isEnglish"
          @open-image="openModal"
        />

        <!-- Skins Info -->
        <h2 class="session-title">
          {{ isEnglish ? "Skins Info" : "Thông tin trang phục" }}
        </h2>

        <SkinInfoSection
          :route-name="routeName"
          :entity="shikigami"
          :is-shikigami="true"
          :is-english="isEnglish"
        />

        <!-- Biography Accessories -->
        <h2
          v-if="shikigami.accessories && shikigami.accessories.length"
          class="session-title"
        >
          {{ isEnglish ? "Biography Accessories" : "Phụ kiện Tiểu sử" }}
        </h2>
        <AccessorySection
          :route-name="routeName"
          :entity="shikigami"
          :is-english="isEnglish"
        />

        <!-- Illustrations -->
        <h2 class="session-title">
          {{ isEnglish ? "Illustrations" : "Hoạ Ảnh" }}
        </h2>

        <IllustrationSection :illustrations="illustrations" @open-image="openModal" />
      </div>
    </div>
  </div>

  <ModalSection :is-open="isModalOpen" :image="selectedImage" @close="closeModal" />
</template>

<style src="@/assets/css/profile.css"></style>
<style src="@/assets/css/stat.css"></style>
<style src="@/assets/css/skill.css"></style>
<style src="@/assets/css/evolution.css"></style>
<style src="@/assets/css/biography.css"></style>
<style src="@/assets/css/build.css"></style>
<style src="@/assets/css/skin.css"></style>
<style src="@/assets/css/illustration.css"></style>
