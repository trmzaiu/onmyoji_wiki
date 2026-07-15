<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useSupabase } from "~/composables/useSupabase";

const supabase = useSupabase();

// ======================================================
// STATE
// ======================================================

const latestShikigami = ref([]);

const rarities = ["UR", "SP", "SSR", "SR", "R", "N", "Crossover", "Removed"];

const selectedRarity = ref(null);

const { language } = useLanguage();

const search = ref("");

// ======================================================
// LAZY LOAD
// ======================================================

const allShikigami = ref([]);

const visibleCount = ref(20);

const pageSize = 20;

// ======================================================
// FETCH
// ======================================================

async function fetchShikigami() {
  const { data, error } = await supabase
    .from("Shikigami")
    .select("id, name, rarity, crossover, date")
    .order("id");

  if (error) {
    console.error(error);
    return;
  }

  allShikigami.value = data;
}

// ======================================================
// RESET + REFETCH WHEN CHANGING TAB
// ======================================================

watch(selectedRarity, () => {
  visibleCount.value = pageSize;
});

watch(search, () => {
  visibleCount.value = pageSize;
});

// ======================================================
// INFINITE SCROLL
// ======================================================

function handleScroll() {
  const scrollBottom = window.innerHeight + window.scrollY;

  const pageHeight = document.documentElement.offsetHeight;

  if (
    scrollBottom >= pageHeight - 300 &&
    visibleCount.value < filteredShikigami.value.length
  ) {
    visibleCount.value = Math.min(
      visibleCount.value + pageSize,
      filteredShikigami.value.length
    );
  }
}

function setupInfiniteScroll() {
  window.addEventListener("scroll", handleScroll);
}

// ======================================================
// NEW RELEASES
// ======================================================

function fetchLatestShikigami() {
  const now = new Date();

  latestShikigami.value = allShikigami.value
    .filter((shiki) => {
      if (!shiki.date?.cn) return false;

      const releaseDate = new Date(shiki.date.cn);

      const diffDays = Math.floor(
        (releaseDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return diffDays >= -30 && diffDays <= 30;
    })
    .map((shiki) => {
      const releaseDate = new Date(shiki.date.cn);

      const diffDays = Math.floor(
        (releaseDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return {
        ...shiki,
        upcoming: diffDays > 0,
        diffDays,
      };
    })
    .sort((a, b) => new Date(b.date.cn) - new Date(a.date.cn));
}

// ======================================================
// SHIKIGAMI FILTERED BY RARITY
// ======================================================

const startsWithKeyword = (text = "", keyword) =>
  text
    .toLowerCase()
    .split(/[\s\-_'・]+/)
    .some((word) => word.startsWith(keyword));

const filteredShikigami = computed(() => {
  let list = allShikigami.value;

  if (selectedRarity.value === "Removed") {
    list = list.filter((s) => s.id === 560);
  } else if (selectedRarity.value === "Crossover") {
    list = list.filter((s) => s.crossover);
  } else if (selectedRarity.value) {
    list = list.filter(
      (s) => s.rarity === selectedRarity.value && !s.crossover && s.id !== 560
    );
  }

  if (search.value) {
    const keyword = search.value.trim().toLowerCase();

    if (!keyword) return list;

    list = list.filter((s) => {
      const names = [s.name.en, s.name.vn, s.name.jp?.[1], s.name.cn?.[0]];

      return names.some((name) => startsWithKeyword(name, keyword));
    });
  }

  return list;
});

const displayedShikigami = computed(() =>
  filteredShikigami.value.slice(0, visibleCount.value)
);

watch(displayedShikigami, (list) => {
  console.log("Displayed:", list.length);
});
// ======================================================
// LIFECYCLE
// ======================================================

onMounted(async () => {
  document.title = "Shikigami";

  await fetchShikigami();

  fetchLatestShikigami();

  setupInfiniteScroll();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div class="container" v-if="allShikigami.length">
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
            <span v-if="shiki.upcoming">coming in {{ shiki.date.cn }}</span>
            <span v-else>released on {{ shiki.date.cn }}</span>
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

      <div class="search-bar">
        <input v-model.trim="search" type="text" placeholder="Search Shikigami..." />

        <i class="fa-solid fa-magnifying-glass"></i>
      </div>

      <div class="tabs-rarity">
        <button
          v-for="rarity in rarities"
          :key="rarity"
          :class="{ active: selectedRarity === rarity }"
          @click="selectedRarity = selectedRarity === rarity ? null : rarity"
        >
          {{ rarity }}
        </button>
      </div>

      <TransitionGroup name="shiki-fade" tag="div" class="shiki-list">
        <div v-for="shiki in displayedShikigami" :key="shiki.id" class="shiki-item">
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
            <a
              class="shiki-item-name"
              :href="`/shikigami/${shiki.name.jp[1].replace(/ /g, '_')}`"
            >
              {{ shiki.name.jp[1] }}
            </a>
            <span class="shiki-item-sub-name">{{ shiki.name.cn[0] }}</span>
          </div>
        </div>
      </TransitionGroup>
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
