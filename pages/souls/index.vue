<script setup>
import { onMounted, ref } from "vue";
import { useSupabase } from "~/composables/useSupabase";

const supabase = useSupabase();

// ======================================================
// STATE
// ======================================================

const soulList = ref([]);

const types = ["All", "ATK", "HP", "DEF", "Crit", "Crit DMG", "HIT", "RES", "Boss"];

const selectedType = ref("All");

const { language } = useLanguage();

// ======================================================
// FETCH
// ======================================================

async function fetchSouls() {
  const { data, error } = await supabase.from("Soul").select("*").order("id");

  if (!error) {
    soulList.value = data;
  }
}

// ======================================================
// RESET + REFETCH WHEN CHANGING TAB
// ======================================================

watch(selectedType, async () => {
  await fetchSouls();
});

// ======================================================
// SOULS FILTERED BY TYPE
// ======================================================

const filteredSoul = computed(() => {
  if (selectedType.value === "Boss") {
    return soulList.value.filter((soul) => soul.type === "Random Stat");
  }

  if (selectedType.value === "All") {
    return soulList.value;
  }

  return soulList.value.filter((soul) => soul.type === selectedType.value);
});

// ======================================================
// LIFECYCLE
// ======================================================

onMounted(async () => {
  document.title = "Soul";

  await Promise.all([fetchSouls()]);
});
</script>

<template>
  <div class="container" v-if="soulList.length">
    <div class="content-section">
      <!-- Header -->
      <div class="header-row">
        <h1 class="title" :class="`title-${language}`">Soul</h1>
      </div>

      <!-- Soul List -->
      <h2 class="session-title top-0" :class="`title-${language}`">Soul List</h2>
      <div class="tabs-rarity">
        <button
          v-for="type in types"
          :key="type"
          :class="{ active: selectedType === type }"
          @click="selectedType = type"
        >
          {{ type }}
        </button>
      </div>

      <TransitionGroup name="shiki-fade" tag="div" class="soul-list">
        <div v-for="soul in filteredSoul" :key="soul.id" class="shiki-item">
          <a :href="`/souls/${soul.name.en.replace(/ /g, '_')}`">
            <div class="shiki-image-wrapper">
              <img
                :src="`/assets/images/souls/icons/${soul.name.en.replace(
                  / /g,
                  '_'
                )}_Icon.webp`"
                :alt="soul.name.en"
                class="w-18 h-18 object-contain"
                @error="
                  (event) => (event.target.src = '/assets/images/Unknown_Shard.webp')
                "
              />
            </div>
          </a>
          <div class="flex flex-col items-center">
            <a class="shiki-item-name" :href="`/soul/${soul.name.en.replace(/ /g, '_')}`">
              {{ soul.name.en }}
            </a>
            <span class="shiki-item-sub-name">{{ soul.name.cn[0] }}</span>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
