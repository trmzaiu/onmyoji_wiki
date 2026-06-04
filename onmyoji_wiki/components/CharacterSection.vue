<script setup>
const props = defineProps({
  routeName: String,
  entity: Object,
  isShikigami: Boolean,
});

</script>

<template>
  <div class="character-header">
    <div class="character-image-wrapper">
      <div class="character-image-box">
        <img
          :src="`/assets/images/${
            isShikigami ? 'shikigami' : 'onmyoji'
          }/images/${routeName}.webp`"
          :alt="entity.name.jp[1]"
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
              <div class="character-name">{{ entity.name.jp[1] }}</div>
              <img v-if="isShikigami"
                :src="`/assets/images/rarity/${entity.rarity}.webp`"
                :alt="entity.rarity"
                :class="['rarity-icon', entity.rarity === 'UR' ? 'ur' : 'normal']"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>CN</strong>
            </td>
            <td colspan="3">
              <div class="lang-zh">{{ entity.name?.cn[0] }}</div>
              <div>{{ entity.name.cn[1] }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>JP</strong>
            </td>
            <td colspan="3">
              <div class="lang-zh">{{ entity.name.jp[0] }}</div>
              <div>{{ entity.name.jp[1] }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>GL</strong>
            </td>
            <td colspan="3">
              <div>{{ entity.name.en }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>VN</strong>
            </td>
            <td colspan="3">
              <div>{{ entity.name.vn }}</div>
            </td>
          </tr>
          <tr>
            <td class="character-title" colspan="4">Voice Actor</td>
          </tr>
          <tr>
            <td>
              <strong>{{
                entity.id === 257 || entity.id === 256 ? "CN" : "JP"
              }}</strong>
            </td>
            <td colspan="3">
              <div
                class="voice-actor"
                :class="entity.id === 257 || entity.id === 256 ? 'lang-zh' : ''"
              >
                {{ entity.name.va }}
              </div>
            </td>
          </tr>
          <tr
            v-if="!['SP', 'UR', 'N'].includes(entity.rarity) && entity.id !== 193" && isShikigami
          >
            <td class="character-title" colspan="4">Evo Materials</td>
          </tr>
          <tr v-if="entity.materials && entity.materials.length && isShikigami">
            <td
              class="material-cell"
              v-for="material in entity.materials"
              :key="material.type"
            >
              <div class="material-wrapper">
                <img
                  :src="`/assets/images/materials/${material.type}.webp`"
                  :alt="material.type"
                  class="material-image"
                  :title="material.name"
                />
                <span class="material-quantity">{{ material.quantity }}</span>
              </div>
            </td>
          </tr>
          <tr v-if="entity.version !== null && isShikigami">
            <td class="character-title" colspan="4">Other Version</td>
          </tr>
          <tr v-if="entity.version !== null & isShikigami">
            <td colspan="4" class="p-1">
              <div :class="entity.version.length > 1 ? 'version-grid' : ''">
                <div v-for="ver in entity.version" :key="ver" class="version-item">
                  <a :href="`/shikigami/${ver.replace(/ /g, '_')}`">
                    <img
                      :src="`/assets/images/shikigami/shards/${ver.replace(
                        / /g,
                        '_'
                      )}_Shard.webp`"
                      class="version-image"
                      @error="
                        (event) =>
                          (event.target.src = '/assets/images/Unknown_Shard.webp')
                      "
                    />
                  </a>
                  <a class="version-name" :href="`/shikigami/${ver.replace(/ /g, '_')}`">
                    {{ ver }}
                  </a>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="isShikigami">
            <td class="character-title" colspan="4">Release Date</td>
          </tr>
          <tr v-if="isShikigami">
            <td>
              <p>CN</p>
              <p v-if="entity.date.en">GL</p>
            </td>
            <td colspan="3">
              <div>{{ entity.date.cn }}</div>
              <div v-if="entity.date.en">
                {{ entity.date.en }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
