import { useSupabase } from "~/composables/useSupabase";

export async function getAllShikigami() {
	const supabase = useSupabase();
	const { data, error } = await supabase
		.from("Shikigami")
		.select("id, name, skills")
		.order("id", { ascending: true });

	if (error) throw error;

	return data;
}

export async function getShikigamiByName(name) {
	const supabase = useSupabase();
	const { data, error } = await supabase
		.from("Shikigami")
		.select("*")
		.eq("name->jp->>1", name)
		.single();

	if (error) throw error;

	return data;
}

export async function getShikigamiById(id) {
	const supabase = useSupabase();
	const { data, error } = await supabase
		.from("Shikigami")
		.select("name")
		.eq("id", id)
		.single();

	if (error) throw error;

	return data;
}

export async function getShikigamiByIds(ids) {
	const supabase = useSupabase();
	const { data, error } = await supabase
		.from("Shikigami")
		.select("id, name")
		.in("id", ids);

	if (error) throw error;

	return data;
}

