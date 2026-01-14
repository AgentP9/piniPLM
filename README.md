# piniPLM

A modern web-based PDM/PLM (Product Data Management / Product Lifecycle Management) system for managing JT files and product structures.

## Features

- **File Upload**: Upload JT files and other 3D model formats (OBJ, STL, GLTF, GLB)
- **3D Viewer**: Interactive 3D visualization with navigation controls
  - Supports OBJ, STL, GLTF, and GLB file formats
  - Note: JT format requires conversion to supported formats (see [JT File Support](#jt-file-support))
- **Product Structure Tree**: Hierarchical view of product components
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

### Production Deployment

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

### Development Mode (with hot-reload)

For development with automatic code reloading:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will mount your local source code into the containers and enable hot-reload for both frontend and backend.

### Network Access

The application automatically detects the hostname and configures the API URL accordingly:
- When accessing via `localhost`, it uses `http://localhost:2024`
- When accessing via a network hostname (e.g., `http://hostname:2020`), it uses `http://hostname:2024`

This allows the application to work seamlessly whether accessed locally or over a network.

If you need to override the API URL, you can set the `VITE_API_URL` environment variable before building:
```bash
export VITE_API_URL=http://your-backend-host:2024
docker-compose up --build
```

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
- React 19
- Vite
- Three.js / React Three Fiber
- Axios

### Backend
- Node.js
- Express
- Multer (file uploads)
- CORS

## Production Considerations

This is an initial setup intended for development and demonstration purposes. For production deployment, consider adding:

- Rate limiting on API endpoints
- Authentication and authorization
- Input validation and sanitization
- Database (PostgreSQL, MongoDB) instead of JSON file storage
- File size limits and validation
- Error logging and monitoring
- HTTPS/TLS encryption
- Backup and recovery mechanisms
- Load balancing and scaling strategies

## JT File Support

JT (Jupiter Tessellation) is a proprietary 3D CAD format developed by Siemens. Unfortunately, there is no native JavaScript/Three.js loader for JT files.

### Current Support

The application currently supports the following 3D file formats for visualization:
- **OBJ** - Wavefront OBJ format
- **STL** - Stereolithography format
- **GLTF/GLB** - GL Transmission Format

### Working with JT Files

If you need to visualize JT files, you have the following options:

1. **Convert JT to Supported Format**: Use external tools to convert JT files to OBJ, STL, or GLTF/GLB format before uploading:
   - Siemens JT2Go (free viewer with export capabilities)
   - CAD software that supports JT import and export to other formats
   - Online conversion services

2. **Server-Side Conversion** (Future Enhancement): Integration with conversion tools like:
   - Open CASCADE Technology (OCCT)
   - Assimp (Open Asset Import Library)
   - Commercial conversion APIs

3. **Placeholder Display**: Currently, JT files can be uploaded and managed in the system (metadata, structure, etc.), but will display as placeholder boxes in the 3D viewer until converted to a supported format.

### File Upload Behavior

- Uploaded JT files are accepted and stored by the system
- Metadata management works normally for JT files
- 3D visualization shows a cube placeholder instead of the actual geometry
- A console warning indicates when JT files cannot be rendered

## License

ISC
