# Resource Allocation Graph (RAG) Simulator

An interactive *Resource Allocation Graph Simulator* built using *React + Vite*.  
This tool visualizes how processes request and hold resources — and automatically detects *deadlocks* by finding cycles in the request/allocation graph.

---

## 🚀 Features

- Add unlimited *Processes* (P1, P2, …) & *Resources* (R1, R2, …)
- Create *Request edges* (P → R) and *Allocation edges* (R → P)
- Real-time *Deadlock Detection* using cycle detection
- *Drag-and-drop* nodes freely on canvas
- *Smart Layout* & *Grid Layout* auto placement
- Neon Synthwave themed UI with SVG rendering
- Clean alerts for deadlock or safe state

---

## 🛠 Tech Stack

### *Frontend*
- React 19
- Vite
- JavaScript (ES6+)
- HTML5 + SVG Rendering
- CSS 

### *Backend*
- Python 3.x
- Flask
- Gunicorn (Production WSGI Server)

### *Environment & Tools*
- Docker (for containerized frontend + backend)
- Node.js + npm
- ESLint + React Hooks Plugin

---

## 📦 Dependencies

### *Frontend Runtime Dependencies*
| Package       | Version     |
|--------------|-------------|
| react         | ^19.2.0     |
| react-dom     | ^19.2.0     |

---

### *Frontend Dev Dependencies*
| Package | Version |
|--------|---------|
| @eslint/js | ^9.39.1 |
| @types/react | ^19.2.2 |
| @types/react-dom | ^19.2.2 |
| @vitejs/plugin-react | ^5.1.0 |
| eslint | ^9.39.1 |
| eslint-plugin-react-hooks | ^7.0.1 |
| eslint-plugin-react-refresh | ^0.4.24 |
| globals | ^16.5.0 |
| vite | ^7.2.2 |

---

### *Backend Python Dependencies*  

| Package | Purpose |
|---------|---------|
| Flask | Backend API |
| Gunicorn | Production WSGI Server |


---
## 📥 How to Install All Dependencies

### **1. Install Frontend Dependencies**
Navigate into the frontend folder and install npm packages:

```bash
npm install
```

This installs:

react

react-dom

vite

all eslint & plugin configs and all devDependencies defined in package.json
### **2. Install Backend Python Dependencies**
Navigate to the backend folder and install Python packages:
```bash
cd Backend
pip install -r requirements.txt
```

This installs:

Flask

Gunicorn

Any other required Python modules



---
## 💡 Deadlock Detection Logic

Deadlocks occur when two or more processes are stuck waiting on each other in a *circular wait*.  
The simulator:

1. Builds a directed graph using request & allocation edges  
2. Runs a *DFS-based cycle detection*  
3. Filters out trivial cycles involving only one process  
4. Highlights the cycle visually on the graph  
5. Displays a deadlock alert with detected cycle paths  

Core algorithm implemented inside:

src/utils/rag.js

---

## 🔧 Installation & Running

```bash
git clone https://github.com/anushkaa2205/ResourceAllocationGraphSimulator
cd ResourceAllocationGraphSimulator
npm install
npm run dev
