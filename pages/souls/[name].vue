<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { useLanguage } from "~/composables/useLanguage";
import { useSoul } from "~/composables/useSoul";

import { collectNestedEffects, getAllSoulEffectText } from "~/utils/effectCollecter";
import { getUIText } from "~/utils/helper/helper";
import { parseEffectDescription, parseEffectTags } from "~/utils/parser/effectParser";
import { parseSoulDescription } from "~/utils/parser/soulParser";

import SkillEffect from "~/components/skills/SkillEffect.vue";
import SoulSection from "~/components/souls/SoulSection.vue";

/* ---------------------- GLOBAL ---------------------- */

const route = useRoute();

const routeName = computed(() => route.params.name);
const formattedName = computed(() => route.params.name.replace(/_/g, " "));

/* ---------------------- COMPOSABLES ---------------------- */

const { soul, effects, loadSoul } = useSoul();
const { language, languages } = useLanguage();

/* ---------------------- STATE ---------------------- */

const collapsedEffects = ref(new Set());

/* ---------------------- COMPUTED ---------------------- */

const displayTitle = computed(() => {
  if (language.value === "cn") {
    return soul.value?.name?.cn?.[0] ?? "";
  }

  return soul.value?.name?.en ?? "";
});

const effectMap = computed(
  () => new Map((effects.value || []).map((effect) => [String(effect.id), effect]))
);

const processedSoul = computed(() =>
  markFirstAppearancesInText(soul.value?.effect?.[language.value] || "")
);

const soulEffects = computed(() => {
  if (!processedSoul.value) {
    return [];
  }

  return collectNestedEffects({
    text: processedSoul.value,
    effects: effects.value,
    language: language.value,
  });
});

const visibleSkillEffects = computed(() =>
  soulEffects.value.filter((effect) => effect.tooltip === false)
);

/* ---------------------- METHODS ---------------------- */

const soulDescriptionText = (text) =>
  parseSoulDescription({
    text,
    effectMap: effectMap.value,
    language: language.value,
  });

const effectDescriptionText = (effect) =>
  parseEffectDescription({
    text: parseEffectTags(effect, language.value).description,
    effectMap: effectMap.value,
    language: language.value,
  });

const toggleEffectCard = (effectId) => {
  const collapsed = collapsedEffects.value;

  if (collapsed.has(effectId)) {
    collapsed.delete(effectId);
  } else {
    collapsed.add(effectId);
  }

  collapsedEffects.value = new Set(collapsed);
};

const isEffectCollapsed = (effectId) => collapsedEffects.value.has(effectId);

const text = (key) => getUIText(key, language.value);

/* ---------------------- LIFECYCLE ---------------------- */

onMounted(async () => {
  document.title = formattedName.value;
  await loadSoul(formattedName.value);
});

/* ---------------------- DEBUG ---------------------- */

watch(
  effects,
  (value) => {
    console.log("Loaded effects:", value);
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="soul">
    <div class="content-section flex flex-col gap-4">
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

      <SoulSection
        v-if="soul"
        :route-name="routeName"
        :entity="soul"
        :language="language"
      />

      <!-- Effects -->
      <div class="soul-section">
        <h2 class="soul-section-title" :class="`title-${language}`">
          {{ text("effect") }}
        </h2>

        <div class="soul-effect">
          <div class="soul-effect-description">
            <p v-html="soulDescriptionText(processedSoul)"></p>
          </div>

          <SkillEffect
            :effects="visibleSkillEffects"
            :language="language"
            :is-effect-collapsed="isEffectCollapsed"
            :toggle-effect-card="toggleEffectCard"
            :parse-effect-tags="parseEffectTags"
            :effect-description-text="effectDescriptionText"
          />
        </div>
      </div>

      <!-- Obtainable -->
      <div class="soul-section">
        <h2 class="soul-section-title" :class="`title-${language}`">
          {{ text("obtained") }}
        </h2>

        <ul class="obtained-list">
          <li v-for="(item, index) in soul.obtained" :key="index">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/css/soul.css"></style>
