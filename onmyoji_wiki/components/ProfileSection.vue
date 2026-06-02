defineProps({ profile: Object, shikigami: Object, listShikigami: Array, listOnmyoji:
Array, isEnglish: Boolean, });

<script setup>
import { renderProfileText } from "~/utils/parser/renderProfileText";

const props = defineProps({
  profile: Object,
  shikigami: Object,
  listShikigami: Array,
  listOnmyoji: Array,
  isEnglish: Boolean,
});

const profileText = (profile) =>
  renderProfileText({
    name: props.shikigami.name,
    profile,
    listShikigami: props.listShikigami,
    listOnmyoji: props.listOnmyoji,
    isEnglish: props.isEnglish,
  });
</script>

<template>
  <div class="profile-section" v-if="profile" v-html="profileText(profile)" />
</template>
