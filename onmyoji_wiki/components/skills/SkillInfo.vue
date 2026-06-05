<script setup>
const props = defineProps({
  skill: Object,
  tagMap: Array,
  skillDescriptionText: Function,
  isEnglish: Boolean,
  showEvolution: Boolean
});

const currentDescription = computed(() => {
  const lang = props.isEnglish ? "en" : "vn";

  if (!props.skill.base) {
    return props.skill.description?.[lang] || "";
  }

  return props.showEvolution
    ? props.skill.description?.[lang] || ""
    : props.skill.base?.[lang] || "";
});

const emit = defineEmits(["update:showEvolution"]);
</script>

<template>
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
      <span v-if="skill.cooldown !== 0" class="skill-cd">
        <i class="fa-solid fa-clock"></i>
        {{ skill.cooldown }}
      </span>
      <span>
        <img src="/assets/images/Onibi.webp" alt="Onibi" />
        {{ skill.onibi }}
      </span>
    </div>
  </div>

  <hr class="skill-divider" />

  <div class="skill-voice-wrapper" v-if="skill.voice">
    <p class="skill-voice">"{{ skill.voice }}"</p>
  </div>

  <div
    v-if="skill.base"
    class="evolution-badge"
    @click="emit('update:showEvolution', !showEvolution)"
  >
    {{ showEvolution ? "Evo" : "Base" }}
  </div>

  <p
    class="skill-description"
    v-html="skillDescriptionText(currentDescription)"
  ></p>
</template>
