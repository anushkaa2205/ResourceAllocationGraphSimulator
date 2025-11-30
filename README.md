# Resource Allocation Graph (RAG) Simulator

An interactive **Resource Allocation Graph Simulator** built using **React + Vite**.  
It visualizes how processes request and hold resources, and automatically detects **deadlocks** by identifying cycles in the graph.

---

## 🚀 Features

### ✔️ Create Processes & Resources
- Dynamically add processes (P1, P2, …) and resources (R1, R2, …).  
- Handled inside the main application logic. (App.jsx)

### ✔️ Build Request & Allocation Edges
- **Request Edge (P → R)**: A process requests a resource.  
- **Allocation Edge (R → P)**: A resource is assigned to a process.  
- Fully implemented through dedicated UI components.

### ✔️ Deadlock Detection
- Real-time cycle detection using a custom DFS-based algorithm.  
- Detects non-trivial cycles involving two or more processes.  
- Highlights all nodes and edges participating in deadlock formation.  
- Implemented in `rag.js`.

### ✔️ Drag-and-Drop Graph Layout
- Move processes and resources freely on the canvas.  
- Edges update dynamically as nodes move.

### ✔️ Smart & Grid Auto Layout
- Buttons allow reorganizing the graph instantly.  
- Smart layout centers nodes cleanly based on count.  
- Grid layout distributes them uniformly.

### ✔️ Neon Synthwave Visual Theme
- Customized global CSS for a futuristic UI.  
- Distinct visual styling for processes, resources, edges, alerts, and highlights.

---

## 📚 Deadlock Detection Logic

Deadlocks occur when:
- A set of processes are **waiting on each other** in a circular chain.
- The cycle includes **at least two distinct processes**.

The simulator:
1. Builds a directed graph of all edges.  
2. Runs DFS to detect back-edges and generate closed cycles.  
3. Canonically normalizes cycles to prevent duplicates.  
4. Highlights each participating node and edge on the canvas.  

Algorithm is implemented in:

- `src/utils/rag.js` — full cycle detection with edge tracking  
- `src/components/DeadlockAlert.jsx` — UI display for results

---

## 🏗 Tech Stack
- **React 19**
- **Vite**
- **Modern JSX Components**
- **Custom SVG Rendering**
- **Neon Synthwave Theming**

---

## 🔧 Installation & Running

```bash
npm install
npm run dev
