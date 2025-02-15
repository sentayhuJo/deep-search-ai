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
  // Optionally, an array of answers corresponding to follow-up questions.
  followUpAnswers?: string[];
}

app.post('/research', async (req: express.Request, res: express.Response): Promise<void> => {
  const { initialQuery, breadth, depth, followUpAnswers } = req.body as ResearchRequestBody;
  
  if (!initialQuery) {
    res.status(400).json({ error: 'Initial query is required.' });
    return;
  }

  // Generate follow-up questions based solely on the initial query.
  const followUpQuestions = await generateFeedback({ query: initialQuery });
  
  // If the client has not provided follow-up answers, return the generated questions.
  if (!followUpAnswers) {
    res.json({ followUpQuestions });
    return;
  }

  // Otherwise, combine the initial query with the follow-up questions and the provided answers.
  // Here we assume the order of answers corresponds to the order of generated questions.
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

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Only call listen if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
