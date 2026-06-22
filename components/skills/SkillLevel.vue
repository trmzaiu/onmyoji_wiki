<script setup>

const props = defineProps({
  skill: Object,
  isEnglish: Boolean,
  skillDescriptionText: Function
});

const emit = defineEmits(["change-skill",]);

</script>

<template>
  <table
    class="skill-level-table"
    v-if="
      Array.isArray(
        isEnglish
          ? skill.levels.en
          : skill.levels.vn
      )
    "
  >
    <tbody>
      <tr>
        <th class="level-column">
          {{ isEnglish ? "Level" : "Cấp" }}
        </th>
        <th>
          {{ isEnglish ? "Effect" : "Hiệu ứng" }}
        </th>
      </tr>
      <tr
        v-for="lvl in isEnglish
          ? skill.levels.en
          : skill.levels.vn"
        :key="lvl.level"
      >
        <td class="level-cell">{{ lvl.level }}</td>
        <td
          class="effect-cell"
          v-html="skillDescriptionText(lvl.effect)"
          @click="emit('change-skill', $event)"
        ></td>
      </tr>
    </tbody>
  </table>
  <div v-else>
    <p class="no-level">
      {{
        isEnglish
          ? skill.levels.en
          : skill.levels.vn
      }}
    </p>
  </div>
</template>
