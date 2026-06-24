<script setup>

import { effectTagType } from '~/utils/parser/effectParser';

const props = defineProps({
  effects: Array,
  language: String,
  isEffectCollapsed: Function,
  toggleEffectCard: Function,
  parseEffectTags: Function,
  effectDescriptionText: Function,
});
</script>

<template>
  <div class="skill-effect-cards" v-if="effects.length">
    <div
      v-for="effect in effects"
      :key="effect.id"
      class="effect-card"
      :class="{ collapsed: isEffectCollapsed(effect.id) }"
    >
      <div
        class="effect-card-title"
        :class="'title-color-' + effect.color"
        @click="toggleEffectCard(effect.id)"
      >
        {{ effect.name?.[language] }}

        <span v-if="language !== 'cn'" class="lang-cn"> ({{ effect.name.cn }}) </span>
      </div>

      <Transition name="effect-collapse">
        <div v-if="isEffectCollapsed(effect.id)">
          <div v-if="effect.images?.length" class="effect-images">
            <img
              v-for="(img, i) in effect.images"
              :key="i"
              :src="'/assets/images/effects/' + img + '.webp'"
              :alt="img"
            />
          </div>

          <div class="effect-tags" v-if="parseEffectTags(effect, language).tags.length">
            <span
              v-for="tag in parseEffectTags(effect, language).tags"
              :key="tag"
              class="effect-tag"
              :class="'tag-' + effectTagType(tag)"
            >
              {{ tag }}
            </span>
          </div>

          <div class="effect-card-desc" v-html="effectDescriptionText(effect)"></div>
        </div>
      </Transition>
    </div>
  </div>
</template>
