<script setup>
const props = defineProps({
  routeName: String,
  entity: Object,
  type: String,
  language: String,
});

const emit = defineEmits(["open-image"]);

const getSkinImage = (skin, index) => {
  // Onmyoji
  if (props.type === "onmyoji") {
    if (index === 0) {
      return `/assets/images/onmyoji/images/${props.routeName}.webp`;
    }

    return `/assets/images/onmyoji/skins/${props.routeName}_Skin${index}.webp`;
  }

  // Totem
  if (props.type === "totem") {
    return `/assets/images/onmyoji/totems/${props.entity.totem[0].name.en}_Skin${
      index + 1
    }.webp`;
  }

  // Shikigami
  if (skin.name.en === "Default" || skin.name.en === "Evolution") {
    return `/assets/images/shikigami/images/${props.routeName}${
      skin.name.en === "Evolution" ? "_Evo" : ""
    }.webp`;
  }

  return `/assets/images/shikigami/skins/${props.routeName}_Skin${
    props.entity.rarity === "SP" || props.entity.rarity === "N" ? index : index - 1
  }.webp`;
};

const skins = computed(() => {
  if (props.type === "totem") {
    return props.entity.totem || [];
  }

  return props.entity.skins || [];
});

const openImage = (skin, index) => {
  emit("open-image", getSkinImage(skin, index));
};
</script>

<template>
  <div class="skin-gallery">
    <div
      v-for="(skin, index) in skins"
      :key="index"
      class="skin-card"
      :title="skin.name.en || skin.name.cn"
      @click="openImage(skin, index)"
    >
      <img
        :src="getSkinImage(skin, index)"
        :alt="skin.name.en || skin.name.cn"
        class="skin-image"
      />
      <p
        class="skin-name"
        :class="`skin-${language}`"
      >
        {{ skin.name?.[language] || skin.name?.cn }}
      </p>
    </div>
  </div>
</template>
