<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { useShikigami } from "~/composables/useShikigami";
import { useLanguage } from "~/composables/useLanguage";

import { getOnmyojiByIds } from "~/services/onmyoji.service";
import { getShikigamiByIds } from "~/services/shikigami.service";

import { renderEvolutionText } from "~/utils/parser/renderEvolutionText";
import { parseSkillDescription } from "~/utils/parser/skillParser";

import { markFirstAppearances } from "~/utils/effectCollecter";

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

import { getUIText } from "~/utils/helper/helper";

/* ---------------------- GLOBAL ---------------------- */

const route = useRoute();

const routeName = computed(() => route.params.name);

const formattedName = computed(() => route.params.name.replace(/_/g, " "));

/* ---------------------- STATE ---------------------- */
const {
  shikigami,
  roles,
  listShikigami,
  listOnmyoji,
  tagMap,
  effects,
  conditions,
  souls,
  illustrations,
  evolution,
  fetchIllustrations,
  illustrationHasMore,
  loadShikigami,
} = useShikigami();

const { language, languages, getLocaleText } = useLanguage();

const text = (key) => getUIText(key, language.value);

const showEvolution = ref(true);

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

const displayTitle = computed(() => {
  if (language.value === "cn") {
    return shikigami.value?.name?.cn?.[0] ?? "";
  }

  return shikigami.value?.name?.jp?.[1] ??
    shikigami.value?.name?.jp?.[0] ??
    "";
});

async function changeTab(tab) {
  activeTab.value = tab;

  history.replaceState(null, "", `${window.location.pathname}#${tab}`);

  if (tab === "Gallery" && illustrations.value.length === 0) {
    await fetchIllustrations(shikigami.value.id);
  }
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

const getSkillTypeText = (type) => {
  const typeMap = {
    Normal: text("normal"),
    Special: text("special"),
  };

  return typeMap[type] || type;
};

const getSkillTabName = (skill, index) => {
  const skills = shikigami.value.skills;

  const skill1 = skills[1];
  const skill2 = skills[2];
  const skill3 = skills[3];

  // Dùng type gốc để so sánh logic
  const type1 = skill1?.type;
  const type2 = skill2?.type;
  const type3 = skill3?.type;

  const hasExtraSkillOnTab2 = skill3?.tab === 2;

  const special1 = `${text("special")} 1`;
  const special2 = `${text("special")} 2`;

  // Skill thứ 2
  if (index === 1 && hasExtraSkillOnTab2) {
    if (type1 !== type3) {
      const firstName =
        type1 === type2 ? special1 : getSkillTypeText(type1);

      const secondName =
        type3 === type2 ? special1 : getSkillTypeText(type3);

      return `${firstName} / ${secondName}`;
    }

    return type1 === type2
      ? special1
      : getSkillTypeText(type1);
  }

  // Skill thứ 3
  if (index === 2 && hasExtraSkillOnTab2) {
    if (type1 !== type3) {
      return special2;
    }

    return type2 === type1
      ? special2
      : getSkillTypeText(type2);
  }

  // Hai skill có cùng type
  if (type1 === type2) {
    if (index === 1) {
      return `${getSkillTypeText(skill.type)} 1`;
    }

    if (index === 2) {
      return `${getSkillTypeText(skill.type)} 2`;
    }
  }

  return getSkillTypeText(skill.type);
};

const handleSkillClick = (e) => {
  const skillIndex = Number(e.target.dataset.skillIndex);

  if (Number.isNaN(skillIndex)) return;

  if (skillIndex > 2) {
    const skill = processedSkills.value[skillIndex];
    console.log(processedSkills.value[3]);

    if (skill?.tab != null) {
      changeSkill(skill.tab - 1);
      return;
    }
  }

  changeSkill(skillIndex);
};

const loadMoreRef = ref(null);

let observer;

function initIllustrationObserver() {
  observer?.disconnect();

  observer = new IntersectionObserver(
    async ([entry]) => {
      if (entry.isIntersecting && activeTab.value === "Gallery") {
        await fetchIllustrations(shikigami.value.id);
      }
    },
    {
      rootMargin: "500px",
    }
  );

  if (loadMoreRef.value) {
    observer.observe(loadMoreRef.value);
  }
}

/* ---------------------- RENDER ---------------------- */
const evolutionText = computed(() =>
  renderEvolutionText({
    evolutionData: shikigami.value?.evolution,
    evolutionTemplate: evolution.value,
    shikigami: shikigami.value,
    language: language.value,
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
      language: language.value,
      showEvolution: showEvolution.value,
    })
  );
});

const extraSkills = computed(() =>
  processedSkills.value
    .map((skill, i) => ({ skill, i }))
    .filter(({ skill, i }) => i >= 3 && skill?.tab === activeSkillIndex.value + 1)
);

