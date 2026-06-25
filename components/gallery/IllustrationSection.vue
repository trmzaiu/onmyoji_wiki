<script setup>
const props = defineProps({
  illustrations: {
    type: Array,
    default: () => [],
  },
  language: {
    type: String,
    default: "en",
  },
});

const emit = defineEmits(["open-image"]);

const getIllustrationUrl = (nameEn) => `/assets/images/illustrations/${nameEn}.jpg`;

const getIllustrationName = (img) => {
  if (props.language === "en") {
    return img.name_en || "";
  }

  return img.name?.[props.language] || img.name?.cn || img.name_en || "";
};

const formatIllustrationName = (name) => {
  return name.replace(/[_ ]\d+$/, "").replace(/_/g, " ");
};

const isChineseText = (text = "") => /[\u4E00-\u9FFF]/.test(text);

const getIllustrationLanguage = (img) => {
  return isChineseText(img.name_en) ? "cn" : props.language;
};
</script>

<template>
  <div class="illustration-gallery">
    <div
      v-for="(img, index) in illustrations"
      :key="img.id || index"
      class="illustration-card"
    >
      <img
        :src="getIllustrationUrl(img.name_en)"
        :alt="getIllustrationName(img)"
        :title="getIllustrationName(img)"
        class="illustration-image"
        loading="lazy"
        @click="emit('open-image', getIllustrationUrl(img.name_en))"
      />

      <div
        v-if="!/^No[ _]Name/i.test(img.name_en)"
        class="illustration-label"
        :class="`skin-${getIllustrationLanguage(img)}`"
      >
        {{ formatIllustrationName(getIllustrationName(img)) }}
      </div>
    </div>
  </div>
</template>
