const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 2024;

// Middleware
app.use(cors());
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
