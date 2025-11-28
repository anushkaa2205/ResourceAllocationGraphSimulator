
export function explainDeadlock(snapshot, cycles) {
    if (!cycles || cycles.length === 0) {
        return { hasDeadlock: false, explanation: "No deadlock detected." };
    }

    const cycle = cycles[0]; 
    const explanation = `A deadlock exists because the following cycle was found: ${cycle.join(" → ")}.`;

    return {
        hasDeadlock: true,
        cycle,
        explanation,
    };
}