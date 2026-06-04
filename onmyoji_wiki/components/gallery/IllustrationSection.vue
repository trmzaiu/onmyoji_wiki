<script setup>

const props = defineProps({
  illustrations: Object,
});

const getIllustrationUrl = (name) =>
  `/assets/images/illustrations/${name.replace(/ /g, "_")}.jpg`;

const emit = defineEmits(["open-image"]);
</script>

<template>
  <div class="illustration-gallery">
    <div v-for="(img, index) in illustrations" :key="index" class="illustration-card">
      <img
        :src="getIllustrationUrl(img.name)"
        :alt="img.name"
        :title="img.name"
        class="illustration-image"
        @click="emit('open-image', getIllustrationUrl(img.name))"
      />

      <div
        v-if="!/^No[ _]Name/i.test(img.name)"
        class="illustration-label"
        :class="/[\u4E00-\u9FFF]/.test(img.name) ? 'lang-zh' : 'skin-name-en'"
      >
        {{ img.name.replace(/[_ ]\d+$/, "").replace(/_/g, " ") }}
      </div>
    </div>
  </div>
</template>