const linkedSkill = computed(() =>
  processedSkills.value.find((skill) => skill.type === "Linked")
);

const skillDescriptionText = (text) => {
  return parseSkillDescription({
    text,
    shikigami: shikigami.value,
    shikigamiMap: skillShikigamiMap.value,
    onmyojiMap: skillOnmyojiMap.value,
    effectMap: effectMap.value,
    language: language.value,
    currentSkillIndex: activeSkillIndex.value,
  });
};

/* ---------------------- LIFECYCLE ---------------------- */

onMounted(async () => {
  document.title = `${formattedName}`;

  const saved = localStorage.getItem("lang");

  if (saved) {
    language.value = saved;
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

  nextTick(() => {
    initIllustrationObserver();
  });

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
    <div class="content-section">
      <!-- Name -->
      <div class="header-row">
        <div class="title" :class="`title-${language}`">{{ displayTitle }}</div>
        <label class="language-select" title="Switch Language">
          <span class="language-icon">🌐</span>

          <select v-model="language">
            <option v-for="item in languages" :key="item.code" :value="item.code">
              {{ item.label }}
            </option>
          </select>
        </label>
      </div>

      <!-- Character -->
      <CharacterSection 
        :route-name="routeName" 
        :entity="shikigami" 
        :roles="roles"
        :type="'shikigami'"
        :language="language" 
        />

      <!-- Profile -->
      <ProfileSection
        :profile="shikigami.profile"
        :shikigami="shikigami"
        :list-shikigami="listShikigami"
        :list-onmyoji="listOnmyoji"
        :language="language"
      />

      <!-- Content -->
      <TabSection :active-tab="activeTab" :language="language" @change="changeTab"/>

      <!-- Main Tab -->
      <div
        class="w-full"
        v-show="activeTab === 'Main'"
        :class="activeTab === 'Main' ? 'opacity-100' : 'opacity-0'"
      >
        <!-- Stats -->
        <h2 class="session-title top-0" :class="`title-${language}`">
          {{ text("stats") }}
        </h2>

        <StatSection
          :route-name="routeName"
          :entity="shikigami"
          :language="language"
          :is-shikigami="true"
        />

        <!-- Skills -->
        <h2 class="session-title" :class="`title-${language}`">
          {{ text("skills") }}
        </h2>
        <div class="tabs mb-5">
          <button
            v-for="(skill, index) in shikigami.skills.slice(0, 3)"
            :key="index"
            @click="changeSkill(index)"
            :class="['tab tab-skill-button', { active: activeSkillIndex === index }]"
          >
            {{ getSkillTabName(skill, index) }}
          </button>

          <button
            v-if="!['SP', 'UR', 'N'].includes(shikigami.rarity) && shikigami.id !== 193"
            @click="changeSkill(3)"
            :class="['tab tab-skill-button', { active: activeSkillIndex === 3 }]"
          >
            {{ text("evolutionEffect") }}
          </button>

          <button
            v-if="shikigami.rarity === 'UR'"
            @click="changeSkill(3)"
            :class="['tab tab-skill-button', { active: activeSkillIndex === 3 }]"
          >
            {{ text("linked") }}
          </button>
        </div>
        <div v-if="activeSkillIndex < 3">
          <SkillSection
            :route-name="routeName"
            :entity="shikigami"
            :skill="processedSkills[activeSkillIndex]"
            :skill-index="activeSkillIndex"
            :tag-map="tagMap"
            :effects="effects"
            :list-shikigami="listShikigami"
            :list-onmyoji="listOnmyoji"
            :language="language"
            :is-shikigami="true"
            :show-evolution="showEvolution"
            v-model:showEvolution="showEvolution"
            @change-skill="handleSkillClick"
          />

          <SkillSection
            v-for="{ skill, i } in extraSkills"
            :key="'extra-' + i"
            :route-name="routeName"
            :entity="shikigami"
            :skill="skill"
            :skill-index="i"
            :tag-map="tagMap"
            :effects="effects"
            :list-shikigami="listShikigami"
            :list-onmyoji="listOnmyoji"
            :language="language"
            :is-shikigami="true"
            :show-evolution="showEvolution"
            v-model:showEvolution="showEvolution"
            @change-skill="handleSkillClick"
          />
        </div>

        <div v-else>
          <div v-if="shikigami.rarity === 'UR'">
            <div class="skill-section">
              <!-- Skill icon + title -->
              <div class="skill-top">
                <span class="skill-icon-wrapper">
                  <img
                    :src="`/assets/images/shikigami/skills/${route.params.name}_Skill0.webp`"
                    :alt="linkedSkill.name.en"
                    :title="linkedSkill.name.en"
                  />
                </span>
                <span class="skill-heading">
                  <div class="skill-title">
                    <span class="skill-name">
                      {{ linkedSkill?.name?.[language] ?? linkedSkill?.name?.en ?? "" }}
                    </span>
                    <span class="skill-sub-name">
                      ({{
                        linkedSkill?.name?.cn === linkedSkill?.name?.jp
                          ? linkedSkill?.name?.cn
                          : [linkedSkill?.name?.cn, linkedSkill?.name?.jp]
                              .filter(Boolean)
                              .join(" / ")
                      }})
                    </span>
                  </div>
                </span>
              </div>

              <!-- Skill description -->
              <div class="skill-content">
                <div class="skill-header">
                  <div class="skill-badges flex flex-wrap gap-2">
                    <div
                      v-for="tagId in linkedSkill.tags"
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
                    <span v-if="linkedSkill.cooldown !== 0">
                      <b>CD:</b>
                      {{ linkedSkill.cooldown }}
                    </span>
                    <span>
                      {{ linkedSkill.onibi }}
                      <img src="/assets/images/Onibi.webp" alt="Onibi" />
                    </span>
                  </div>
                </div>
                <hr class="skill-divider" />

                <div class="skill-voice-wrapper">
                  <p class="skill-voice">"{{ linkedSkill.voice }}"</p>
                </div>
                <p
                  class="skill-description"
                  v-html="
                    skillDescriptionText(
                      linkedSkill?.description?.[language],
                      activeSkillIndex
                    )
                  "
                ></p>
                <hr class="skill-divider" />
                <div>
                  <p class="no-level">
                    {{ linkedSkill.notes?.[language] }}
                  </p>
                </div>
                <hr class="skill-divider" />
                <table
                  class="skill-level-table"
                  v-if="Array.isArray(linkedSkill.levels?.[language])"
                >
                  <tbody>
                    <tr>
                      <th class="level-column">
                        {{ text("level") }}
                      </th>
                      <th>
                        {{ text("effect") }}
                      </th>
                    </tr>
                    <tr
                      v-for="lvl in linkedSkill.levels?.[language]"
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
                    { linkedSkill.levels?.[language] }
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="evolution-box">
            <p
              class="evolution-text"
              v-html="evolutionText"
              @click="handleSkillClick"
            ></p>
          </div>
        </div>

        <!-- Biography Unlock -->
        <h2 class="session-title" v-if="shikigami.id !== 193" :class="`title-${language}`">
          {{ text("biography") }}
        </h2>

        <BiographySection
          :route-name="routeName"
          :shikigami="shikigami"
          :conditions="conditions"
          :bio="shikigami.biography"
          :bio-shikigami-map="bioShikigamiMap"
          :bio-onmyoji-map="bioOnmyojiMap"
          :language="language"
        />

        <h2 class="session-title" v-if="souls.length" :class="`title-${language}`">
          {{ text("soulChoices") }}
        </h2>

        <SoulChoicesSection :souls="souls" :shikigami="shikigami" :language="language"/>
      </div>

      <!-- Gallery Tab -->
      <div
        v-show="activeTab === 'Gallery'"
        :class="[activeTab === 'Gallery' ? 'opacity-100' : 'opacity-0']"
      >
        <!-- Skins -->
        <h2 class="session-title top-0" :class="`title-${language}`">
          {{ text("skins") }}
        </h2>

        <SkinSection
          :route-name="routeName"
          :entity="shikigami"
          :type="'shikigami'"
          :language="language"
          @open-image="openModal"
        />

        <!-- Skins Info -->
        <h2 class="session-title" :class="`title-${language}`">
          {{ text("skinsInfo") }}
        </h2>

        <SkinInfoSection
          :route-name="routeName"
          :entity="shikigami"
          :type="'shikigami'"
          :language="language"
        />

        <!-- Biography Accessories -->
        <h2
          v-if="shikigami.accessories && shikigami.accessories.length"
          class="session-title"
          :class="`title-${language}`"
        >
          {{ text("biographyAccessories") }}
        </h2>

        <AccessorySection
          :route-name="routeName"
          :entity="shikigami"
          :language="isEnglish"
        />

        <!-- Illustrations -->
        <h2 class="session-title" :class="`title-${language}`">
          {{ text("illustration") }}
        </h2>

        <IllustrationSection :illustrations="illustrations" :language="language" @open-image="openModal" />
        <div ref="loadMoreRef" v-if="illustrationHasMore" class="loading-trigger"></div>
      </div>
    </div>
  </div>

  <ModalSection :is-open="isModalOpen" :image="selectedImage" @close="closeModal" />
</template>

<style src="@/assets/css/styles.css"></style>

<style src="@/assets/css/profile.css"></style>
<style src="@/assets/css/stat.css"></style>
<style src="@/assets/css/skill.css"></style>
<style src="@/assets/css/evolution.css"></style>
<style src="@/assets/css/biography.css"></style>
<style src="@/assets/css/build.css"></style>

<style src="@/assets/css/skin.css"></style>
<style src="@/assets/css/illustration.css"></style>
