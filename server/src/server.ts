import express from 'express';
import cors from 'cors';
import { deepResearch, writeFinalReport } from './deep-research';

const app = express();
app.use(express.json());
app.use(cors());

app.post('/research', async (req: express.Request, res: express.Response): Promise<void> => {
  const { initialQuery, breadth, depth } = req.body;
  if (!initialQuery) {
    res.status(400).json({ error: 'Initial query is required.' });
    return;
  }

  const combinedQuery = `Initial Query: ${initialQuery}`;

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

    // Instead of "return res.json(...)", simply call res.json(...) so that
    // the function's return type remains Promise<void>
    res.json({ report, learnings, visitedUrls });
  } catch (error) {
    console.error('Error in /research endpoint:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
