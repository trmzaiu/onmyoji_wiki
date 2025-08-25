// utils/useTags.js
import { ref } from "vue";
import { useSupabase } from "@/utils/useSupabase.ts";

export function useTags() {
    const supabase = useSupabase(); // ✅ gọi trong composable
    const tags = ref([]);
    const tagMap = ref({});

    const loadTags = async () => {
        const { data, error } = await supabase.from("Tag").select("*");
        if (error) throw error;
        tags.value = data;
        tagMap.value = Object.fromEntries(data.map(tag => [tag.id, tag]));
    };

    return { tags, tagMap, loadTags };
}
