<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { getShikigamiByIds } from "~/services/shikigami.service";

const props = defineProps({
  routeName: String,
  entity: Object,
  roles: Array,
  type: String,
  language: {
    type: String,
    default: "en",
  },
});

const isShikigami = computed(() => props.type !== "onmyoji");

const otherVersions = ref([]);

const otherVersionMap = computed(() => {
  return new Map(otherVersions.value.map((item) => [item.id, item]));
});

const displayTitle = computed(() => {
  if (props.language === "cn") {
    return props.entity?.name?.cn?.[0] ?? "";
  }

  return props.entity?.name?.jp?.[1] ?? props.entity?.name?.jp?.[0] ?? "";
});

const loadOtherVersions = async () => {
  if (!props.entity?.version?.length) {
    otherVersions.value = [];
    return;
  }

  otherVersions.value = await getShikigamiByIds(props.entity.version);
};

const getVersionRouteName = (shiki) => {
  const jpName = shiki?.name?.jp;

  const name = Array.isArray(jpName) ? jpName[1] ?? jpName[0] : jpName;

  return (name ?? "").replace(/\s+/g, "_");
};

const getOtherVersionName = (entity) => {
  if (!entity?.name) return "";

  if (props.language === "en") {
    return entity.name.jp?.[1] || entity.name.en || "";
  }

  if (props.language === "cn") {
    return entity.name.cn?.[0] || entity.name.en || "";
  }

  return entity.name.vn || entity.name.en || "";
};

const formatChineseDate = (dateString) => {
  const date = new Date(dateString);

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

const getRoleName = (role) => {
  if (!role?.name) return "";

  if (props.language === "cn") {
    return role.name.cn || "";
  }

  return role.name.en || "";
};

const roleList = computed(() => {
  if (!props.roles) return [];

  return Array.isArray(props.roles) ? props.roles : [props.roles];
});

onMounted(loadOtherVersions);

watch(() => props.entity?.version, loadOtherVersions, { deep: true });
</script>

<template>
  <div class="character-header">
    <div class="character-image-wrapper">
      <div v-if="roleList.length" class="role-tags">
        <span
          v-for="role in roleList"
          :key="role.id"
          class="role-tag"
          :class="`role-${role.color}`"
        >
          <i class="role-decoration role-decoration-left"></i>

          {{ getRoleName(role) }}

          <i class="role-decoration role-decoration-right"></i>
        </span>
      </div>
      <div class="character-image-box">
        <img
          :src="`/assets/images/${type}/images/${routeName}.webp`"
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
              <div class="character-name" :class="`title-${language}`">
                {{ displayTitle }}
              </div>
              <img
                v-if="type === 'shikigami'"
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
              <div class="lang-cn">{{ entity.name.cn[0] }}</div>
              <div>{{ entity.name.cn[1] }}</div>
            </td>
          </tr>
          <tr>
            <td>
              <strong>JP</strong>
            </td>
            <td colspan="3">
              <div class="lang-cn">{{ entity.name.jp[0] }}</div>
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
            <td class="character-title" colspan="4" :class="`title-${language}`">
              {{ language === "cn" ? "声优" : "Voice Actor" }}
            </td>
          </tr>
          <tr>
            <td>
              <div><strong v-if="entity.name.va.cn">CN</strong></div>
              <div><strong v-if="entity.name.va.jp">JP</strong></div>
            </td>
            <td colspan="3">
              <div class="voice-actor">{{ entity.name.va.cn }}</div>
              <div class="voice-actor" :class="`lang-${language}`">
                {{ language === "cn" ? entity.name.va.jp_cn : entity.name.va.jp }}
              </div>
            </td>
          </tr>
          <tr
            v-if="
              !['SP', 'UR', 'N'].includes(entity.rarity) &&
              entity.id !== 193 &&
              isShikigami
            "
          >
            <td class="character-title" colspan="4" :class="`title-${language}`">
              {{ language === "cn" ? "觉醒材料" : "Evo Materials" }}
            </td>
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
            <td class="character-title" colspan="4" :class="`title-${language}`">
              {{ language === "cn" ? "其他版本" : "Other Version" }}
            </td>
          </tr>
          <tr v-if="entity.version?.length && isShikigami">
            <td colspan="4" class="p-1">
              <div :class="entity.version.length > 1 ? 'version-grid' : ''">
                <div v-for="verId in entity.version" :key="verId" class="version-item">
                  <template v-if="otherVersionMap.get(verId)">
                    <a
                      :href="`/shikigami/${getVersionRouteName(
                        otherVersionMap.get(verId)
                      )}`"
                    >
                      <img
                        :src="`/assets/images/shikigami/shards/${getVersionRouteName(
                          otherVersionMap.get(verId)
                        )}_Shard.webp`"
                        class="version-image"
                        @error="
                          (event) =>
                            (event.target.src = '/assets/images/Unknown_Shard.webp')
                        "
                      />
                    </a>

                    <a
                      class="version-name"
                      :class="`title-${language}`"
                      :href="`/shikigami/${getVersionRouteName(
                        otherVersionMap.get(verId)
                      )}`"
                    >
                      {{ getOtherVersionName(otherVersionMap.get(verId), language) }}
                    </a>
                  </template>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="isShikigami">
            <td class="character-title" colspan="4" :class="`title-${language}`">
              {{ language === "cn" ? "发布日期" : "Release Date" }}
            </td>
          </tr>
          <tr v-if="isShikigami">
            <td>
              <div><strong>CN</strong></div>
              <div><strong v-if="entity.date.en">GL</strong></div>
            </td>
            <td colspan="3">
              <div>
                {{
                  language === "cn" ? formatChineseDate(entity.date.cn) : entity.date.cn
                }}
              </div>
              <div v-if="entity.date.en">
                {{
                  language === "cn" ? formatChineseDate(entity.date.en) : entity.date.en
                }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
