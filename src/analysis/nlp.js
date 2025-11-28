

export function interpretCommand(text) {
    text = text.toLowerCase();

    if (text.includes("why")) return { type: "ASK_EXPLANATION" };
    if (text.includes("fix")) return { type: "ASK_FIX" };
    if (text.includes("risk")) return { type: "ASK_RISK" };

    return { type: "UNKNOWN", message: "Command not recognized." };
}