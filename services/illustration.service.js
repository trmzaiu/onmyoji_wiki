import { useSupabase } from "~/composables/useSupabase";

export async function getIllustrations(id, type) {

  const supabase = useSupabase();

  const { data, error } = await supabase
    .from("Illustration")
    .select("*")
    .contains(type, [id])
    .order("id", { ascending: true });

  if (error) throw error;

  return data;
}