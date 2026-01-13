# piniPLM Frontend

React-based frontend application for the piniPLM PDM/PLM system.

## Features

- Interactive 3D viewer using Three.js and React Three Fiber
- Product structure tree view
- Comprehensive metadata editor
- File upload interface with drag & drop
- Real-time synchronization between views

## Tech Stack

- React 18
- Vite (build tool)
- Three.js / React Three Fiber / Drei (3D visualization)
- Axios (HTTP client)

## Running Locally

```bash
npm install
npm run dev
```

Application will start on port 2020.

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:2024)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
