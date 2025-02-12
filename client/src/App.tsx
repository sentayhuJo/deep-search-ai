import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import LoadingSpinner from './components/LoadingSpinner';
// Import icons from heroicons
import { PaperAirplaneIcon, DocumentTextIcon, ArrowDownTrayIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

type Message = {
  sender: 'user' | 'agent';
  text: string;
  isQuestion?: boolean;
};

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([finalReport], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = 'research-report.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const sendInitialQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialQuery: query, breadth: 4, depth: 2 })
      });
      
      const data = await res.json();
      if (data.followUpQuestions) {
        setFollowUpQuestions(data.followUpQuestions);
        setCurrentQuestionIndex(0);
        setMessages((prev) => [...prev, { 
          sender: 'agent', 
          text: data.followUpQuestions[0],
          isQuestion: true 
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { 
        sender: 'agent', 
        text: 'Error processing request.' 
      }]);
    }
    setLoading(false);
  };

  const handleAnswer = async (answer: string) => {
    if (!answer.trim()) return;
    
    const newAnswers = [...followUpAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setFollowUpAnswers(newAnswers);
    
    setMessages((prev) => [...prev, { sender: 'user', text: answer }]);

    if (currentQuestionIndex < followUpQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setMessages((prev) => [...prev, { 
        sender: 'agent', 
        text: followUpQuestions[currentQuestionIndex + 1],
        isQuestion: true 
      }]);
      setQuery('');
    } else {
      // All questions answered, send final request
      await sendFinalRequest(newAnswers);
    }
  };

  const sendFinalRequest = async (answers: string[]) => {
    setLoading(true);
    console.log(answers);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initialQuery: query, 
          breadth: 4, 
          depth: 2, 
          followUpAnswers: answers 
        })
      });
      
      const data = await res.json();
      if (data.report) {
        setMessages((prev) => [...prev, { sender: 'agent', text: 'Here is your research report:' }]);
        setFinalReport(data.report);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { 
        sender: 'agent', 
        text: 'Error processing final request.' 
      }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="container mx-auto h-[90vh] flex gap-4 p-4 max-w-7xl">
        {/* Chat Section - Left Side */}
        <div className="flex-1 flex flex-col rounded-2xl shadow-lg bg-white">
          <div className="bg-white px-6 py-4 border-b border-gray-100 rounded-t-2xl flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-semibold text-gray-800">Research Assistant</h1>
          </div>

          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-3">
              <input
                type="text"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200
                         bg-gray-50 text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200"
                placeholder={currentQuestionIndex === -1 ? "Enter your research query..." : "Type your answer..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (currentQuestionIndex === -1) {
                      sendInitialQuery();
                    } else {
                      handleAnswer(query);
                    }
                    setQuery('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (currentQuestionIndex === -1) {
                    sendInitialQuery();
                  } else {
                    handleAnswer(query);
                  }
                  setQuery('');
                }}
                disabled={loading || !query.trim()}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white
                         transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Processing...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Section - Right Side */}
        <div className="w-1/2 flex flex-col rounded-2xl shadow-lg bg-white">
          <div className="px-6 py-4 border-b border-gray-100 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800">Research Report</h2>
            </div>
            {finalReport && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white
                         transition-colors duration-200 text-sm font-medium flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 rounded-b-2xl">
            {finalReport ? (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                  {finalReport}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Your research report will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;