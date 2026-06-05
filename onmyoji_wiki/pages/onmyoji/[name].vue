<script setup>
import { computed, onMounted, ref, nextTick, watch } from "vue";
import { useRoute } from "vue-router";

import { useOnmyoji } from "~/composables/useOnmyoji";

import { markFirstAppearances } from "~/utils/effectCollecter";

import CharacterSection from "~/components/CharacterSection.vue";
import StatSection from "~/components/StatSection.vue";
import IllustrationSection from "~/components/gallery/IllustrationSection.vue";
import SkinInfoSection from "~/components/gallery/SkinInfoSection.vue";
import SkinSection from "~/components/gallery/SkinSection.vue";
import SkillSection from "~/components/skills/SkillSection.vue";

/* ---------------------- GLOBAL ---------------------- */

const route = useRoute();

const routeName = computed(() => route.params.name);

const formattedName = computed(() => route.params.name.replace(/_/g, " "));

/* ---------------------- STATE ---------------------- */
const {
  onmyoji,
  tagMap,
  listShikigami,
  listOnmyoji,
  effects,
  illustrations,
  fetchIllustrations,
  illustrationHasMore,
  loadOnmyoji,
} = useOnmyoji();

const isEnglish = ref(true);

const activeTab = ref(route.hash.replace("#", "") || "Main");
const activeSkinTab = ref(route.params.name.replace(/_/g, " ").toLowerCase());
const activeSkinInfoTab = ref(route.params.name.replace(/_/g, " ").toLowerCase());

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

async function changeTab(tab) {
  activeTab.value = tab;

  history.replaceState(null, "", `${window.location.pathname}#${tab}`);

  if (tab === "Gallery" && illustrations.value.length === 0) {
    await fetchIllustrations(onmyoji.value.id);
  }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function updateHash() {
  history.replaceState(
    null,
    "",
    `${window.location.pathname}#Skin_${capitalize(
      activeSkinTab.value
    )}&SkinInfo_${capitalize(activeSkinInfoTab.value)}`
  );
}

function changeSkinTab(type, value) {
  if (type === "skin") {
    activeSkinTab.value = value;
  }

  if (type === "skinInfo") {
    activeSkinInfoTab.value = value;
  }

  updateHash();
}

const loadMoreRef = ref(null);

let observer;

function initIllustrationObserver() {
  observer?.disconnect();

  observer = new IntersectionObserver(
    async ([entry]) => {
      if (entry.isIntersecting && activeTab.value === "Gallery") {
        await fetchIllustrations(onmyoji.value.id);
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

const processedSkills = computed(() => {
  if (!onmyoji.value?.skills?.length) {
    return [];
  }

  return onmyoji.value.skills.map((skill) =>
    markFirstAppearances({
      skill,
      isEnglish: isEnglish.value,
    })
  );
});

/* ---------------------- LIFECYCLE ---------------------- */

onMounted(async () => {
  document.title = `${formattedName}`;

  const saved = localStorage.getItem("lang");

  if (saved) {
    isEnglish.value = saved === "en";
  }

  const hash = window.location.hash.replace("#", "");

  if (hash) {
    activeTab.value = hash;
  }

  await loadOnmyoji(formattedName.value);

  nextTick(() => {
    initIllustrationObserver();
  });
});

watch(
  () => route.hash,
  (hash) => {
    activeTab.value = hash.replace("#", "") || "Main";
  }
);

watch(isEnglish, (val) => {
  localStorage.setItem("lang", val ? "en" : "vn");
});
</script>

<template>
  <div class="container" v-if="onmyoji">
    <div class="content-section">
      <!-- Name -->
      <div class="header-row">
        <div class="title">{{ onmyoji.name.en }}</div>
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
      <CharacterSection :route-name="routeName" :entity="onmyoji" :type="'onmyoji'" />

      <!-- Content -->
      <TabSection :active-tab="activeTab" :is-english="isEnglish" @change="changeTab" />

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
          :entity="onmyoji"
          :is-english="isEnglish"
          :is-shikigami="false"
        />

        <!-- Skill -->
        <h2 class="session-title">
          {{ isEnglish ? "Skills" : "Kĩ năng" }}
        </h2>

        <div v-for="(skill, index) in processedSkills" :key="index">
          <SkillSection
            :route-name="routeName"
            :entity="onmyoji"
            :skill="skill"
            :tag-map="tagMap"
            :effects="effects"
            :list-shikigami="listShikigami"
            :list-onmyoji="listOnmyoji"
            :is-english="isEnglish"
            :active-skill-index="index"
            :is-shikigami="false"
          />
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

        <div class="tabs">
          <button
            :class="[
              'tab tab-skill-button',
              { active: activeSkinTab === onmyoji.name.en.toLowerCase() },
            ]"
            @click="changeSkinTab('skin', onmyoji.name.en.toLowerCase())"
          >
            {{ onmyoji.name.en }}
          </button>
          <button
            :class="[
              'tab tab-skill-button',
              { active: activeSkinTab === onmyoji.totem[0].name.en.toLowerCase() },
            ]"
            @click="changeSkinTab('skin', onmyoji.totem[0].name.en.toLowerCase())"
          >
            {{ onmyoji.totem[0].name.en }}
          </button>
        </div>

        <SkinSection
          v-show="activeSkinTab === onmyoji.name.en.toLowerCase()"
          :route-name="routeName"
          :entity="onmyoji"
          :type="'onmyoji'"
          :is-english="isEnglish"
          @open-image="openModal"
        />

        <SkinSection
          v-show="activeSkinTab === onmyoji.totem[0].name.en.toLowerCase()"
          :route-name="routeName"
          :entity="onmyoji"
          :type="'totem'"
          :is-english="isEnglish"
          @open-image="openModal"
        />

        <!-- Skins Info -->
        <h2 class="session-title">
          {{ isEnglish ? "Skins Info" : "Thông tin ngoại hình" }}
        </h2>

        <div class="tabs">
          <button
            :class="[
              'tab tab-skill-button',
              { active: activeSkinInfoTab === onmyoji.name.en.toLowerCase() },
            ]"
            @click="changeSkinTab('skinInfo', onmyoji.name.en.toLowerCase())"
          >
            {{ onmyoji.name.en }}
          </button>
          <button
            :class="[
              'tab tab-skill-button',
              { active: activeSkinInfoTab === onmyoji.totem[0].name.en.toLowerCase() },
            ]"
            @click="changeSkinTab('skinInfo', onmyoji.totem[0].name.en.toLowerCase())"
          >
            {{ onmyoji.totem[0].name.en }}
          </button>
        </div>

        <SkinInfoSection
          v-show="activeSkinInfoTab === onmyoji.name.en.toLowerCase()"
          :route-name="routeName"
          :entity="onmyoji"
          :type="'onmyoji'"
          :is-english="isEnglish"
        />

        <SkinInfoSection
          v-show="activeSkinInfoTab === onmyoji.totem[0].name.en.toLowerCase()"
          :route-name="routeName"
          :entity="onmyoji"
          :type="'totem'"
          :is-english="isEnglish"
        />

        <!-- Illustrations -->
        <h2 class="session-title">
          {{ isEnglish ? "Illustrations" : "Hoạ Ảnh" }}
        </h2>

        <IllustrationSection :illustrations="illustrations" @open-image="openModal" />
        <div ref="loadMoreRef" v-if="illustrationHasMore" class="loading-trigger"></div>
      </div>
    </div>

    <ModalSection :is-open="isModalOpen" :image="selectedImage" @close="closeModal" />
  </div>
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
