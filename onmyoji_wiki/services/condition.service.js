import { useSupabase } from "~/composables/useSupabase";

export async function getConditions() {

	const supabase = useSupabase();

	const { data, error } = await supabase
		.from("Bio")
		.select("*")
		.order("id", { ascending: true });

	if (error) throw error;

	return data;
}

export async function getConditionsByIds(ids) {

	const supabase = useSupabase();

	if (!ids?.length) return [];

	const { data, error } = await supabase
		.from("Bio")
		.select("*")
		.in("id", ids);

	if (error) throw error;

	return data || [];
}

