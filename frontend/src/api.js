import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes for training
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // System Health
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  // Dataset Operations
  getDatasetInfo: async () => {
    const res = await client.get('/dataset/info');
    return res.data;
  },

  selectDataset: async (filename) => {
    const res = await client.post('/dataset/select', { filename });
    return res.data;
  },

  uploadDataset: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/dataset/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  resetDataset: async () => {
    const res = await client.post('/dataset/reset');
    return res.data;
  },

  // Training Operations
  trainClassical: async ({ algorithm = 'logistic_regression', c_regularization = 1.0, random_state = 42 }) => {
    const res = await client.post('/models/train/classical', {
      algorithm,
      c_regularization,
      random_state,
    });
    return res.data;
  },

  trainQuantum: async ({ n_qubits = 4, n_layers = 2, steps = 35, learning_rate = 0.15, random_state = 42 }) => {
    const res = await client.post('/models/train/quantum', {
      n_qubits,
      n_layers,
      steps,
      learning_rate,
      random_state,
    });
    return res.data;
  },

  // Metrics Comparison
  getAllMetrics: async () => {
    const res = await client.get('/models/metrics');
    return res.data;
  },

  // Inference / Prediction
  predict: async ({ model_id, features }) => {
    const res = await client.post('/predict', {
      model_id,
      features,
    });
    return res.data;
  },
};

export default api;
