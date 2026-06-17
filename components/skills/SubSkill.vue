<script setup>
const props = defineProps({
  routeName: String,
  shikigami: Object,
  isEnglish: Boolean,
  activeSkillIndex: Number,
});

const subSkillConfig = computed(() => {
  const id = props.shikigami.id;
  const activeSkillIndex = props.activeSkillIndex;

  if (id === 107 && activeSkillIndex === 0) {
    return {
      titleSkill: 1,
      imagePrefix: "SubSkill",
      imageOffset: -3,
      indexes: [4, 5, 6, 7],
      shortName: true,
    };
  }

  if (id === 107 && activeSkillIndex === 2) {
    return {
      titleSkill: 1,
      imagePrefix: "SubSkill",
      imageOffset: 1,
      indexes: [4, 5, 6, 7],
      shortName: true,
    };
  }

  if (id === 132 && activeSkillIndex === 2) {
    return {
      titleSkill: 1,
      imagePrefix: "SubSkill",
      imageOffset: -3,
      indexes: [4, 5, 6, 7],
      shortName: false,
    };
  }

  if (id === 141 && activeSkillIndex === 1) {
    return {
      knot: true,
      indexes: [1, 2, 3, 4],
    };
  }

  return null;
});
</script>

<template>
  <div v-if="subSkillConfig">
    <hr class="skill-divider" />

    <template v-if="!subSkillConfig.knot">
      <b class="sub-skill-title">
        {{
          isEnglish
            ? shikigami.skills[subSkillConfig.titleSkill].name.en
            : shikigami.skills[subSkillConfig.titleSkill].name.vn
        }}
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
                ? isEnglish
                  ? shikigami.skills[i - 1].name.en.split(" ")[0]
                  : shikigami.skills[i - 1].name.vn.split(" ").slice(0, 2).join(" ")
                : isEnglish
                ? shikigami.skills[i - 1].name.en
                : shikigami.skills[i - 1].name.vn
            }}
          </span>
        </div>
      </div>
    </template>

    <template v-else>
      <b class="sub-skill-title">
        {{ isEnglish ? "Knots" : "Duyên Kết" }}
      </b>

      <div class="sub-skill-grid">
        <div v-for="i in subSkillConfig.indexes" :key="i" class="sub-skill-item">
          <img :src="`/assets/images/shikigami/skills/${routeName}_Knot${i}.webp`" />

          <span class="sub-skill-name">
            {{ isEnglish ? `Type ${i}` : `Loại ${i}` }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
