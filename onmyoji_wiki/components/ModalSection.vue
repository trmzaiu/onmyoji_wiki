<script setup>
defineProps({
  isOpen: Boolean,
  image: String,
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div v-if="isOpen" class="image-modal">
    <div class="image-modal-overlay" @click="emit('close')"></div>

    <div class="image-modal-content">
      <button
        class="image-modal-close"
        @click="emit('close')"
      >
        ✕
      </button>

      <img
        :src="image"
        alt="Preview"
        class="image-modal-preview"
      />
    </div>
  </div>
</template>