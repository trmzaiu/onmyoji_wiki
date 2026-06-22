import { useSupabase } from "~/composables/useSupabase";

export async function getTagsByIds(ids) {
    const supabase = useSupabase();
    const { data, error } = await supabase
        .from("Tag")
        .select("*")
        .in("id", ids);

    if (error) throw error;

    return data;
}