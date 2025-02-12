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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-800 to-gray-900">
      {/* Main Container */}
      <div className="container mx-auto max-w-4xl h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="bg-gray-700 rounded-t-xl p-4 mb-2">
          <h1 className="text-2xl font-bold text-white text-center">Research Assistant</h1>
        </div>
  
        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-700 rounded-xl mb-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 ${
                msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start'
              }`}
            >
              <div
                className={`p-4 rounded-xl max-w-[80%] shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-white rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
  
        {/* Input / Follow-Up Section */}
        <div className="bg-gray-700 rounded-xl p-4">
          {!followUpQuestions ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your research query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') sendInitialQuery();
                }}
              />
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={sendInitialQuery}
                disabled={loading || query.trim() === ''}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Processing...
                  </span>
                ) : "Submit Query"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Follow-Up Questions</h2>
              {followUpQuestions.map((question, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-white">{question}</p>
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                onClick={sendFollowUpAnswers}
                disabled={
                  loading ||
                  followUpAnswers.length !== followUpQuestions.length ||
                  followUpAnswers.some((a) => a.trim() === '')
                }
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Processing...
                  </span>
                ) : "Submit Answers"}
              </button>
            </div>
          )}
        </div>
  
        {/* Final Report Section */}
        {finalReport && (
          <div className="mt-4 bg-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Final Report</h2>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                {finalReport}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
