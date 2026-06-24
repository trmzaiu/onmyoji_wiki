<script setup>
import { getUIText } from "~/utils/helper/helper";


const props = defineProps({
  skill: Object,
  language: String,
  skillDescriptionText: Function
});

const emit = defineEmits(["change-skill",]);

const text = (key) => getUIText(key, props.language);
</script>

<template>
  <table
    class="skill-level-table"
    v-if="
      Array.isArray(
       skill.levels?.[language]
      )
    "
  >
    <tbody>
      <tr>
        <th class="level-column">
          {{ text("level") }}
        </th>
        <th>
          {{ text("effect") }}
        </th>
      </tr>
      <tr
        v-for="lvl in skill.levels?.[language]"
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
        skill.levels?.[language]
      }}
    </p>
  </div>
</template>
