<script setup>
import { getUIText } from "~/utils/helper/helper";

const props = defineProps({
  routeName: String,
  shikigami: Object,
  language: String,
  skillIndex: Number,
});

const subSkillConfig = computed(() => {
  const id = props.shikigami.id;
  const skillIndex = props.skillIndex;

  if (id === 107 && skillIndex === 0) {
    return {
      titleSkill: 1,
      imagePrefix: "SubSkill",
      imageOffset: -3,
      indexes: [4, 5, 6, 7],
      shortName: true,
    };
  }

  if (id === 107 && skillIndex === 2) {
    return {
      titleSkill: 1,
      imagePrefix: "SubSkill",
      imageOffset: 1,
      indexes: [4, 5, 6, 7],
      shortName: true,
    };
  }

  if (id === 132 && skillIndex === 2) {
    return {
      titleSkill: 1,
      imagePrefix: "SubSkill",
      imageOffset: -3,
      indexes: [4, 5, 6, 7],
      shortName: false,
    };
  }

  if (id === 141 && skillIndex === 1) {
    return {
      knot: true,
      indexes: [1, 2, 3, 4],
    };
  }

  return null;
});

const text = (key) => getUIText(key, props.language);
</script>

<template>
  <div v-if="subSkillConfig">
    <hr class="skill-divider" />

    <template v-if="!subSkillConfig.knot">
      <b class="sub-skill-title">
        {{ shikigami.skills[subSkillConfig.titleSkill].name?.[language] }}
      </b>

      <div class="sub-skill-grid">
        <div v-for="i in subSkillConfig.indexes" :key="i" class="sub-skill-item">
          <img
            :src="`/assets/images/shikigami/skills/${routeName}_${
              subSkillConfig.imagePrefix
            }${i + subSkillConfig.imageOffset}.webp`"
          />

          <span class="sub-skill-name">
            {{
              subSkillConfig.shortName
                ? language === "en"
                  ? shikigami.skills[i - 1].name?.en?.split(" ")[0]
                  : language === "vn"
                  ? shikigami.skills[i - 1].name?.vn?.split(" ").slice(0, 2).join(" ")
                  : shikigami.skills[i - 1].name?.cn?.split(" ").slice(0, 2).join(" ")
                : shikigami.skills[i - 1].name?.[language] ||
                  shikigami.skills[i - 1].name?.en
            }}
          </span>
        </div>
      </div>
    </template>

    <template v-else>
      <b class="sub-skill-title">
        {{ text("knots") }}
      </b>

      <div class="sub-skill-grid">
        <div v-for="i in subSkillConfig.indexes" :key="i" class="sub-skill-item">
          <img :src="`/assets/images/shikigami/skills/${routeName}_Knot${i}.webp`" />

          <span class="sub-skill-name">
            {{ `${text("knots")} ${i}` }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
