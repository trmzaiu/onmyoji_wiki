<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useSupabase } from "~/composables/useSupabase";

const supabase = useSupabase();

// ======================================================
// STATE
// ======================================================

const shikigamiList = ref([]);
const latestShikigami = ref([]);
const tabLoading = ref(false);

const rarities = ["All", "UR", "SP", "SSR", "SR", "R", "N", "Crossover", "Removed"];

const selectedRarity = ref("All");

const { language } = useLanguage();

// ======================================================
// LAZY LOAD
// ======================================================

const page = ref(0);

const limit = 20;

const loading = ref(false);

const hasMore = ref(true);

// ======================================================
// FETCH
// ======================================================

async function fetchShikigami() {
  if (loading.value || !hasMore.value) return;

  loading.value = true;

  const from = page.value * limit;
  const to = from + limit - 1;

  let query = supabase.from("Shikigami").select("*").order("id", { ascending: true });

  if (selectedRarity.value === "Removed") {
    query = query.eq("id", 560);
  } else if (selectedRarity.value === "Crossover") {
    query = query.eq("crossover", true);
  } else if (selectedRarity.value !== "All") {
    query = query
      .eq("rarity", selectedRarity.value)
      .neq("crossover", true)
      .neq("id", 560);
  }

  const { data, error } = await query.range(from, to);

  if (error) {
    console.error("Fetch error:", error);
  } else {
    if (page.value === 0) {
      shikigamiList.value = data;
    } else {
      shikigamiList.value.push(...data);
    }

    if (data.length < limit) {
      hasMore.value = false;
    }

    page.value++;
  }

  loading.value = false;
}

// ======================================================
// RESET + REFETCH WHEN CHANGING TAB
// ======================================================

watch(selectedRarity, async () => {
  tabLoading.value = true;

  page.value = 0;

  hasMore.value = true;

  await fetchShikigami();

  tabLoading.value = false;
});

// ======================================================
// INFINITE SCROLL
// ======================================================

function handleScroll() {
  const scrollBottom = window.innerHeight + window.scrollY;

  const pageHeight = document.documentElement.offsetHeight;

  if (scrollBottom >= pageHeight - 300) {
    fetchShikigami();
  }
}

function setupInfiniteScroll() {
  window.addEventListener("scroll", handleScroll);
}

// ======================================================
// NEW RELEASES
// ======================================================

