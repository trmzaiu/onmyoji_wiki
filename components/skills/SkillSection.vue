<script setup>
import SkillEffect from "./SkillEffect.vue";
import SkillInfo from "./SkillInfo.vue";
import SkillLevel from "./SkillLevel.vue";
import SkillTitle from "./SkillTitle.vue";
import SubSkill from "./SubSkill.vue";

import { parseSkillDescription } from "~/utils/parser/skillParser.js";
import { parseEffectDescription, parseEffectTags } from "~/utils/parser/effectParser.js";

import { collectNestedEffects, getAllSkillEffectText } from "~/utils/effectCollecter";

// =====================================================
// Props
// =====================================================

const props = defineProps({
  routeName: String,
  entity: Object,
  skill: Object,
  skillIndex: Number,
  effects: Object,
  tagMap: Array,
  listShikigami: Array,
  listOnmyoji: Array,
  isEnglish: Boolean,
  isShikigami: Boolean,
  showEvolution: Boolean,
});

// =====================================================
// Computed Maps
// =====================================================

const skillShikigamiMap = computed(
  () => new Map((props.listShikigami || []).map((s) => [String(s.id), s]))
);

const skillOnmyojiMap = computed(
  () => new Map((props.listOnmyoji || []).map((o) => [String(o.id), o]))
);

const effectMap = computed(
  () => new Map((props.effects || []).map((e) => [String(e.id), e]))
);

// =====================================================
// State
// =====================================================

const collapsedEffects = ref(new Set());

// =====================================================
// Skill Helpers
// =====================================================

const skillDescriptionText = (text) =>
  parseSkillDescription({
    text,
    entity: props.entity,
    shikigamiMap: skillShikigamiMap.value,
    onmyojiMap: skillOnmyojiMap.value,
    effectMap: effectMap.value,
    isEnglish: props.isEnglish,
    currentSkillIndex: props.skillIndex,
  });

const currentSkillEffects = computed(() => {
  if (!props.skill) {
    return [];
  }

  return collectNestedEffects({
    text: getAllSkillEffectText({
      skill: props.skill,
      isEnglish: props.isEnglish,
      showEvolution: props.showEvolution,
    }),
    effects: props.effects,
    isEnglish: props.isEnglish,
  });
});

// =====================================================
// Effect Helpers
// =====================================================

const toggleEffectCard = (effectId) => {
  const collapsed = collapsedEffects.value;

  if (collapsed.has(effectId)) {
    collapsed.delete(effectId);
  } else {
    collapsed.add(effectId);
  }

  collapsedEffects.value = new Set(collapsed);
};

const isEffectCollapsed = (effectId) =>
  collapsedEffects.value.has(effectId);

const effectDescriptionText = (effect) =>
  parseEffectDescription({
    text: parseEffectTags(effect, props.isEnglish).description,
    entity: props.entity,
    shikigamiMap: skillShikigamiMap.value,
    onmyojiMap: skillOnmyojiMap.value,
    effectMap: effectMap.value,
    isEnglish: props.isEnglish,
    currentEffectId: effect.id,
  });

// =====================================================
// Watchers
// =====================================================

watch(
  () => props.skillIndex,
  () => {
    collapsedEffects.value = new Set();
  }
);

// =====================================================
// Emits
// =====================================================

const emit = defineEmits(["update:showEvolution", "change-skill",]);

</script>

<template>
  <div class="skill-section">
    <!-- Skill icon + title -->
    <SkillTitle
      :route-name="routeName"
      :skill="skill"
      :skill-index="skillIndex"
      :is-shikigami="isShikigami"
      :is-english="isEnglish"
    />

    <!-- Skill description -->
    <div class="skill-content">
      <SkillInfo
        :skill="skill"
        :tag-map="tagMap"
        :skill-description-text="skillDescriptionText"
        :is-english="isEnglish"
        :show-evolution="showEvolution"
        @update:showEvolution="emit('update:showEvolution', $event)"
        @change-skill="emit('change-skill', $event)"
      />

      <SkillEffect
        :effects="currentSkillEffects"
        :is-english="isEnglish"
        :is-effect-collapsed="isEffectCollapsed"
        :toggle-effect-card="toggleEffectCard"
        :parse-effect-tags="parseEffectTags"
        :effect-description-text="effectDescriptionText"
      />

      <SubSkill
        v-if="isShikigami"
        :shikigami="entity"
        :route-name="routeName"
        :is-english="isEnglish"
        :skill-index="skillIndex"
      />

      <hr class="skill-divider" />

      <SkillLevel
        :skill="skill"
        :is-english="isEnglish"
        :skill-description-text="skillDescriptionText"
        @change-skill="emit('change-skill', $event)"
      />
    </div>
  </div>
</template>
