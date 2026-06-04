<script setup>
const props = defineProps({
  skill: Object,
  tagMap: Array,
  skillDescriptionText: Function,
  isEnglish: Boolean
});
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
  <p
    class="skill-description"
    v-html="
      skillDescriptionText(
        isEnglish ? skill.description.en : skill.description.vn      )
    "
  ></p>
</template>
