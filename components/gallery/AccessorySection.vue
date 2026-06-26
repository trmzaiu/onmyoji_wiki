<script setup>
import { renderSkinText } from "~/utils/parser/renderSkinText";
import { getUIText } from "~/utils/helper/helper";

const props = defineProps({
  routeName: String,
  entity: Object,
  language: String,
});

const skinText = (text) =>
  renderSkinText({
    text,
    shikigami: props.entity,
    language: props.language,
  });

  const text = (key) => getUIText(key, props.language);
</script>

<template>
  <table
    v-if="entity.accessories && entity.accessories.length"
    class="bio-accessory-table"
  >
    <thead>
      <tr>
        <th class="table-title bio-no-column">No.</th>

        <th class="table-title accessory-image-column">
          {{ text("image") }}
        </th>

        <th class="table-title">
          {{ text("name") }}
        </th>

        <th class="table-title accessory-type-column">
          {{ text("type") }}
        </th>

        <th class="table-title">
          {{ text("obtained") }}
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="(bio, index) in entity.accessories"
        :key="index"
        class="bio-accessory-row"
      >
        <!-- No -->
        <td class="table-cell bio-number">
          {{ index + 4 }}
        </td>

        <!-- Image -->
        <td class="table-cell accessory-image-cell">
          <div class="accessory-image-wrapper">
            <img
              :src="`/assets/images/shikigami/bios/${routeName}_Bio${index + 4}.webp`"
              :alt="bio.name.en || bio.name.cn"
              class="accessory-image"
            />
          </div>
        </td>

        <!-- Name -->
        <td class="table-cell accessory-name-cell">
          <div class="accessory-main-name">
            {{ bio.name.en }}
          </div>

          <div class="accessory-sub-name">
            <span class="skin-cn">
              {{ bio.name.cn }}
            </span>

            –

            <span class="skin-vn">
              {{ bio.name.vn }}
            </span>
          </div>
        </td>

        <!-- Type -->
        <td class="table-cell accessory-type-cell">
          {{ bio.type }}
        </td>

        <!-- Obtained -->
        <td
          class="table-cell accessory-obtained-cell"
          v-html="skinText(bio.obtained)"
        ></td>
      </tr>
    </tbody>
  </table>
</template>
