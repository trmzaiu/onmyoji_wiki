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
  <div class="main-container">
    <div class="content-section flex flex-col gap-4">
      <div class="header-row">
        <div class="character-title">Onmyoji</div>
      </div>

      <div class="grid grid-cols-3 gap-4 p-3">
        <div
          v-for="onmyoji in onmyojiList"
          :key="onmyoji.id"
          class="flex flex-col items-center"
        >
          <a class="cursor-pointer hover:scale-110 transition-transform duration-300" :href="`/onmyoji/${onmyoji.name.en.replace(/\s+/g, '_')}`">
            <img
              :src="`/assets/onmyoji/images/${onmyoji.name.en.replace(/\s+/g, '_')}.webp`"
              :alt="onmyoji.name.en"
              class="mb-3"
            />
          </a>

          <span class="font-bold text-black hover:text-[#a51919] cursor-pointer">
            <a :href="`/onmyoji/${onmyoji.name.en.replace(/\s+/g, '_')}`">{{
              onmyoji.name.en
            }}</a>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  max-width: 1200px;
  min-width: 900px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  gap: 30px;
}

.content-section {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a3a4d;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
