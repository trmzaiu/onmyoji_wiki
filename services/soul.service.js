import { useSupabase } from "~/composables/useSupabase";

export async function getSoulsByIds(ids = []) {

	const supabase = useSupabase();

	const { data, error } = await supabase
		.from("Soul")
		.select("*")
		.in("id", ids);

	if (error) throw error;

	const order = ids.map(Number);

	return data.sort(
		(a, b) => order.indexOf(a.id) - order.indexOf(b.id)
	);
}

export async function getSoulByName(name) {
	const supabase = useSupabase();
	const { data, error } = await supabase
		.from("Soul")
		.select("*")
		.eq("name->>en", name)
		.single();

	if (error) throw error;

	return data;
}

