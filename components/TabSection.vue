<script setup>
defineProps({
  activeTab: String,
  isEnglish: Boolean,
});

const emit = defineEmits(["change"]);

const changeTab = (tab) => {
  emit("change", tab);
};
</script>

<template>
  <div class="tabs">
    <button
      class="tab tab-button"
      :class="{ active: activeTab === 'Main' }"
      @click="changeTab('Main')"
    >
      {{ isEnglish ? "Main" : "Chính Điện" }}
    </button>

    <button
      class="tab tab-button"
      :class="{ active: activeTab === 'Gallery' }"
      @click="changeTab('Gallery')"
    >
      {{ isEnglish ? "Gallery" : "Hoạ Phòng" }}
    </button>

    <button
      class="tab tab-button"
      :class="{ active: activeTab === 'Dialogue' }" 
      @click="changeTab('Dialogue')"
    >
      {{ isEnglish ? "Dialogue" : "Lời Thoại" }}
    </button>
  </div>
</template>