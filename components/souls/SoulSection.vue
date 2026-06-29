<script setup>
import { computed } from "vue";
import { getUIText } from "~/utils/helper/helper";

const props = defineProps({
  routeName: String,
  entity: Object,
  language: String,
});

const text = (key) => getUIText(key, props.language);

const statMap = {
  ATK: {
    en: "ATK Bonus 15%",
    vn: "Tăng 15% ATK",
  },
  DEF: {
    en: "DEF Bonus 30%",
    vn: "Tăng 30% DEF",
  },
  HP: {
    en: "HP Bonus 15%",
    vn: "Tăng 15% HP",
  },
  Crit: {
    en: "Crit +15%",
    vn: "Tăng 15% Crit",
  },
  RES: {
    en: "Effect RES +15%",
    vn: "Tăng 15% Effect RES",
  },
  HIT: {
    en: "Effect HIT +15%",
    vn: "Tăng 15% Effect HIT",
  },
  "Crit DMG": {
    en: "Crit DMG +20%",
    vn: "Tăng 20% Crit DMG",
  },
};

const displayTitle = computed(() => {
  if (props.language === "cn") {
    return props.entity?.name?.cn?.[0] ?? "";
  }

  return props.entity?.name?.en;
});

function getType(type) {
  if (props.entity.type === "Random Stat") {
    return props.entity.effects?.[props.language] || props.entity.effects.en;
  }

  const stat = statMap[type];
  if (stat) {
    return stat?.[props.language] || stat.en;
  }

  return null;
}
</script>

<template>
  <div class="character-header">
    <div class="character-image-wrapper">
      <div class="character-image-box">
        <img
          :src="`/assets/images/souls/images/${routeName}.webp`"
          :alt="entity.name.en"
          class="character-image"
        />
      </div>
    </div>

    <!-- Name -->
    <div class="character-info">
      <table>
        <thead>
          <tr>
            <th class="character-name-header" colspan="4">
              <div class="character-name" :class="`title-${language}`">
                {{ displayTitle }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>CN</strong>
            </td>
            <td colspan="3">
              <div class="name-cn lang-cn">{{ entity.name.cn[0] }}</div>
              <div class="name-py pinyin">{{ entity.name.cn[1] }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>JP</strong>
            </td>
            <td colspan="3">
              <div class="name-cn lang-cn">{{ entity.name.jp[0] }}</div>
              <div class="name-py pinyin">
                {{ entity.name.jp[2] || entity.name.jp[1] }}
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>GL</strong>
            </td>
            <td colspan="3">
              <div class="skin-en">{{ entity.name.en }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>VN</strong>
            </td>
            <td colspan="3">
              <div class="skin-vn">{{ entity.name.vn }}</div>
            </td>
          </tr>
          <tr>
            <td class="character-title" colspan="4" :class="`title-${language}`">
              {{ text("effect") }}
            </td>
          </tr>
          <tr v-if="entity.type !== 'Random Stat'">
            <td class="soul-type text-center">
              <strong>Type</strong>
              <div>{{ entity.type }}</div>
            </td>
            <td class="text-center">
              <strong>Set 2</strong>
              <div v-html="getType(entity.type)"></div>
            </td>
          </tr>
          <tr v-else>
            <td colspan="4">
              <strong>Type</strong>
              <div>
                <span>Increases a random base stat:</span>
                <ul class="list-disc pl-5 mt-1">
                  <li>ATK Bonus 8%</li>
                  <li>DEF Bonus 16%</li>
                  <li>HP Bonus 8%</li>
                  <li>Crit +8%</li>
                  <li>Effect RES +8%</li>
                  <li>Effect HIT +8%</li>
                </ul>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.soul-type {
    border-right: 1px solid #a51919;
}
</style>
