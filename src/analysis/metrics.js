
export function computeMetrics(snapshot) {
    const edges = snapshot.edges || [];

    return {
        totalEdges: edges.length,
        resourceHotspots: [],
        processDangerScore: {},
    };
}