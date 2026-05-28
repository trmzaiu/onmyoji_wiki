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

const isEnglish = ref(true);

const rarities = ["All", "UR", "SP", "SSR", "SR", "R", "N", "Crossover", "Removed"];

const selectedRarity = ref("All");

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
    query = query.eq("id", 229);
  }

  else if (
    selectedRarity.value === "Crossover"
  ) {
    query = query.eq("crossover", true);
  }

  else if (
    selectedRarity.value !== "All"
  ) {
    query = query
      .eq("rarity", selectedRarity.value)
      .neq("crossover", true)
      .neq("id", 229);
  }
  
  const { data, error } = await query.range(from, to);

  if (error) {
    console.error("Fetch error:", error);
  } else {
    // replace first page
    if (page.value === 0) {
      shikigamiList.value = data;
    }

    // append next pages
    else {
      shikigamiList.value.push(...data);
    }

    // stop loading
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

  // preload before reaching bottom
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
  const { data, error } = await supabase
    .from("Shikigami")
    .select("*")
    .order("id", { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);
    return;
  }

  const now = new Date();

  latestShikigami.value = data
    .filter((shiki) => {
      if (!shiki.date?.cn) return false;

      const releaseDate = new Date(shiki.date.cn);

      const diffDays = (now - releaseDate) / (1000 * 60 * 60 * 24);

      return diffDays <= 30;
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
// REALTIME
// ======================================================

function setupRealtime() {
  const channel = supabase
    .channel("shikigami-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "Shikigami",
      },
      (payload) => {
        console.log("Realtime change:", payload);

        // INSERT
        if (payload.eventType === "INSERT") {
          // avoid duplicates
          const exists = shikigamiList.value.some((s) => s.id === payload.new.id);

          if (!exists) {
            shikigamiList.value.unshift(payload.new);
          }
        }

        // UPDATE
        if (payload.eventType === "UPDATE") {
          const index = shikigamiList.value.findIndex((s) => s.id === payload.new.id);

          if (index !== -1) {
            shikigamiList.value[index] = payload.new;
          }
        }

        // DELETE
        if (payload.eventType === "DELETE") {
          shikigamiList.value = shikigamiList.value.filter(
            (s) => s.id !== payload.old.id
          );
        }
      }
    )
    .subscribe();

  onUnmounted(() => {
    supabase.removeChannel(channel);
  });
}

// ======================================================
// LIFECYCLE
// ======================================================

onMounted(async () => {
  document.title = "Shikigami";

  await Promise.all([fetchLatestShikigami(), fetchShikigami()]);

  setupInfiniteScroll();

  setupRealtime();
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
        <div class="title">Shikigami</div>
      </div>

      <!-- New Release  -->
      <h2 class="session-title top-0">
        New Releases
      </h2>

      <div class="latest-shiki-list">
        <div v-for="shiki in latestShikigami" :key="shiki.id" class="latest-shiki-item">
          <a :href="`/shikigami/${shiki.name.jp[1].replace(/ /g, '_')}`">
            <div class="shiki-image-wrapper">
              <img
                :src="`/assets/shikigami/shards/${shiki.name.jp[1].replace(
                  / /g,
                  '_'
                )}_Shard.webp`"
                :alt="shiki.name.jp[1]"
                class="w-24 h-24 object-contain"
                @error="(event) => (event.target.src = '/assets/Unknown_Shard.webp')"
              />

              <img
                :src="`/assets/rarity/${shiki.rarity}.webp`"
                :alt="shiki.rarity"
                class="rarity-badge"
              />

              <img
                :src="`/assets/rarity/${shiki.rarity}.webp`"
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
      >
        Shikigami List
      </h2>
      <div class="tabs">
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
                :src="`/assets/shikigami/shards/${shiki.name.jp[1].replace(
                  / /g,
                  '_'
                )}_Shard.webp`"
                :alt="shiki.name.jp[1]"
                class="w-24 h-24 object-contain"
                @error="(event) => (event.target.src = '/assets/Unknown_Shard.webp')"
              />

              <img
                :src="`/assets/rarity/${shiki.rarity}.webp`"
                :alt="shiki.rarity"
                class="rarity-badge"
              />

              <img
                :src="`/assets/rarity/${shiki.rarity}.webp`"
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

<style scoped src="@/pages/styles.css"></style>

<style scoped>
/* Tabs */
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;

  padding-bottom: 30px;
}

.tabs button {
  position: relative;

  min-width: 60px;
  padding: 7px 14px;

  border: 1px solid rgba(255, 255, 255, 0.12);

  border-radius: 6px;

  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.03), rgba(0, 0, 0, 0.15));

  color: var(--text-secondary);

  font-family: "Bona Nova SC", serif;
  font-size: 15px;
  letter-spacing: 0.5px;

  cursor: pointer;

  transition: transform 0.2s, background 0.2s, border-color 0.2s, box-shadow 0.2s,
    color 0.2s;

  overflow: hidden;
}

.tabs button::before {
  content: "";

  position: absolute;
  inset: 0;

  background: linear-gradient(
    120deg,
    transparent,
    rgba(255, 255, 255, 0.06),
    transparent
  );

  transform: translateX(-100%);
  transition: transform 0.4s;
}

.tabs button:hover::before {
  transform: translateX(100%);
}

.tabs button:hover:not(.active) {
  border-color: var(--text-primary);

  background: linear-gradient(
    to right,
    rgba(165, 25, 25, 0.18),
    rgba(255, 255, 255, 0.03)
  );

  color: #fff;

  transform: translateY(-2px);

  box-shadow: 0 0 10px rgba(165, 25, 25, 0.25), inset 0 0 12px rgba(165, 25, 25, 0.08);
}

.tabs .active {
  background: linear-gradient(to right, rgba(165, 25, 25, 0.35), rgba(165, 25, 25, 0.12));

  border-color: var(--text-primary);

  color: #fff;

  box-shadow: 0 0 14px rgba(165, 25, 25, 0.35), inset 0 0 10px rgba(255, 255, 255, 0.04);

  cursor: default;
}

.tabs button:last-child {
  width: auto;
  padding-inline: 18px;
}

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

.shiki-image-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.shiki-image-wrapper > img:first-child {
  object-fit: contain;
  border: 2px solid var(--border);
  border-radius: 50%;

  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
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

/* Rarity Badge */
.rarity-badge,
.rarity-badge-shadow {
  position: absolute;

  bottom: -4px;
  right: -4px;

  object-fit: contain;
  border-radius: 50%;
}

.rarity-badge {
  width: 36px;
  height: 36px;

  z-index: 2;
}

.rarity-badge-shadow {
  width: 42px;
  height: 42px;

  bottom: -7px;
  right: -7px;

  filter: blur(5px);
  opacity: 0.5;

  z-index: 1;

  transform: scale(1.1);
}

/* Shikigami List */
.shiki-fade-enter-active,
.shiki-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.shiki-fade-enter-from,
.shiki-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.shiki-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 40px 20px;
}

.shiki-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.shiki-item:hover .shiki-image-wrapper > img:first-child {
  border-color: var(--text-primary);
  transform: scale(1.05);
  box-shadow: 0 0 10px var(--text-primary);
}

.shiki-item a {
  color: var(--text-secondary);
  font-weight: 600;
  text-align: center;
  transition: color 0.2s;
  font-family: "Bona Nova SC", serif;
  font-size: 18px;
}

.shiki-item:hover a {
  color: var(--text-primary);
}

.shiki-item span {
  color: var(--text-tertiary);
  text-align: center;
  font-family: "Noto Serif SC", serif;
  font-size: 14px;
  cursor: default;
}

.shiki-item:hover span {
  color: var(--text-primary);
  opacity: 0.8;
}

/* Loading Dots */
.loading-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;

  padding: 30px 0;
}

.loading-dots span {
  width: 10px;
  height: 10px;

  border-radius: 50%;
  background: var(--text-primary);

  animation: bounce 0.6s infinite alternate;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  from {
    transform: translateY(0);
    opacity: 0.5;
  }

  to {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
