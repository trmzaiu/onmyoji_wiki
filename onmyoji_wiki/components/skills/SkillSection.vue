<script setup>
import SkillEffect from "./SkillEffect.vue";
import SkillInfo from "./SkillInfo.vue";
import SkillLevel from "./SkillLevel.vue";
import SkillTitle from "./SkillTitle.vue";
import SubSkill from "./SubSkill.vue";
import { parseSkillDescription } from "~/utils/parser/skillParser.js";
import { parseEffectDescription, parseEffectTags } from "~/utils/parser/effectParser.js";
import { collectNestedEffects, getAllSkillEffectText } from "~/utils/effectCollecter";

const props = defineProps({
  routeName: String,
  entity: Object,
  skill: Object,
  effects: Object,
  tagMap: Array,
  listShikigami: Array,
  listOnmyoji: Array,
  isEnglish: Boolean,
  isShikigami: Boolean,
  activeSkillIndex: Number,
  showEvolution: Boolean,
});

const skillShikigamiMap = computed(() => {
  return new Map((props.listShikigami || []).map((s) => [String(s.id), s]));
});

const skillOnmyojiMap = computed(() => {
  return new Map((props.listOnmyoji || []).map((o) => [String(o.id), o]));
});

const effectMap = computed(
  () => new Map((props.effects || []).map((e) => [String(e.id), e]))
);

const skillDescriptionText = (text) => {
  return parseSkillDescription({
    text,
    entity: props.entity,
    shikigamiMap: skillShikigamiMap.value,
    onmyojiMap: skillOnmyojiMap.value,
    effectMap: effectMap.value,
    isEnglish: props.isEnglish,
    currentSkillIndex: props.activeSkillIndex,
  });
};

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

const currentSkillEffects = computed(() => {
  const skill = props.skill;

  if (!skill) {
    return [];
  }

  return collectNestedEffects({
    text: getAllSkillEffectText({
      skill,
      isEnglish: props.isEnglish,
      showEvolution: props.showEvolution
    }),
    effects: props.effects,
    isEnglish: props.isEnglish
  });
});

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

watch(
  () => props.activeSkillIndex,
  () => {
    collapsedEffects.value = new Set();
  }
);

const emit = defineEmits(["update:showEvolution"]);
</script>

<template>
  <div class="skill-section">
    <!-- Skill icon + title -->
    <SkillTitle
      :route-name="routeName"
      :skill="skill"
      :is-shikigami="isShikigami"
      :is-english="isEnglish"
      :active-skill-index="activeSkillIndex"
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
        :active-skill-index="activeSkillIndex"
      />

      <hr class="skill-divider" />

      <SkillLevel
        :skill="skill"
        :is-english="isEnglish"
        :skill-description-text="skillDescriptionText"
      />
    </div>
  </div>
</template>
