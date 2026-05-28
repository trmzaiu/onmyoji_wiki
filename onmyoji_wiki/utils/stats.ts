import { STAT_RANKS } from "~/constants/statRanks";

export function getStatRank(type: string, value: number) {
    const ranges = STAT_RANKS[type];

    if (!ranges) {
        return "D";
    }

    const matchedRank = ranges.find(
        ([, min, max]) => value >= min && value <= max
    );

    return matchedRank?.[0] || "D";
}

export function getStatRankImage(type: string, value: number) {
    return `/assets/stats/${getStatRank(type, value)}.webp`;
}