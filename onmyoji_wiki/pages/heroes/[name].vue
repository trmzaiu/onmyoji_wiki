<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const supabase = useSupabase();

const hero = ref(null);
const heroes = ref([]);
const factionHeroes = ref([]);

const faction = ref(null);
const factions = ref([]);

const heroFaction = ref(null);
const heroType = ref(null);
const heroRole = ref(null);
const heroClass = ref(null);
const heroSkills = ref([]);
const heroVoices = ref([]);
const heroItem = ref([]);

const loading = ref(false);
const isCollapsedFaction = ref(false);
const isCollapsed = ref(false);

function toggleCollapseFaction() {
  isCollapsedFaction.value = !isCollapsedFaction.value;
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

async function fetchAllHeroes() {
  loading.value = true;

  const { data: heroData, error: heroError } = await supabase
    .from("heroes")
    .select("*")
    .order("name", { ascending: true });

  if (heroError) {
    console.error("Error fetching all heroes:", heroError);
  } else {
    heroes.value = heroData;
  }

  loading.value = false;
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

async function fetchHeroesByFaction(heroFaction) {
  loading.value = true;

  const { data: factionData, error: factionError } = await supabase
    .from("factions")
    .select("*")
    .ilike("name", heroFaction)
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
    .order("name", { ascending: true });

  if (heroError) {
    console.error("Error fetching heroes:", heroError);
  } else {
    factionHeroes.value = heroData;
  }

  loading.value = false;
}

async function fetchRelatedData(table, id, refVar, label) {
  if (!id) return;
  const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
  if (error) {
    console.error(`Error fetching ${label}:`, error);
  } else {
    refVar.value = data;
  }
}

async function fetchHeroSkills(heroId) {
  const { data: skillsData, error } = await supabase
    .from("skills")
    .select(
      `
      *,
      skill_levels (
        level,
        description
      )
    `
    )
    .eq("hero_id", heroId)
    .order("id", { ascending: true })
    .order("level", { foreignTable: "skill_levels", ascending: true });

  if (error) {
    console.error("Error fetching hero skills with levels:", error);
  } else {
    heroSkills.value = skillsData;
  }
}

async function fetchHeroVoices(heroId) {
  const { data: voicesData, error } = await supabase
    .from("voice_lines")
    .select("*")
    .eq("hero_id", heroId)
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching hero voices:", error);
  } else {
    heroVoices.value = voicesData;
  }
}

async function fetchHero() {
  loading.value = true;

  const { data: heroData, error: heroError } = await supabase
    .from("heroes")
    .select("*")
    .eq("name", route.params.name)
    .single();

  if (heroError) {
    console.error("Error fetching hero:", heroError);
    loading.value = false;
    return;
  }

  hero.value = heroData;

  await Promise.all([
    fetchRelatedData("factions", heroData.faction, heroFaction, "faction"),
    fetchRelatedData("types", heroData.type, heroType, "type"),
    fetchRelatedData("roles", heroData.role, heroRole, "role"),
    fetchRelatedData("classes", heroData.class, heroClass, "class"),
    fetchRelatedData("items", heroData.item, heroItem, "item"),
  ]);

  await fetchHeroSkills(heroData.id);
  await fetchHeroVoices(heroData.id);

  loading.value = false;
}

const ascendedHeroes = computed(() =>
  factionHeroes.value.filter((hero) => hero.rarity === "Ascended")
);

const legendaryHeroes = computed(() =>
  factionHeroes.value.filter((hero) => hero.rarity === "Legendary+")
);

const commonHeroes = computed(() =>
  factionHeroes.value.filter(
    (hero) => hero.rarity !== "Ascended" && hero.rarity !== "Legendary+"
  )
);

const factionClass = computed(() => {
  if (!heroFaction.value) return "";
  return `faction-${heroFaction.value.name.replace(/\s+/g, "-").toLowerCase()}`;
});

const heroesByFaction = computed(() => {
  const groups = {};

  for (const hero of heroes.value) {
    const factionId = hero.faction;
    if (!groups[factionId]) {
      groups[factionId] = [];
    }
    groups[factionId].push(hero);
  }

  return groups;
});

onMounted(async () => {
  document.title = `Hero - ${route.params.name}`
  await fetchHero();
  await fetchAllHeroes();
  await fetchHeroesByFaction(heroFaction.value.name);

  await fetchAllFactions();
});
</script>

<template>
  <div class="main-container" v-if="hero">
    <div class="content-section">
      <h1 class="character-title">{{ hero.name }}</h1>
      <div v-if="heroVoices.length !== 0" class="character-voice">"{{ heroVoices[0].voice }}"</div>
      <p class="leading-relaxed whitespace-pre-line text-justify character-description">
        <strong>{{ hero.name }}</strong
        >{{ hero.description }}
      </p>

      <h2 class="session-title mt-5">Background</h2>
      <div class="clearfix mt-3">
        <img
          :src="hero.model_url"
          :alt="hero.name"
          class="float-right h-[300px] w-auto object-contain ml-5 mb-2"
        />
        <p
          class="leading-relaxed whitespace-pre-line text-justify character-description m-0"
        >
          {{ hero.background }}
        </p>
      </div>
      <div v-if="hero.quote !== ''" class="character-quote">"{{ hero.quote }}"</div>

      <h2 class="session-title mt-5">Skills</h2>
      <div class="skills-grid">
        <div v-for="(skill, index) in heroSkills" :key="skill.id" class="skill-card">
          <div class="skill-header flex justify-between items-center">
            <div class="flex items-center gap-3">
              <img :src="skill.icon_url" :alt="skill.name" class="skill-icon" />
              <div class="skill-name">{{ skill.name }}</div>
            </div>

            <div v-if="index === 0" class="ultimate-label">[ ULTIMATE SKILL ]</div>
            <div v-if="skill.IsPassive === true" class="passive-label">[ PASSIVE ]</div>
          </div>

          <div class="skill-description text-justify">{{ skill.description }}</div>

          <div
            v-for="level in skill.skill_levels"
            :key="level.level"
            class="skill-level-block"
          >
            <div class="skill-level-title text-justify">
              Lv{{ level.level }}:
              <span class="level-description">{{ level.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <h2 class="session-title mt-5">Signature Item</h2>
      <div class="flex items-start gap-3 mt-3">
        <img :src="heroItem.item_url" :alt="heroItem.name" class="item-icon" />
        <div class="text-justify signature-description">
          <strong>{{ heroItem.name }}</strong>
          {{ heroItem.description }}
        </div>
      </div>

      <div class="text-justify signature-description mt-3">
        <strong>Skill: {{ heroItem.skill }}</strong>
        <span>{{ heroItem.brief }}</span>
      </div>

      <div class="flex justify-between gap-5 signature-block">
        <div class="text-justify signature-description align-self-start">
          <ul>
            <li><b>[+10 Unlocks]</b> {{ heroItem.level_10 }}</li>
            <li><b>[+20 Unlocks]</b> {{ heroItem.level_20 }}</li>
            <li><b>[+30 Unlocks]</b> {{ heroItem.level_30 }}</li>
            <li><b>[+40 Unlocks]</b> {{ heroItem.level_40 }}</li>
          </ul>
        </div>
        <img :src="heroItem.icon_url" :alt="heroItem.name" class="item-skill-icon" />
      </div>

      <h2 class="session-title mt-5">Furniture Set Bonuses</h2>
      <div v-if="heroItem.room !== null" class="flex items-center justify-between gap-5 furniture-block">
        <div class="text-justify furniture-description align-self-start">
          <strong>{{ heroItem.room }}</strong>
          <ul>
            <li><b>[3/9 Mythic Pieces]</b> {{ heroItem.effect_3 }}</li>
            <li><b>[9/9 Mythic Pieces]</b> {{ heroItem.effect_9 }}</li>
          </ul>
        </div>
        <img :src="heroItem.room_url" :alt="heroItem.name" class="room-icon" />
      </div>

      <h2 class="session-title mt-5">Voice Lines</h2>
      <ul v-if="heroVoices.length !== 0" class="voice-list">
        <li v-for="voice in heroVoices" :key="voice.id">"{{ voice.voice }}"</li>
      </ul>

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
                background: #4a311c;
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
                <a href="/heroes" class="mw-collapsible-link"> Heroes </a>
              </b>
            </th>
          </tr>
        </thead>
        <tbody v-show="isCollapsed">
          <template v-for="faction in factions" :key="faction.id">
            <tr>
              <td style="background: #4a311c; text-align: center; width: 15%">
                <p>
                  <b>
                    <a :href="`/factions/${faction.name}`">{{ faction.name }}</a>
                  </b>
                </p>
              </td>
              <td class="p-3">
                <div class="flex flex-wrap gap-4">
                  <NuxtLink
                    v-for="hero in heroesByFaction[faction.id]"
                    :key="hero.id"
                    :to="`/heroes/${hero.name}`"
                    class="flex flex-col items-center text-center text-sm text-yellow-100 hover:text-yellow-300 transition"
                  >
                    <img
                      :src="hero.icon_url"
                      :alt="hero.name"
                      class="w-20 h-20 object-cover shadow-md rounded"
                    />
                    <span class="mt-1 font-bold">{{ hero.name }}</span>
                  </NuxtLink>
                </div>
              </td>
            </tr>
            <tr style="height: 3px"></tr>
          </template>
        </tbody>
      </table>

      <table
        class="mw-collapsible mw-made-collapsible mt-5"
        :class="[factionClass]"
        style="width: 100%; margin-bottom: 8px"
      >
        <thead>
          <tr>
            <th class="table-faction" colspan="2">
              <button
                class="mw-collapsible-toggle"
                style="float: right"
                @click="toggleCollapseFaction"
              >
                <span class="mw-collapsible-text" style="cursor: pointer">
                  [{{ !isCollapsedFaction ? "Expand" : "Collapse" }}]
                </span>
              </button>

              <b>
                <a :href="`/factions/${heroFaction.name}`" class="mw-collapsible-link">
                  {{ heroFaction.name }}
                </a>
              </b>
            </th>
          </tr>
        </thead>
        <tbody v-show="isCollapsedFaction">
          <tr>
            <td style="background: #372e25; text-align: center; width: 15%">
              <p>
                <b><a href="/rarities/Ascended">Ascended</a></b>
              </p>
            </td>
            <td class="p-3">
              <div class="flex flex-wrap gap-4">
                <NuxtLink
                  v-for="hero in ascendedHeroes"
                  :key="hero.name"
                  :to="`/heroes/${hero.name}`"
                  class="flex flex-col items-center text-center text-sm text-yellow-100 hover:text-yellow-300 transition"
                >
                  <img
                    :src="hero.icon_url"
                    :alt="hero.name"
                    class="w-20 h-20 object-cover shadow-md"
                  />
                  <span class="mt-1 font-bold">{{ hero.name }}</span>
                </NuxtLink>
              </div>
            </td>
          </tr>
          <tr style="height: 3px"></tr>
          <tr>
            <td style="background: #372e25; text-align: center; width: 15%">
              <p>
                <b><a href="/rarities/Legendary">Legendary</a></b>
              </p>
            </td>
            <td class="p-3">
              <div class="flex flex-wrap gap-4">
                <NuxtLink
                  v-for="hero in legendaryHeroes"
                  :key="hero.name"
                  :to="`/heroes/${hero.name}`"
                  class="flex flex-col items-center text-center text-sm text-yellow-100 hover:text-yellow-300 transition"
                >
                  <img
                    :src="hero.icon_url"
                    :alt="hero.name"
                    class="w-20 h-20 object-cover shadow-md"
                  />
                  <span class="mt-1 font-bold">{{ hero.name }}</span>
                </NuxtLink>
              </div>
            </td>
          </tr>
          <tr style="height: 3px"></tr>
          <tr>
            <td style="background: #372e25; text-align: center; width: 15%">
              <p>
                <b><a href="/rarities/Common">Common</a></b>
              </p>
            </td>
            <td class="p-3">
              <div class="flex flex-wrap gap-4">
                <NuxtLink
                  v-for="hero in commonHeroes"
                  :key="hero.name"
                  :to="`/heroes/${hero.name}`"
                  class="flex flex-col items-center text-center text-sm text-yellow-100 hover:text-yellow-300 transition"
                >
                  <img
                    :src="hero.icon_url"
                    :alt="hero.name"
                    class="w-20 h-20 object-cover shadow-md"
                  />
                  <span class="mt-1 font-bold">{{ hero.name }}</span>
                </NuxtLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      class="character-card"
      :class="['character-theme', factionClass]"
      :style="{
        '--bg-image': `url(${hero.image_url})`,
        '--position-x': `${hero.position_x}%`,
        '--position-y': `${hero.position_y}%`,
      }"
    >
      <div class="card-top-spacer" />

      <div class="character-card-image">
        <img :src="hero.image_url" :alt="hero.name" class="hero-image" />
      </div>

      <div class="card-middle-spacer" />

      <div class="character-card-title">
        <h2 class="title-text">{{ hero.title }}</h2>
        <h2 class="name-text">{{ hero.name }}</h2>
      </div>

      <div class="stat-row">
        <h3 class="stat-label">Faction</h3>
        <div class="stat-value">
          <img
            :src="`/assets/${heroFaction.name}.webp`"
            :alt="heroFaction.name"
            class="stat-icon"
          />
          <span>{{ heroFaction.name }}</span>
        </div>
      </div>

      <div class="stat-row">
        <h3 class="stat-label">Type</h3>
        <div class="stat-value">
          <img
            :src="`/assets/Type${heroType.name}.webp`"
            :alt="heroType.name"
            class="stat-icon"
          />
          <span>{{ heroType.name }}</span>
        </div>
      </div>

      <div class="stat-row">
        <h3 class="stat-label">Class</h3>
        <div class="stat-value">
          <img
            :src="`/assets/Class${heroClass.name}.webp`"
            :alt="heroClass.name"
            class="stat-icon"
          />
          <span>{{ heroClass.name }}</span>
        </div>
      </div>

      <div class="stat-row">
        <h3 class="stat-label">Role</h3>
        <div class="stat-value">
          <img
            :src="`/assets/Role${heroRole.name}.webp`"
            :alt="heroRole.name"
            class="stat-icon"
          />
          <span>{{ heroRole.name }}</span>
        </div>
      </div>

      <div class="stat-row">
        <h3 class="stat-label">Rarity</h3>
        <div class="stat-value">
          <img
            :src="`/assets/${hero.rarity}.webp`"
            :alt="hero.rarity"
            class="stat-icon"
          />
          <span>{{ hero.rarity }}</span>
        </div>
      </div>

      <div class="stat-row">
        <h3 class="stat-label">Gender</h3>
        <div class="stat-value">
          <span>{{ hero.gender }}</span>
        </div>
      </div>

      <div class="stat-row">
        <h3 class="stat-label">Race</h3>
        <div class="stat-value">
          <span>{{ hero.race }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Main Layout */
.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
}

.content-section {
  background: linear-gradient(90deg, #1a0f08be 0%, #2c1810be 50%, #1a0f08be 100%);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 105, 20, 0.3);
}

/* Character Info */
.character-title {
  font-family: "Playfair Display", sans-serif;
  font-size: 42px;
  font-weight: bold;
  color: #b29564;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

/* Content */
.character-voice,
.character-quote {
  font-family: "Noto Serif Display", serif;
  font-style: italic;
  color: #b8a082;
  font-size: 20px;
}

.character-voice {
  margin-bottom: 25px;
  border-left: 3px solid #d4af37;
  padding-left: 15px;
}

.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

.character-description {
  line-height: 1.5;
  margin-bottom: 15px;
  color: #e8dcc0;
}

.session-title {
  color: #d4af37;
  font-size: 24px;
  font-weight: bold;
  overflow: auto;
  padding: 6px 0;
  border-bottom: 1px solid #a58d3e;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.skill-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.skill-card:hover {
  transform: scale(1.02);
  background: rgba(255, 255, 255, 0.08);
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.skill-icon {
  width: 45px;
  height: 45px;
  object-fit: contain;
}

.skill-name {
  font-weight: bold;
  font-size: 16px;
  color: #ffd47d;
}

.skill-description,
.level-description {
  font-size: 14px;
  color: #e0d8c0;
  line-height: 1.4;
  font-weight: normal;
}

.skill-description {
  padding-bottom: 5px;
  border-bottom: 2px solid #ccbe613d;
}

.skill-level-block {
  margin-top: 5px;
}

.skill-level-title {
  font-weight: bold;
  font-size: 14px;
  color: #ffd47d;
}

.ultimate-label,
.passive-label {
  color: #ffcc00;
  font-weight: bold;
  font-size: 11px;
  rotate: 5deg;
  display: inline-block;
  transform: translateX(10px) translateY(-15px) rotate(5deg);
  text-shadow: 1px rgba(0, 0, 0, 0.6);
}

.passive-label {
  color: #ff9900;
  transform: translateX(8px) translateY(-18px) rotate(5deg);
}

.item-icon {
  width: 100;
  height: 100px;
  object-fit: contain;
}

.item-skill-icon {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid #facc15;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  margin-top: 12px;
}

.signature-description,
.furniture-description {
  color: #e8dcc0;
  line-height: 1.6;
}

.signature-description strong,
.furniture-description strong {
  color: #ffd47d;
  display: block;
  margin-bottom: 4px;
}

.signature-description ul,
.furniture-description ul {
  margin-top: 8px;
  padding-left: 1.5rem;
  list-style-type: disc;
  color: #f1e7c8;
}

.signature-description li,
.furniture-description li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.signature-block {
  margin-top: 10px;
  gap: 20px;
}

.furniture-block {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.room-icon {
  width: 100px;
  height: auto;
  object-fit: contain;
}

.voice-list {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  color: #e4dfd5;
}

.voice-list li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Character Card */
.faction-lightbearers {
  --theme-text: #ccbe61;
  --theme-title: #ccbe61d1;
  --theme-border: #89642d;
  --theme-bg: #372e25;
  --theme-line: linear-gradient(90deg, transparent, #bd7c2a, transparent);
  --theme-blur: linear-gradient(90deg, transparent, #ccbe611f, transparent);
}

.faction-maulers {
  --theme-text: #fbc78b;
  --theme-title: #fbc78bd1;
  --theme-border: #4a311c;
  --theme-bg: #261e1c;
  --theme-line: linear-gradient(90deg, transparent, #a72a28, transparent);
  --theme-blur: linear-gradient(90deg, transparent, #fbc78b1f, transparent);
}

.faction-wilders {
  --theme-text: #b5fefe;
  --theme-title: #b5fefed1;
  --theme-border: #246d66;
  --theme-bg: #1a2527;
  --theme-line: linear-gradient(90deg, transparent, #0d4656, transparent);
  --theme-blur: linear-gradient(90deg, transparent, #b5fefe1f, transparent);
}

.faction-graveborns {
  --theme-text: #a2f5aa;
  --theme-title: #a2f5aad1;
  --theme-border: #516d24;
  --theme-bg: #1a2527;
  --theme-line: linear-gradient(90deg, transparent, #6cec79, transparent);
  --theme-blur: linear-gradient(90deg, transparent, #a2f5aa1f, transparent);
}

.faction-celestials {
  --theme-text: #f1ebb8;
  --theme-title: #f1ebb8d1;
  --theme-border: #bb9451;
  --theme-bg: #867056;
  --theme-line: linear-gradient(90deg, transparent, #f1ebb8, transparent);
  --theme-blur: linear-gradient(90deg, transparent, #f1ebb81f, transparent);
}

.faction-hypogeans {
  --theme-text: #ce96fc;
  --theme-title: #ce96fcd1;
  --theme-border: #5d3c59;
  --theme-bg: #1c202c;
  --theme-line: linear-gradient(90deg, transparent, #75296c, transparent);
  --theme-blur: linear-gradient(90deg, transparent, #ce96fc1f, transparent);
}

.faction-dimensionals {
  --theme-text: #fff283;
  --theme-title: #fff283d1;
  --theme-border: #53e8e4;
  --theme-bg: #494354;
  --theme-line: linear-gradient(90deg, transparent, #f7e01b, transparent);
  --theme-blur: linear-gradient(90deg, transparent, #fff2831f, transparent);
}

.faction-draconis {
  --theme-text: #fbc78b;
  --theme-title: #fbc78bd1;
  --theme-border: #4a311c;
  --theme-bg: #261e1c;
  --theme-line: linear-gradient(90deg, transparent, #a72a28, transparent);
  --theme-blur: linear-gradient(90deg, transparent, #fbc78b1f, transparent);
}

.table-faction {
  background: var(--theme-bg);
  border: 3px solid var(--theme-border);
  color: var(--theme-text);
  padding: 5px;
}

.character-card {
  position: sticky;
  top: 95px;
  box-sizing: border-box;
  border-radius: 12px;
  font-family: "Barlow", sans-serif;
  border: 3px solid var(--theme-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  background-color: var(--theme-bg);
  color: var(--theme-text);
  overflow: hidden;
  z-index: 0;
  max-height: 875px;
}

.character-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--bg-image);
  background-size: 210%;
  background-position: var(--position-x) var(--position-y);
  background-repeat: no-repeat;
  opacity: 0.25;
  z-index: 0;
  pointer-events: none;
}

.card-top-spacer {
  height: 40px;
}

.card-middle-spacer {
  height: 20px;
}

.character-card-image {
  max-height: 400px;
  height: 100%;
  width: auto;
  object-fit: contain;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.hero-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease-in-out;
}

.hero-image:hover {
  transform: scale(1.1);
}

.character-card .character-card-title {
  background: var(--theme-blur);
}

.character-card-title {
  border: none;
  color: var(--theme-title);
  font-family: "Quattrocento", serif;
  text-align: center;
  position: relative;
  margin: 6px 0;
  padding: 5px 0;
}

.character-card-title .title-text {
  position: relative;
  text-transform: uppercase;
  font-size: 22px;
  padding-top: 5px;
  margin-bottom: 4px;
}

.character-card-title .title-text::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: var(--theme-line);
}

.character-card-title .name-text {
  position: relative;
  text-transform: uppercase;
  font-style: italic;
  font-weight: bold;
  font-size: 16px;
  line-height: 16px;
  padding-bottom: 6px;
  margin-top: 4px;
}

.character-card-title .name-text::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: var(--theme-line);
}

.stat-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  z-index: 10;
}

.stat-label {
  font-weight: 700;
  font-size: 14px;
  color: var(--theme-text);
  line-height: 2.5;
}

.stat-value {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-text);
}

.stat-icon {
  width: 25px;
  height: 25px;
  object-fit: contain;
}
</style>
