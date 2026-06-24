<script setup>
import { getUIText } from "~/utils/helper/helper";

const props = defineProps({
  activeTab: String,
  language: String,
});

const emit = defineEmits(["change"]);

const changeTab = (tab) => {
  emit("change", tab);
};

const text = (key) => getUIText(key, props.language);
</script>

<template>
  <div class="tabs">
    <button
      class="tab tab-button"
      :class="[{ active: activeTab === 'Main' }, `title-${language}`]"
      @click="changeTab('Main')"
    >
      {{ text("main") }}
    </button>

    <button
      class="tab tab-button"
      :class="[{ active: activeTab === 'Gallery' }, `title-${language}`]"
      @click="changeTab('Gallery')"
    >
      {{ text("gallery") }}
    </button>
  </div>
</template>
