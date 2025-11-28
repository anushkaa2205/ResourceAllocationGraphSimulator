
export function getFixSuggestions(snapshot, cycles) {
    if (!cycles || cycles.length === 0) {
        return ["No deadlock → no fixes needed."];
    }

    const cycle = cycles[0];
    return [
        `Try removing the request edge ${cycle[0]} → ${cycle[1]}.`,
        `Or preempt the resource held by ${cycle[cycle.length - 2]}.`
    ];
}