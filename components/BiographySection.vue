<script setup>
import { getUIText } from "~/utils/helper/helper";

import { renderBiographyText } from "~/utils/parser/renderBiographyText";

const props = defineProps({
	routeName: String,
  shikigami: Object,
  bio: Object,
	conditions: Array,
	bioShikigamiMap: Array,
	bioOnmyojiMap: Array,
  language: String,
});

const conditionMap = computed(() => {
  return new Map((props.conditions || []).map((c) => [c.id, c]));
});

const biographyText = (bio) =>
  renderBiographyText({
    biography: bio,
    conditionMap: conditionMap.value,
    shikigami: props.shikigami,
    shikigamiMap: props.bioShikigamiMap,
    onmyojiMap: props.bioOnmyojiMap,
    language: props.language,
  });

const text = (key) => getUIText(key, props.language);
</script>

<template>
  <table class="bio-table" v-if="shikigami.id !== 402">
    <thead>
      <tr>
        <th class="table-title no-column">No.</th>
        <th class="table-title">
          {{ text("unlockConditions") }}
        </th>
        <th class="table-title reward-column">
          {{ text("reward") }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="table-cell bio-number">1</td>

        <td class="table-cell bio-text">
          <span v-html="biographyText(shikigami.biography[0])"></span>
        </td>

        <td class="table-cell reward-cell">
          <div class="reward-box">
            <img
              :src="
                ![153, 154].includes(shikigami.id)
                  ? '/assets/images/Gold.webp'
                  : `/assets/images/shikigami/skinsInfo/${routeName}_SkinInfo1.webp`
              "
              alt="Gold"
              class="reward-icon"
            />
            <span class="reward-amount">
              {{ ![153, 154].includes(shikigami.id) ? 5000 : "" }}</span
            >
          </div>
        </td>
      </tr>

      <tr>
        <td class="table-cell bio-number">2</td>
        <td class="table-cell bio-text">
          <span v-html="biographyText(shikigami.biography[1])"></span>
        </td>

        <td v-if="shikigami.id === 78" class="table-cell reward-cell">
          <div class="reward-box">
            <img src="/assets/images/Gold.webp" alt="Gold" class="reward-icon" />
            <span class="reward-amount"> 5000</span>
          </div>
        </td>

        <td v-else class="table-cell reward-cell">
          <div class="reward-box">
            <img
              :src="
                [144, 118, 131, 95].includes(shikigami.id)
                  ? '/assets/images/Jade.webp'
                  : [71, 84, 130, 117, 111].includes(shikigami.id)
                  ? '/assets/images/Black_Daruma.webp'
                  : `/assets/images/shikigami/shards/${routeName}_Shard.webp`
              "
              :alt="shikigami.name.jp"
              class="reward-icon"
            />
            <span class="reward-amount">{{
              shikigami.id >= 414 && shikigami.id <= 430
                ? 2
                : [71, 84, 130, 117, 111].includes(shikigami.id)
                ? ""
                : 10
            }}</span>
          </div>
        </td>
      </tr>

      <tr>
        <td class="table-cell bio-number">3</td>
        <td class="table-cell bio-text">
          <span v-html="biographyText(shikigami.biography[2])"></span>
        </td>

        <td class="table-cell reward-cell">
          <div class="reward-box">
            <img
              :src="
                ![144, 118, 131, 111].includes(shikigami.id)
                  ? '/assets/images/Jade.webp'
                  : `/assets/images/shikigami/shards/${routeName}_Shard.webp`
              "
              alt="Jade"
              class="reward-icon"
            />
            <span class="reward-amount">10</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
