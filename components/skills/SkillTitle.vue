<script setup>

const props = defineProps({
  routeName: String,
  skill: Object,
  skillIndex: Number,
  isShikigami: Boolean,
  isEnglish: Boolean,
});
</script>

<template>
  <div class="skill-top">
    <span class="skill-icon-wrapper">
      <img
        :src="`/assets/images/${
          isShikigami ? 'shikigami' : 'onmyoji'
        }/skills/${routeName}_Skill${skillIndex + 1}.webp`"
        :alt="skill.name.en"
        :title="skill.name.en"
      />
    </span>
    <span class="skill-heading">
      <div class="skill-title">
        <span class="skill-name">
          {{
            isEnglish
              ? skill.name.en
              : skill.name.vn
          }}
        </span>
        <span class="skill-sub-name">
          ({{
            skill.name.cn ===
            skill.name.jp
              ? skill.name.cn
              : skill.name.cn +
                " / " +
                skill.name.jp
          }})
        </span>
      </div>
    </span>
  </div>
</template>
