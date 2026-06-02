<script setup>
defineProps({
  levels: [Array, String],
  isEnglish: Boolean,
  parseSkillDescription: Function,
});
</script>

<template>
  <table class="skill-level-table" v-if="Array.isArray(levels)">
    <tbody>
      <tr>
        <th class="level-column">
          {{ isEnglish ? "Level" : "Cấp" }}
        </th>

        <th>
          {{ isEnglish ? "Effect" : "Hiệu ứng" }}
        </th>
      </tr>

      <tr v-for="lvl in levels" :key="lvl.level">
        <td class="level-cell">
          {{ lvl.level }}
        </td>

        <td class="effect-cell" v-html="parseSkillDescription(lvl.effect)" />
      </tr>
    </tbody>
  </table>

  <div v-else>
    <p class="no-level" v-html="parseSkillDescription(levels)" />
  </div>
</template>
