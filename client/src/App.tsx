import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

type Message = {
  sender: 'user' | 'agent';
  text: string;
};

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[] | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState('');
  const [loading, setLoading] = useState(false);

  // Sends the initial query to get follow-up questions.
  const sendInitialQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    // Append the user message.
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    try {
      const res = await fetch('http://localhost:3001/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialQuery: query, breadth: 4, depth: 2 })
      });
      const data = await res.json();
      if (data.followUpQuestions) {
        setFollowUpQuestions(data.followUpQuestions);
      } else if (data.report) {
        // If there are no follow-up questions and we get a report, treat it as final.
        setMessages((prev) => [...prev, { sender: 'agent', text: data.report }]);
        setFinalReport(data.report);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: 'agent', text: 'Error processing request.' }]);
    }
    setLoading(false);
  };

  // Submits follow-up answers along with the initial query.
  const sendFollowUpAnswers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initialQuery: query, 
          breadth: 4, 
          depth: 2, 
          followUpAnswers 
        })
      });
      const data = await res.json();
      if (data.report) {
        setMessages((prev) => [...prev, { sender: 'agent', text: data.report }]);
        setFinalReport(data.report);
      }
      // Reset follow-up questions and answers after submission.
      setFollowUpQuestions(null);
      setFollowUpAnswers([]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: 'agent', text: 'Error processing follow-up answers.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 p-3 rounded-lg max-w-md ${
              msg.sender === 'user'
                ? 'bg-blue-100 self-end text-right'
                : 'bg-green-100 self-start text-left'
            }`}
          >
            <p className="text-sm">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Input / Follow-Up Section */}
      <div className="p-4 bg-white border-t">
        {!followUpQuestions ? (
          <>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:border-blue-500"
              placeholder="Enter your research query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') sendInitialQuery();
              }}
            />
            <button
              className="w-full bg-blue-500 text-white px-4 py-2 rounded"
              onClick={sendInitialQuery}
              disabled={loading || query.trim() === ''}
            >
              {loading ? "Loading..." : "Submit Query"}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2">Follow-Up Questions</h2>
            {followUpQuestions.map((question, idx) => (
              <div key={idx} className="mb-2">
                <p className="mb-1">{question}</p>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Your answer..."
                  value={followUpAnswers[idx] || ''}
                  onChange={(e) => {
                    const newAnswers = [...followUpAnswers];
                    newAnswers[idx] = e.target.value;
                    setFollowUpAnswers(newAnswers);
                  }}
                />
              </div>
            ))}
            <button
              className="w-full bg-green-500 text-white px-4 py-2 rounded mt-2"
              onClick={sendFollowUpAnswers}
              disabled={
                loading ||
                followUpAnswers.length !== followUpQuestions.length ||
                followUpAnswers.some((a) => a.trim() === '')
              }
            >
              {loading ? "Submitting..." : "Submit Answers"}
            </button>
          </>
        )}
      </div>

      {/* Final Report Section */}
      {finalReport && (
        <div className="p-4 bg-white border-t">
          <h2 className="text-xl font-bold mb-2">Final Report</h2>
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
            {finalReport}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default App;
