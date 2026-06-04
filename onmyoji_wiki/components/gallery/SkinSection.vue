<script setup>
const props = defineProps({
  routeName: String,
  entity: Object,
  isShikigami: Boolean,
  isEnglish: Boolean,
});

const emit = defineEmits(["open-image"]);

const getSkinImage = (skin, index) => {
  if (skin.name.en === "Default" || skin.name.en === "Evolution") {
    return `/assets/images/${props.isShikigami ? "shikigami" : "onmyoji"}/images/${
      props.routeName
    }${skin.name.en === "Evolution" ? "_Evo" : ""}.webp`;
  }

  return `/assets/images/${props.isShikigami ? "shikigami" : "onmyoji"}/skins/${
    props.routeName
  }_Skin${
    props.entity.rarity === "SP" || props.entity.rarity === "N" ? index || "" : index - 1
  }.webp`;
};

const openImage = (skin, index) => {
  emit("open-image", getSkinImage(skin, index));
};
</script>

<template>
  <div class="skin-gallery">
    <div
      v-for="(skin, index) in entity.skins"
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
        :class="
          isEnglish
            ? !skin.name.en && skin.name.cn
              ? 'lang-zh'
              : 'skin-name-en'
            : 'skin-name-vn'
        "
      >
        {{ isEnglish ? skin.name.en || skin.name.cn : skin.name.vn }}
      </p>
    </div>
  </div>
</template>
