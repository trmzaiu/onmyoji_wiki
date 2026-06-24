<script setup>
import { renderProfileText } from "~/utils/parser/renderProfileText";

const props = defineProps({
  profile: Object,
  shikigami: Object,
  listShikigami: Array,
  listOnmyoji: Array,
  language: String,
});

const profileText = (profile) =>
  renderProfileText({
    shikigami: props.shikigami,
    profile,
    listShikigami: props.listShikigami,
    listOnmyoji: props.listOnmyoji,
    language: props.language,
  });
</script>

<template>
  <div class="profile-section" v-if="profile" v-html="profileText(profile)" />
</template>
