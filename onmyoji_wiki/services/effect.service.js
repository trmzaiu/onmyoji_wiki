import { useSupabase } from "~/composables/useSupabase";

export async function getEffectsByIds(ids = []) {

	const supabase = useSupabase();

	if (!ids.length) return [];

	const { data, error } = await supabase
		.from("Effect")
		.select("*")
		.in("id", ids);

	if (error) throw error;

	return data || [];
}

export async function getEffectsById(id) {

	const supabase = useSupabase();

	const { data, error } = await supabase
		.from("Effect")
		.select("color")
		.eq("id", id)
		.single();

	if (error) throw error;

	return data || [];
}