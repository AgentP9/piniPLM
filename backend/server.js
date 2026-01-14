const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 2024;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept JT files and for demo purposes, also accept other 3D formats
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.jt' || ext === '.obj' || ext === '.stl' || ext === '.gltf' || ext === '.glb') {
      cb(null, true);
    } else {
      cb(new Error('Only JT and other 3D model files are allowed'));
    }
  }
});

// Data store (in-memory for simplicity, can be replaced with a database)
let dataStore = {
  files: [],
  metadata: {}
};

// Load data from file if exists
const dataFile = path.join(__dirname, 'data', 'data.json');
if (fs.existsSync(dataFile)) {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    dataStore = JSON.parse(data);
    
    // Migration: Add instanceId to existing children that don't have one
    Object.values(dataStore.metadata).forEach(part => {
      if (part.children && part.children.length > 0) {
        part.children.forEach(child => {
          if (!child.instanceId) {
            child.instanceId = uuidv4();
          }
        });
      }
    });
    
    // Save migrated data
    saveData();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(dataStore, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Routes

// Upload JT file
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = uuidv4();
    const fileData = {
      id: fileId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };

    dataStore.files.push(fileData);
    
    // Initialize metadata for the file
    dataStore.metadata[fileId] = {
      id: fileId,
      name: path.parse(req.file.originalname).name,
      nomenclature: '',
      description: '',
      partNumber: '',
      revision: '1',
      material: '',
      weight: '',
      cost: '',
      supplier: '',
      status: 'Draft',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      children: []
    };

    saveData();

    res.json({
      success: true,
      file: fileData,
      metadata: dataStore.metadata[fileId]
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all files
app.get('/api/files', (req, res) => {
  res.json(dataStore.files);
});

// Get file metadata
app.get('/api/metadata/:id', (req, res) => {
  const metadata = dataStore.metadata[req.params.id];
  if (!metadata) {
    return res.status(404).json({ error: 'Metadata not found' });
  }
  res.json(metadata);
});

// Get all metadata
app.get('/api/metadata', (req, res) => {
  res.json(dataStore.metadata);
});

// Update metadata
app.put('/api/metadata/:id', (req, res) => {
  const id = req.params.id;
  if (!dataStore.metadata[id]) {
    return res.status(404).json({ error: 'Metadata not found' });
  }

  dataStore.metadata[id] = {
    ...dataStore.metadata[id],
    ...req.body,
    modifiedAt: new Date().toISOString()
  };

  saveData();
  res.json(dataStore.metadata[id]);
});

// Update component transform (position and rotation)
app.put('/api/transform/:id', (req, res) => {
  const id = req.params.id;
  if (!dataStore.metadata[id]) {
    return res.status(404).json({ error: 'Component not found' });
  }

  const { position, rotation } = req.body;
  
  if (position) {
    dataStore.metadata[id].position = position;
  }
  
  if (rotation) {
    dataStore.metadata[id].rotation = rotation;
  }

  dataStore.metadata[id].modifiedAt = new Date().toISOString();

  saveData();
  res.json(dataStore.metadata[id]);
});

// Add child part to parent part
app.post('/api/parts/:parentId/children', (req, res) => {
  const parentId = req.params.parentId;
  const { childId, position, rotation } = req.body;

  if (!dataStore.metadata[parentId]) {
    return res.status(404).json({ error: 'Parent part not found' });
  }

  if (!dataStore.metadata[childId]) {
    return res.status(404).json({ error: 'Child part not found' });
  }

  // Initialize children array if not exists
  if (!dataStore.metadata[parentId].children) {
    dataStore.metadata[parentId].children = [];
  }

  // Add child with relationship data and unique instance ID
  // Multiple instances of the same part are allowed
  const instanceId = uuidv4();
  dataStore.metadata[parentId].children.push({
    instanceId,
    id: childId,
    position: position || { x: 0, y: 0, z: 0 },
    rotation: rotation || { x: 0, y: 0, z: 0 }
  });

  dataStore.metadata[parentId].modifiedAt = new Date().toISOString();
  saveData();
  res.json(dataStore.metadata[parentId]);
});

// Remove child part from parent part
app.delete('/api/parts/:parentId/children/:instanceId', (req, res) => {
  const { parentId, instanceId } = req.params;

  if (!dataStore.metadata[parentId]) {
    return res.status(404).json({ error: 'Parent part not found' });
  }

  if (!dataStore.metadata[parentId].children) {
    return res.status(404).json({ error: 'No children found' });
  }

  const childIndex = dataStore.metadata[parentId].children.findIndex(
    c => c.instanceId === instanceId
  );

  if (childIndex === -1) {
    return res.status(404).json({ error: 'Child instance not found in parent' });
  }

  dataStore.metadata[parentId].children.splice(childIndex, 1);
  dataStore.metadata[parentId].modifiedAt = new Date().toISOString();
  saveData();
  res.json(dataStore.metadata[parentId]);
});

// Replace child part in parent part
app.put('/api/parts/:parentId/children/:instanceId', (req, res) => {
  const { parentId, instanceId } = req.params;
  const { newChildId, position, rotation } = req.body;

  if (!dataStore.metadata[parentId]) {
    return res.status(404).json({ error: 'Parent part not found' });
  }

  if (!dataStore.metadata[newChildId]) {
    return res.status(404).json({ error: 'New child part not found' });
  }

  if (!dataStore.metadata[parentId].children) {
    return res.status(404).json({ error: 'No children found' });
  }

  const childIndex = dataStore.metadata[parentId].children.findIndex(
    c => c.instanceId === instanceId
  );

  if (childIndex === -1) {
    return res.status(404).json({ error: 'Old child instance not found in parent' });
  }

  // Replace the child while preserving instanceId and updating position/rotation
  dataStore.metadata[parentId].children[childIndex] = {
    instanceId: instanceId,
    id: newChildId,
    position: position || dataStore.metadata[parentId].children[childIndex].position,
    rotation: rotation || dataStore.metadata[parentId].children[childIndex].rotation
  };

  dataStore.metadata[parentId].modifiedAt = new Date().toISOString();
  saveData();
  res.json(dataStore.metadata[parentId]);
});

// Update child relationship data (position/rotation on the relation)
app.put('/api/parts/:parentId/children/:instanceId/relation', (req, res) => {
  const { parentId, instanceId } = req.params;
  const { position, rotation } = req.body;

  if (!dataStore.metadata[parentId]) {
    return res.status(404).json({ error: 'Parent part not found' });
  }

  if (!dataStore.metadata[parentId].children) {
    return res.status(404).json({ error: 'No children found' });
  }

  const child = dataStore.metadata[parentId].children.find(c => c.instanceId === instanceId);

  if (!child) {
    return res.status(404).json({ error: 'Child instance not found in parent' });
  }

  if (position) {
    child.position = position;
  }

  if (rotation) {
    child.rotation = rotation;
  }

  dataStore.metadata[parentId].modifiedAt = new Date().toISOString();
  saveData();
  res.json(dataStore.metadata[parentId]);
});

// Delete file and metadata
app.delete('/api/files/:id', (req, res) => {
  const id = req.params.id;
  
  // Find file
  const fileIndex = dataStore.files.findIndex(f => f.id === id);
  if (fileIndex === -1) {
    return res.status(404).json({ error: 'File not found' });
  }

  const file = dataStore.files[fileIndex];
  
  // Delete physical file
  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  // Remove from data store
  dataStore.files.splice(fileIndex, 1);
  delete dataStore.metadata[id];

  saveData();
  res.json({ success: true });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`PDM/PLM Backend server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
});
