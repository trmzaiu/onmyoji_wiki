<script setup>
const props = defineProps({
  routeName: String,
  entity: Object,
  type: String,
  isEnglish: Boolean,
});

const getSkinInfoImage = (skin, index) => {
  // Onmyoji
  if (props.type === "onmyoji") {

    return `/assets/images/onmyoji/skinsInfo/${props.routeName}_SkinInfo${index}.webp`;
  }

  // Totem
  if (props.type === "totem") {

    return `/assets/images/onmyoji/totemsInfo/${props.entity.totem[0].name.en}_SkinInfo${index+1}.webp`;
  }

  // Shikigami
  if (skin.name?.en === "Default") {
    return (index === 0 && props.entity.id >= 201 && props.entity.id <= 217) ||
      props.entity.id === 193
      ? `/assets/images/shikigami/shards/${props.routeName}_Shard.webp`
      : `/assets/images/shikigami/skinsInfo/${props.routeName}_SkinInfo0.webp`;
  }

  if (skin.name?.en === "Evolution") {
    return `/assets/images/shikigami/skinsInfo/${props.routeName}_SkinInfo00.webp`;
  }

  return `/assets/images/shikigami/skinsInfo/${props.routeName}_SkinInfo${
    props.entity.rarity === "SP" || props.entity.rarity === "N" ? index || "" : index - 1
  }.webp`;
};

const skins = computed(() => {
  if (props.type === "totem") {
    return props.entity.totem || [];
  }

  return props.entity.skins || [];
});
</script>

<template>
  <table class="skin-info-table">
    <thead>
      <tr>
        <th class="table-title image-column">
          {{ isEnglish ? "Image" : "Ảnh" }}
        </th>
        <th class="table-title">
          {{ isEnglish ? "Name" : "Tên" }}
        </th>
        <th class="table-title">
          {{ isEnglish ? "Artist" : "Họa sĩ" }}
        </th>
        <th class="table-title obtained-column">
          {{ isEnglish ? "Obtained" : "Cách nhận" }}
        </th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(skin, index) in skins || []" :key="index">
        <tr v-if="skin && skin.obtained !== 'Cancelled'" class="skin-info-row">
          <!-- ICON -->
          <td class="table-cell skin-image-cell">
            <div class="skin-info-image-wrapper">
              <img
                :src="getSkinInfoImage(skin, index)"
                :alt="skin.name?.en || skin.name?.cn"
                class="skin-info-image"
                :class="{
                  'skin-info-scale':
                    type !== 'totem' &&
                    ((index === 0 && entity.id >= 201 && entity.id <= 217) ||
                      entity.id === 193),
                }"
              />
            </div>
          </td>

          <!-- NAME -->
          <td class="table-cell skin-name-cell">
            <template v-if="skin.name?.en === 'Default' || skin.name?.en === 'Evolution'">
              <div class="skin-main-name">
                {{ isEnglish ? skin.name?.en : skin.name?.vn }}
              </div>
            </template>

            <template v-else>
              <div class="skin-main-name">
                {{ skin.name?.en }}
              </div>

              <div class="skin-sub-name">
                <span class="lang-zh">
                  {{ skin.name?.cn }}
                </span>

                -

                <span class="skin-name-vn">
                  {{ skin.name?.vn }}
                </span>
              </div>
            </template>
          </td>

          <!-- ARTIST -->
          <td class="table-cell skin-artist-cell">
            <span class="lang-zh">
              {{ skin.artist }}
            </span>
          </td>

          <!-- OBTAINED -->
          <td class="table-cell skin-obtained-cell">
            {{ skin.obtained }}
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</template>
