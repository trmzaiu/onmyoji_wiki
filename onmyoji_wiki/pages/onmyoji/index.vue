<script setup>
import { useSupabase } from "@/utils/useSupabase.ts";
import { useTags } from "@/utils/useTags";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const supabase = useSupabase();

const onmyojiList = ref([]);

async function fetchAllOnmyoji() {
  const { data, error } = await supabase
    .from("Onmyoji")
    .select("id, name")
    .order("id", { ascending: true });
  if (error) console.error("Error fetching onmyoji:", error);
  else onmyojiList.value = data;
}

onMounted(() => {
  fetchAllOnmyoji();
});
</script>

<template>
  <div class="container">
    <div class="content-section flex flex-col gap-4">
      <div class="header-row">
        <div class="title">Onmyoji</div>
      </div>

      <div class="grid grid-cols-3 gap-4 p-3">
        <div
          v-for="onmyoji in onmyojiList"
          :key="onmyoji.id"
          class="flex flex-col items-center onmyoji-card"
        >
          <a class="cursor-pointer hover:scale-110 transition-transform duration-300" :href="`/onmyoji/${onmyoji.name.en.replace(/\s+/g, '_')}`">
            <img
              :src="`/assets/onmyoji/images/${onmyoji.name.en.replace(/\s+/g, '_')}.webp`"
              :alt="onmyoji.name.en"
              class="mb-3"
            />
          </a>

          <span class="name">
            <a :href="`/onmyoji/${onmyoji.name.en.replace(/\s+/g, '_')}`">{{
              onmyoji.name.en
            }}</a>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/pages/styles.css"></style>

<style scoped>
.name {
  font-family: "Bona Nova SC", serif;
  font-weight: bold;
}

.onmyoji-card:hover .name {
  color: var(--text-primary);
}
</style>
