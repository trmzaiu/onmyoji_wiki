import { useSupabase } from "~/composables/useSupabase";

export async function getEvolution(id) {

	const supabase = useSupabase();
	
	const { data, error } = await supabase
		.from("Evolution")
		.select("*")
		.eq("id", id)
		.single();

	if (error) throw error;

	return data;
}
