export function extractEntityIds({
    skills = [],
    effects = [],
    profile = [],
    tag = "s",
}) {
    const ids = new Set();

    const regex = new RegExp(
        `<${tag}>(\\d+)<\\/${tag}>`,
        "g"
    );

    const extractFromText = (text = "") => {
        const matches = [...text.matchAll(regex)];

        matches.forEach((m) => {
            ids.add(Number(m[1]));
        });
    };

    // ---------------- SKILLS ----------------
    skills.forEach((skill) => {
        extractFromText(skill.description?.en);
        extractFromText(skill.description?.vn);

        ["en", "vn"].forEach((lang) => {
            const levels = skill.levels?.[lang];

            if (Array.isArray(levels)) {
                levels.forEach((lvl) => {
                    extractFromText(lvl.effect);
                });
            }
        });
    });

    // ---------------- EFFECTS ----------------
    effects.forEach((effect) => {
        extractFromText(effect.description?.en);
        extractFromText(effect.description?.vn);
    });

    // ---------------- PROFILE ----------------
    extractFromText(profile?.en);
    extractFromText(profile?.vn);

    return [...ids];
}