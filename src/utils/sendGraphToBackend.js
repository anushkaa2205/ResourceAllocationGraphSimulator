// utils/sendGraphToBackend.js
export async function sendGraphToBackend(graph, includeAnalysis=false, analysisObj=null) {
  const payload = {
    processes: graph.processes,
    resources: graph.resources,
    request_edges: graph.request_edges || graph.edges?.filter(e=>e.type==='request')?.map(e=>[e.from,e.to]) || [],
    allocation_edges: graph.allocation_edges || graph.edges?.filter(e=>e.type==='allocation')?.map(e=>[e.from,e.to]) || []
  };
  if(includeAnalysis && analysisObj) payload.analysis = analysisObj;

  const res = await fetch("http://127.0.0.1:5000/analyze", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  return res.ok ? await res.json() : null;
}
