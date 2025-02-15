import express from 'express';
import cors from 'cors';
import { deepResearch, writeFinalReport } from './helpers/deep-research.js';
import { generateFeedback } from './helpers/feedback.js';

export const app = express();

// Simple CORS setup (less secure)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

interface ResearchRequestBody {
  initialQuery: string;
  breadth?: number;
  depth?: number;
  followUpAnswers?: string[];
}

app.post('/research', async (req, express.Response res): Promise<void> => {
  const { initialQuery, breadth, depth, followUpAnswers } = req.body as ResearchRequestBody;
  
  if (!initialQuery) {
    res.status(400).json({ error: 'Initial query is required.' });
    return;
  }

  const followUpQuestions = await generateFeedback({ query: initialQuery });
  
  if (!followUpAnswers) {
    res.json({ followUpQuestions });
    return;
  }

  const followUpPart = followUpQuestions
    .map((question, i) => `Q: ${question}\nA: ${followUpAnswers[i] || ''}`)
    .join('\n');

  const combinedQuery = `
Initial Query: ${initialQuery}
Follow-up Questions and Answers:
${followUpPart}
`;

  try {
    const { learnings, visitedUrls } = await deepResearch({
      query: combinedQuery,
      breadth: breadth || 4,
      depth: depth || 2,
    });

    const report = await writeFinalReport({
      prompt: combinedQuery,
      learnings,
      visitedUrls,
    });

    res.json({ report, learnings, visitedUrls });
  } catch (error) {
    console.error('Error in /research endpoint:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Only call listen if this file is run directly
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

