# piniPLM

A modern web-based PDM/PLM (Product Data Management / Product Lifecycle Management) system for managing JT files and product structures.

## Features

- **File Upload**: Upload JT files and other 3D model formats (OBJ, STL, GLTF, GLB)
- **Product Structure Tree**: Hierarchical view of product components
- **3D Viewer**: Interactive 3D visualization with navigation controls
- **Metadata Management**: Edit component properties (name, nomenclature, part number, etc.)
- **Transform Controls**: Move and rotate components in 3D space
- **Linked Views**: Tree view, 3D view, and properties panel work together
- **Persistent Storage**: All data and files stored on the backend

## Architecture

The system consists of two main components:

- **Frontend** (Port 2020): React application with Vite, Three.js for 3D visualization
- **Backend** (Port 2024): Node.js/Express API server with file storage

Both services are containerized using Docker for easy deployment.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/AgentP9/piniPLM.git
cd piniPLM
```

2. Start the application using Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:2020
   - Backend API: http://localhost:2024

## Usage

1. **Upload a File**: Click the "Upload File" button and select a JT file (or other supported 3D format)
2. **View Structure**: The uploaded component appears in the tree view on the left
3. **Select Component**: Click on a component in the tree or 3D view to select it
4. **Edit Metadata**: Modify component properties in the right panel
5. **Transform Components**: Select a component and use the transform controls in the 3D view to move it
6. **Save Changes**: Click "Save Changes" to persist modifications to the backend

## Development

### Running Without Docker

#### Backend

```bash
cd backend
npm install
npm start
```

The backend will start on http://localhost:2024

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:2020

## API Endpoints

- `POST /api/upload` - Upload a JT file
- `GET /api/files` - Get all uploaded files
- `GET /api/metadata` - Get all metadata
- `GET /api/metadata/:id` - Get metadata for a specific component
- `PUT /api/metadata/:id` - Update component metadata
- `PUT /api/transform/:id` - Update component position/rotation
- `DELETE /api/files/:id` - Delete a file and its metadata
- `GET /health` - Health check endpoint

## Technology Stack

### Frontend
- React 18
- Vite
- Three.js / React Three Fiber
- Axios

### Backend
- Node.js
- Express
- Multer (file uploads)
- CORS

## License

ISC
