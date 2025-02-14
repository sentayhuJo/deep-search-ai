import { expect } from 'chai';
import * as sinon from 'sinon';
import * as supertest from 'supertest';
const request = supertest.default;
import { app } from '../src/server';
import * as deepResearchModule from '../src/helpers/deep-research';
import * as feedbackModule from '../src/helpers/feedback';

type DeepResearchFn = typeof deepResearchModule.deepResearch;
type GenerateFeedbackFn = typeof feedbackModule.generateFeedback;

interface DeepResearchResult {
  learnings: string[];
  visitedUrls: string[];
}

describe('Research API', () => {
  let deepResearchStub: sinon.SinonStub<Parameters<DeepResearchFn>, ReturnType<DeepResearchFn>>;
  let feedbackStub: sinon.SinonStub<Parameters<GenerateFeedbackFn>, ReturnType<GenerateFeedbackFn>>;

  beforeEach(() => {
    deepResearchStub = sinon.stub(deepResearchModule, 'deepResearch');
    feedbackStub = sinon.stub(feedbackModule, 'generateFeedback');
  });

  afterEach(() => {
    // Restore stubs after each test
    sinon.restore();
  });

  describe('POST /research', () => {
    it('should handle initial query and return follow-up questions', async () => {
      const mockQuestions: string[] = ['Question 1?', 'Question 2?'];
      feedbackStub.resolves(mockQuestions);

      const response = await request(app)
        .post('/research')
        .send({
          initialQuery: 'Test query',
          breadth: 4,
          depth: 2
        })
        .expect(200);

      expect(response.body).to.have.property('followUpQuestions');
      expect(response.body.followUpQuestions).to.deep.equal(mockQuestions);
      expect(feedbackStub.calledOnce).to.be.true;
    });

    it('should handle final request and return research report', async () => {
      const mockLearnings = ['Learning 1', 'Learning 2'];
      const mockUrls = ['url1', 'url2'];

      deepResearchStub.resolves({
        learnings: mockLearnings,
        visitedUrls: mockUrls
      });

      const response = await request(app)
        .post('/research')
        .send({
          initialQuery: 'Test query with answers',
          breadth: 4,
          depth: 2,
          followUpQuestions: ['Q1?', 'Q2?'],
          followUpAnswers: ['A1', 'A2']
        })
        .expect(200);

      expect(response.body).to.have.property('report');
      expect(response.body.report).to.be.a('string');
      expect(deepResearchStub.calledOnce).to.be.true;
    });

    it('should handle errors gracefully', async () => {
      feedbackStub.rejects(new Error('Test error'));

      const response = await request(app)
        .post('/research')
        .send({
          initialQuery: 'Test query',
          breadth: 4,
          depth: 2
        })
        .expect(500);

      expect(response.body).to.have.property('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/research')
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should handle follow-up answers correctly', async () => {
      deepResearchStub.resolves({
        learnings: ['Learning'],
        visitedUrls: ['url']
      });

      const response = await request(app)
        .post('/research')
        .send({
          initialQuery: 'Query with complete answers',
          breadth: 4,
          depth: 2,
          followUpQuestions: ['Q1?'],
          followUpAnswers: ['A1']
        })
        .expect(200);

      expect(response.body).to.have.property('report');
      expect(deepResearchStub.calledWith(sinon.match({
        query: sinon.match.string,
        breadth: 4,
        depth: 2
      }))).to.be.true;
    });
  });
}); 