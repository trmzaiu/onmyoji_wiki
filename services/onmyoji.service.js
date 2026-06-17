import { useSupabase } from "~/composables/useSupabase";

export async function getAllOnmyoji() {
	const supabase = useSupabase();
	const { data, error } = await supabase
		.from("Onmyoji")
		.select("id, name")
		.order("id", { ascending: true });

	if (error) throw error;

	return data;
}

export async function getOnmyojiByIds(ids) {
	const supabase = useSupabase();
	const { data, error } = await supabase
		.from("Onmyoji")
		.select("id, name")
		.in("id", ids);

	if (error) throw error;

	return data;
}

export async function getOnmyojiByName(name) {
	const supabase = useSupabase();
	const { data, error } = await supabase
		.from("Onmyoji")
		.select("*")
		.eq("name->>en", name)
		.single();

	if (error) throw error;

	return data;
}
