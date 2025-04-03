const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Dummy MCP tools endpoint
app.get('/api/tools', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'BLAST',
      description: 'Basic Local Alignment Search Tool',
      category: 'sequence-analysis'
    },
    {
      id: '2',
      name: 'AlphaFold',
      description: 'Protein structure prediction system',
      category: 'structural-analysis'
    },
    {
      id: '3',
      name: 'GATK',
      description: 'Genome Analysis Toolkit',
      category: 'genomics'
    }
  ]);
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