async function fetchLatestShikigami() {
  const { data, error } = await supabase.from("Shikigami").select("*");

  if (error) {
    console.error(error);
    return;
  }

  const now = new Date();

  latestShikigami.value = data
    .filter((shiki) => {
      if (!shiki.date?.cn) return false;

      const releaseDate = new Date(shiki.date.cn);

      const diffDays = Math.floor(
        (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return diffDays >= 0 && diffDays <= 30;
    })
    .sort((a, b) => new Date(b.date.cn) - new Date(a.date.cn));
}

// ======================================================
// SHIKIGAMI FILTERED BY RARITY
// ======================================================

const filteredShikigami = computed(() => {
  if (selectedRarity.value === "Removed") {
    return shikigamiList.value.filter((shiki) => shiki.id === 229);
  }

  if (selectedRarity.value === "Crossover") {
    return shikigamiList.value.filter((shiki) => shiki.crossover === true);
  }

  if (selectedRarity.value === "All") {
    return shikigamiList.value;
  }

  return shikigamiList.value.filter(
    (shiki) =>
      shiki.rarity === selectedRarity.value && !shiki.crossover && shiki.id !== 229
  );
});

// ======================================================
// LIFECYCLE
// ======================================================

onMounted(async () => {
  document.title = "Shikigami";

  await Promise.all([fetchLatestShikigami(), fetchShikigami()]);

  setupInfiniteScroll();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div class="container" v-if="shikigamiList.length">
    <div class="content-section">
      <!-- Header -->
      <div class="header-row">
        <h1 class="title" :class="`title-${language}`">Shikigami</h1>
      </div>

      <!-- New Release  -->
      <h2 class="session-title top-0" :class="`title-${language}`" v-if="latestShikigami">
        New Releases
      </h2>

      <div class="latest-shiki-list">
        <div v-for="shiki in latestShikigami" :key="shiki.id" class="latest-shiki-item">
          <a :href="`/shikigami/${shiki.name.jp[1].replace(/ /g, '_')}`">
            <div class="shiki-image-wrapper">
              <img
                :src="`/assets/images/shikigami/shards/${shiki.name.jp[1].replace(
                  / /g,
                  '_'
                )}_Shard.webp`"
                :alt="shiki.name.jp[1]"
                class="w-24 h-24 object-contain"
                @error="
                  (event) => (event.target.src = '/assets/images/Unknown_Shard.webp')
                "
              />

              <img
                :src="`/assets/images/rarity/${shiki.rarity}.webp`"
                :alt="shiki.rarity"
                class="rarity-badge"
              />

              <img
                :src="`/assets/images/rarity/${shiki.rarity}.webp`"
                :alt="shiki.rarity"
                class="rarity-badge-shadow"
              />
            </div>
          </a>
          <div class="flex flex-col items-center">
            <a :href="`/shikigami/${shiki.name.jp[1].replace(/ /g, '_')}`">
              {{ shiki.name.jp[1] }}
            </a>
            <span>{{ shiki.name.cn[0] }}</span>
            <span>released on {{ shiki.date.cn }}</span>
          </div>
        </div>
      </div>

      <!-- Shikigame List -->
      <h2
        class="session-title"
        :class="[!latestShikigami ? 'top-0' : '', `title-${language}`]"
      >
        Shikigami List
      </h2>
      <div class="tabs-rarity">
        <button
          v-for="rarity in rarities"
          :key="rarity"
          :class="{ active: selectedRarity === rarity }"
          @click="selectedRarity = rarity"
        >
          {{ rarity }}
        </button>
      </div>

      <TransitionGroup name="shiki-fade" tag="div" class="shiki-list">
        <div v-for="shiki in filteredShikigami" :key="shiki.id" class="shiki-item">
          <a :href="`/shikigami/${shiki.name.jp[1].replace(/ /g, '_')}`">
            <div class="shiki-image-wrapper">
              <img
                :src="`/assets/images/shikigami/shards/${shiki.name.jp[1].replace(
                  / /g,
                  '_'
                )}_Shard.webp`"
                :alt="shiki.name.jp[1]"
                class="w-24 h-24 object-contain"
                @error="
                  (event) => (event.target.src = '/assets/images/Unknown_Shard.webp')
                "
              />

              <img
                :src="`/assets/images/rarity/${shiki.rarity}.webp`"
                :alt="shiki.rarity"
                class="rarity-badge"
              />

              <img
                :src="`/assets/images/rarity/${shiki.rarity}.webp`"
                :alt="shiki.rarity"
                class="rarity-badge-shadow"
              />
            </div>
          </a>
          <div class="flex flex-col items-center">
            <a class="shiki-item-name" :href="`/shikigami/${shiki.name.jp[1].replace(/ /g, '_')}`">
              {{ shiki.name.jp[1] }}
            </a>
            <span class="shiki-item-sub-name">{{ shiki.name.cn[0] }}</span>
          </div>
        </div>
      </TransitionGroup>

      <div class="loading-dots" v-if="loading">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/assets/css/styles.css"></style>

<style scoped>
/* Latest Shikigami */
.latest-shiki-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.latest-shiki-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 300px;
}

.latest-shiki-item .shiki-image-wrapper > img:first-child {
  width: 100px;
  height: 100px;
}

.latest-shiki-item:hover .shiki-image-wrapper > img:first-child {
  border-color: var(--text-primary);
  transform: scale(1.05);
  box-shadow: 0 0 10px var(--text-primary);
}

.latest-shiki-item a {
  color: var(--text-secondary);
  font-weight: 600;
  text-align: center;
  transition: color 0.2s;
  font-family: "Bona Nova SC", serif;
  font-size: 20px;
}

.latest-shiki-item:hover a {
  color: var(--text-primary);
}

.latest-shiki-item span {
  color: var(--text-tertiary);
  font-weight: 500;
  text-align: center;
  font-family: "Noto Serif SC", serif;
  cursor: pointer;
}

.latest-shiki-item span:first-of-type {
  font-size: 16px;
}

.latest-shiki-item span:last-of-type {
  font-size: 13px;
}

.latest-shiki-item:hover span {
  color: var(--text-primary);
  opacity: 0.8;
}
</style>
