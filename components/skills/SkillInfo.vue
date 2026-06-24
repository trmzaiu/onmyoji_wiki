<script setup>
const props = defineProps({
  skill: Object,
  tagMap: Array,
  skillDescriptionText: Function,
  language: String,
  showEvolution: Boolean,
});

const currentDescription = computed(() => {
  if (!props.skill.base) {
    return props.skill.description?.[props.language] || "";
  }

  return props.showEvolution
    ? props.skill.description?.[props.language] || ""
    : props.skill.base?.[props.language] || "";
});

const emit = defineEmits(["update:showEvolution", "change-skill"]);
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
          {{ tagMap?.[tagId]?.name?.[language] }}
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
    <p class="skill-voice" :class="`voice-${language}`">
      "{{ skill.voice?.[language] }}"
    </p>
  </div>

  <div
    v-if="skill.base"
    class="evolution-badge"
    @click="emit('update:showEvolution', !showEvolution)"
  >
    {{ showEvolution ? (language === 'cn' ? '觉醒后' : 'Evo') : (language === 'cn' ? '觉醒前' : 'Base') }}
  </div>

  <p
    class="skill-description"
    v-html="skillDescriptionText(currentDescription)"
    @click="emit('change-skill', $event)"
  ></p>
</template>
