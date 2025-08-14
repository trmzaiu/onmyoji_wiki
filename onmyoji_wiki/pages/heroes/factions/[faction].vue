<script setup>
import { checkConnection } from "@/utils/checkConnection.ts";
import { useSupabase } from "@/utils/useSupabase.ts";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const supabase = useSupabase();

const heroes = ref([]);
const factions = ref([]);
const faction = ref(null);
const loading = ref(false);

const isCollapsed = ref(false);

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

async function fetchAllFactions() {
  loading.value = true;

  const { data: factionData, error: factionError } = await supabase
    .from("factions")
    .select("*")
    .order("id", { ascending: true });

  if (factionError) {
    console.error("Error fetching all factions:", factionError);
  } else {
    factions.value = factionData;
  }

  loading.value = false;
}

async function fetchHeroesByFaction() {
  loading.value = true;

  const { data: factionData, error: factionError } = await supabase
    .from("factions")
    .select("*")
    .eq("name", route.params.faction)
    .single();

  if (factionError || !factionData) {
    console.error("Failed to find faction:", factionError);
    loading.value = false;
    return;
  }

  faction.value = factionData;

  const { data: heroData, error: heroError } = await supabase
    .from("heroes")
    .select("*")
    .eq("faction", factionData.id)
    .order("id", { ascending: true });

  if (heroError) {
    console.error("Error fetching heroes:", heroError);
  } else {
    heroes.value = heroData;
  }

  loading.value = false;
}

const ascendedHeroes = computed(() =>
  heroes.value.filter((hero) => hero.rarity === "Ascended")
);

const legendaryPlusHeroes = computed(() =>
  heroes.value.filter((hero) => hero.rarity === "Legendary+")
);

const commonHeroes = computed(() =>
  heroes.value.filter(
    (hero) => hero.rarity !== "Ascended" && hero.rarity !== "Legendary+"
  )
);

onMounted(async () => {
  document.title = `Faction - ${route.params.faction}`
  const ok = await checkConnection();
  if (!ok) {
    alert("Cannot connect to Supabase!");
    return;
  }

  await fetchHeroesByFaction();
  await fetchAllFactions();
});

watch(() => route.params.faction, fetchHeroesByFaction);
</script>

<template>
  <div class="max-w-screen-lg mx-auto p-5">
    <div class="w-full content-section">
      <!-- Faction Title -->
      <h1 class="title">{{ faction?.name }}</h1>

      <!-- Faction Description -->
      <div class="flex gap-6 items-start">
        <div class="flex-1">
          <p
            class="leading-relaxed whitespace-pre-line text-justify character-description"
          >
            <strong>{{ faction?.name }}</strong>
            {{ faction?.description }}
          </p>
        </div>

        <div class="h-[70px] shrink-0">
          <img
            :src="`/assets/${faction?.name}.webp`"
            :alt="faction?.name"
            class="w-auto h-full object-cover"
          />
        </div>
      </div>

      <!-- Heroes Heading -->
      <h2 class="session-title mt-5">Heroes</h2>

      <!-- Loading State -->
      <div v-if="loading" class="text-gray-400 italic">Loading heroes...</div>

      <!-- No Heroes Found -->
      <div v-else-if="heroes.length === 0" class="text-gray-400 italic">
        No heroes found in this faction.
      </div>

      <section v-if="ascendedHeroes.length">
        <h2 class="tier-title">Ascended Tier</h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="hero in ascendedHeroes"
            :key="hero.id"
            class="overflow-hidden transform transition-transform hover:scale-105 duration-300 bg-transparent"
          >
            <NuxtLink :to="`/heroes/${hero.name}`">
              <img
                :src="hero.banner_url"
                :alt="hero.name"
                class="w-full h-70 object-contain"
              />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Legendary+ -->
      <section v-if="legendaryPlusHeroes.length">
        <h2 class="tier-title">Legendary+ Tier</h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="hero in legendaryPlusHeroes"
            :key="hero.id"
            class="overflow-hidden transform transition-transform hover:scale-105 duration-300 bg-transparent"
          >
            <NuxtLink :to="`/heroes/${hero.name}`">
              <img
                :src="hero.banner_url"
                :alt="hero.name"
                class="w-full h-60 object-contain"
              />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Common -->
      <section v-if="commonHeroes.length">
        <h2 class="tier-title">Common Tier</h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="hero in commonHeroes"
            :key="hero.id"
            class="overflow-hidden transform transition-transform hover:scale-105 duration-300 bg-transparent"
          >
            <NuxtLink :to="`/heroes/${hero.name}`">
              <img
                :src="hero.banner_url"
                :alt="hero.name"
                class="w-full h-60 object-contain"
              />
            </NuxtLink>
          </div>
        </div>
      </section>

      <h2 class="session-title mt-5">Description</h2>
      <div class="flex gap-6 items-start mt-3">
        <div class="flex-1">
          <p
            class="leading-relaxed whitespace-pre-line text-justify character-description"
          >
            {{ faction?.information }}
          </p>
        </div>

        <div class="h-[300px] shrink-0">
          <img
            :src="`/assets/${faction?.name}Card.webp`"
            :alt="faction?.name"
            class="w-auto h-full object-cover"
          />
        </div>
      </div>

      <h2 class="session-title mt-5">References</h2>
      <table
        class="mw-collapsible mw-made-collapsible mt-3"
        style="width: 100%; margin-bottom: 8px"
      >
        <thead>
          <tr>
            <th
              colspan="2"
              style="
                background: #372e25;
                border: 3px solid #89642d;
                color: #ccbe61;
                padding: 5px;
              "
            >
              <button
                class="mw-collapsible-toggle"
                style="float: right"
                @click="toggleCollapse"
              >
                <span class="mw-collapsible-text" style="cursor: pointer">
                  [{{ !isCollapsed ? "Expand" : "Collapse" }}]
                </span>
              </button>

              <b>
                <a href="/factions" class="mw-collapsible-link"> Factions </a>
              </b>
            </th>
          </tr>
        </thead>
        <tbody v-show="isCollapsed">
          <tr>
            <td class="p-3">
              <div class="flex flex-wrap gap-4">
                <NuxtLink
                  v-for="faction in factions"
                  :key="faction.id"
                  :to="`/heroes/factions/${faction.name}`"
                  class="flex flex-col items-center text-center text-sm text-yellow-100 hover:text-yellow-300 transition"
                >
                  <img
                    :src="`/assets/${faction?.name}.webp`"
                    :alt="faction.name"
                    class="w-20 h-20 object-cover"
                  />
                  <span class="mt-1 font-bold">{{ faction.name }}</span>
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
.content-section {
  background: linear-gradient(90deg, #1a0f08be 0%, #2c1810be 50%, #1a0f08be 100%);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 105, 20, 0.3);
}

.title {
  font-size: 36px;
  font-weight: bold;
  color: #d4af37;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

.session-title {
  color: #d4af37;
  font-size: 24px;
  font-weight: bold;
  overflow: auto;
  padding: 6px 0;
  border-bottom: 1px solid #a58d3e;
}

.tier-title {
  font-size: 1.125rem; /* slightly smaller */
  font-weight: 500;
  color: #eab308; /* yellow-400 with a bit more gold tone */
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
  border-left: 4px solid #facc15;
  background: rgba(255, 255, 255, 0.05);
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  border-radius: 4px;
}
</style>
