<script setup>
const props = defineProps({
  routeName: String,
  entity: Object,
  isShikigami: Boolean,
  isEnglish: Boolean,
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
      <template v-for="(skin, index) in entity.skins || []" :key="index">
        <tr v-if="skin && skin.obtained !== 'Cancelled'" class="skin-info-row">
          <!-- ICON -->
          <td class="table-cell skin-image-cell">
            <div class="skin-info-image-wrapper">
              <img
                :src="
                  skin.name?.en === 'Default'
                    ? (index === 0 && entity.id >= 201 && entity.id <= 217) ||
                      entity.id === 193
                      ? `/assets/images/${isShikigami ? 'shikigami' : 'onmyoji'}/shards/${
                          routeName
                        }_Shard.webp`
                      : `/assets/images/${
                          isShikigami ? 'shikigami' : 'onmyoji'
                        }/skinsInfo/${routeName}_SkinInfo0.webp`
                    : skin.name?.en === 'Evolution'
                    ? `/assets/images/${
                        isShikigami ? 'shikigami' : 'onmyoji'
                      }/skinsInfo/${routeName}_SkinInfo00.webp`
                    : `/assets/images/${
                        isShikigami ? 'shikigami' : 'onmyoji'
                      }/skinsInfo/${routeName}_SkinInfo${
                        entity.rarity === 'SP' || entity.rarity === 'N'
                          ? index
                            ? index
                            : ''
                          : index - 1
                      }.webp`
                "
                :alt="skin.name?.en || skin.name?.cn"
                class="skin-info-image"
                :class="{
                  'skin-info-scale':
                    (index === 0 && entity.id >= 201 && entity.id <= 217) ||
                    entity.id === 193,
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
