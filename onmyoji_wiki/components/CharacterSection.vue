<script setup>

const props = defineProps({
  routeName: String,
  shikigami: Object,
});
</script>

<template>
  <div class="character-header">
    <div class="character-image-wrapper">
      <div class="character-image-box">
        <img
          :src="`/assets/images/shikigami/images/${routeName}.webp`"
          :alt="shikigami.name.jp[1]"
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
              <div class="character-name">{{ shikigami.name.jp[1] }}</div>
              <img
                :src="`/assets/images/rarity/${shikigami.rarity}.webp`"
                :alt="shikigami.rarity"
                :class="['rarity-icon', shikigami.rarity === 'UR' ? 'ur' : 'normal']"
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
              <div class="lang-zh">{{ shikigami.name?.cn[0] }}</div>
              <div>{{ shikigami.name.cn[1] }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>JP</strong>
            </td>
            <td colspan="3">
              <div class="lang-zh">{{ shikigami.name.jp[0] }}</div>
              <div>{{ shikigami.name.jp[1] }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>GL</strong>
            </td>
            <td colspan="3">
              <div>{{ shikigami.name.en }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>VN</strong>
            </td>
            <td colspan="3">
              <div>{{ shikigami.name.vn }}</div>
            </td>
          </tr>
          <tr>
            <td class="character-title" colspan="4">Voice Actor</td>
          </tr>
          <tr>
            <td>
              <strong>{{
                shikigami.id === 257 || shikigami.id === 256 ? "CN" : "JP"
              }}</strong>
            </td>
            <td colspan="3">
              <div
                class="voice-actor"
                :class="shikigami.id === 257 || shikigami.id === 256 ? 'lang-zh' : ''"
              >
                {{ shikigami.name.va }}
              </div>
            </td>
          </tr>
          <tr
            v-if="!['SP', 'UR', 'N'].includes(shikigami.rarity) && shikigami.id !== 193"
          >
            <td class="character-title" colspan="4">Evo Materials</td>
          </tr>
          <tr v-if="shikigami.materials && shikigami.materials.length">
            <td
              class="material-cell"
              v-for="material in shikigami.materials"
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
          <tr v-if="shikigami.version !== null">
            <td class="character-title" colspan="4">Other Version</td>
          </tr>
          <tr v-if="shikigami.version !== null">
            <td colspan="4" class="p-1">
              <div :class="shikigami.version.length > 1 ? 'version-grid' : ''">
                <div v-for="ver in shikigami.version" :key="ver" class="version-item">
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
          <tr>
            <td class="character-title" colspan="4">Release Date</td>
          </tr>
          <tr>
            <td>
              <p>CN</p>
              <p v-if="shikigami.date.en">GL</p>
            </td>
            <td colspan="3">
              <div>{{ shikigami.date.cn }}</div>
              <div v-if="shikigami.date.en">
                {{ shikigami.date.en }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

