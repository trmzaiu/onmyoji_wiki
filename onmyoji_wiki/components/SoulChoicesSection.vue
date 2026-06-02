<script setup>
import {
  findSoulByIdName,
  findSoulByIdSlug,
  getRoleClass,
  getStatClass,
  parseRoles,
  parseStats,
  parseSubstats,
} from "~/utils/helper/buildHelper";

const props = defineProps({
  souls: Object,
  shikigami: Object,
});

const soulName = (souls, id) => findSoulByIdName(souls, id);

const soulSlug = (souls, id) => findSoulByIdSlug(souls, id);
</script>

<template>
  <div v-if="shikigami.build?.length" class="build-list">
    <div v-for="build in shikigami.build" :key="build.no" class="build-card">
      <div class="build-header">
        <h3 class="build-title">Build {{ build.no }}</h3>

        <!-- ROLE BADGES -->
        <div class="build-roles">
          <span
            v-for="role in parseRoles(build.role)"
            :key="role"
            class="build-role-badge"
            :class="getRoleClass(role)"
          >
            {{ role }}
          </span>
        </div>
      </div>

      <!-- 2 / 4 / 6 stats -->
      <div class="build-main-stats">
        <span
          v-for="(stat, index) in parseStats(build.indicate)"
          :key="index"
          class="build-stat-group"
        >
          <span v-for="s in stat" :key="s" class="build-stat" :class="getStatClass(s)">
            {{ s }}
          </span>

          <span v-if="index < 2" class="build-divider">/</span>
        </span>
      </div>

      <!-- Souls -->
      <div class="build-souls-grid">
        <router-link
          v-for="id in build.souls"
          :key="id"
          :to="`/souls/${soulSlug(souls, id)}`"
          class="build-soul-item"
        >
          <img
            :src="`/assets/images/souls/icons/${soulSlug(souls, id)}_Icon.webp`"
            class="build-soul-icon"
          />

          <span class="build-soul-name">
            {{ soulName(souls, id) }}
          </span>
        </router-link>
      </div>

      <!-- Substats -->
      <div v-if="build.substats" class="build-substats">
        <span class="build-label">Substats:</span>

        <template v-for="(item, i) in parseSubstats(build.substats)" :key="i">
          <span
            v-if="item.type === 'stat'"
            class="build-stat"
            :class="getStatClass(item.value)"
          >
            {{ item.value }}
          </span>

          <span v-else class="build-separator">
            {{ item.value }}
          </span>
        </template>
      </div>

      <!-- Breakpoint -->
      <div v-if="build.breakpoint" class="build-breakpoint">
        <span class="build-label">Breakpoint:</span>

        <span
          v-for="tag in build.breakpoint.split('|').map((t) => t.trim())"
          :key="tag"
          class="build-breakpoint-tag"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Note -->
      <div v-if="build.note" class="build-note">
        <span class="build-note-text">{{ build.note }}</span>
      </div>
    </div>
  </div>
</template>
