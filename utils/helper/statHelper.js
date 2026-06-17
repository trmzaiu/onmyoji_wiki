import { STAT_RANKS } from "~/constants/statRanks";

export function getStatRank(type, value) {
    const ranges = STAT_RANKS[type];

    if (!ranges) {
        return "D";
    }

    const matchedRank = ranges.find(
        ([, min, max]) => value >= min && value <= max
    );

    return matchedRank?.[0] || "D";
}

export function getStatRankImage(type, value) {
    return `/assets/images/stats/${getStatRank(type, value)}.webp`;
}