import { useSupabase } from "~/composables/useSupabase";

export async function getIllustrations(shikiId) {

  const supabase = useSupabase();

  const { data, error } = await supabase
    .from("Illustration")
    .select("*")
    .contains("shiki", [shikiId])
    .order("id", { ascending: true });

  if (error) throw error;

  return data;
}