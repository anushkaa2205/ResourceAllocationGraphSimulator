export default function ProcessResourceTable({ processes, resources }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Current System State</h3>
      <p>Processes: {processes.join(", ")}</p>
      <p>Resources: {resources.join(", ")}</p>
    </div>
  );
}
