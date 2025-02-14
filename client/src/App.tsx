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
  const [initialQuery, setInitialQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    setInitialQuery(query);
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
        setQuery('');
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
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
    } else if (newAnswers.length === followUpQuestions.length && 
        newAnswers.every(answer => answer?.trim())) {
      await sendFinalRequest(newAnswers);
    }
    inputRef.current?.focus();
  };

  const sendFinalRequest = async (answers: string[]) => {
    setLoading(true);
    try {
      const combinedQuery = {
        initialQuery: initialQuery,
        followUpQuestions,
        followUpAnswers: answers,
        breadth: 4,
        depth: 2
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(combinedQuery)
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

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Generating your report...</p>
          </div>
        </div>
      );
    }
    
    if (finalReport) {
      return (
        <div className="prose prose-slate max-w-none dark:prose-invert
                      prose-headings:text-gray-800 
                      prose-p:text-gray-600 
                      prose-strong:text-gray-800
                      prose-ul:text-gray-600
                      prose-ol:text-gray-600
                      prose-li:text-gray-600
                      prose-li:marker:text-gray-400
                      prose-a:text-blue-600 hover:prose-a:text-blue-700
                      prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200
                      prose-code:text-gray-800 prose-code:bg-gray-100
                      prose-blockquote:text-gray-600 prose-blockquote:border-gray-300
                      prose-hr:border-gray-200">
          <ReactMarkdown 
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-6" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-8 mb-4" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-6 mb-3" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="my-4 list-disc pl-6" {...props} />,
              ol: ({node, ...props}) => <ol className="my-4 list-decimal pl-6 text-gray-600" {...props} />,
              li: ({node, ...props}) => <li className="mb-2 text-gray-600" {...props} />,
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 pl-4 italic my-4" {...props} />
              ),
            }}
          >
            {finalReport}
          </ReactMarkdown>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Your research report will appear here</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-6">
      <div className="max-w-[1600px] h-[90vh] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Side - Chat Section */}
          <div className="flex-1 flex flex-col h-full lg:border-r border-gray-200">
            <div className="bg-white px-4 lg:px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl font-semibold text-gray-800">Research Assistant</h1>
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-white"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
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
            <div className="p-4 lg:p-6 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 
                           bg-white text-gray-900 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={currentQuestionIndex === -1 ? "Enter your research query..." : "Type your answer..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !loading && query.trim()) {
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
                    if (!loading && query.trim()) {
                      if (currentQuestionIndex === -1) {
                        sendInitialQuery();
                      } else {
                        handleAnswer(query);
                      }
                      setQuery('');
                    }
                  }}
                  disabled={loading || !query.trim()}
                  className="px-4 lg:px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white
                           transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center gap-2 whitespace-nowrap"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Report Section */}
          <div className="hidden lg:flex flex-col w-full lg:w-1/2 bg-white">
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-800">Research Report</h2>
                </div>
                {finalReport && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 
                             hover:bg-blue-600 text-white transition-colors duration-200"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Download Report</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <LoadingSpinner />
                    </div>
                    <p className="text-gray-600">Generating your research report...</p>
                  </div>
                </div>
              ) : (
                renderReportContent()
              )}
            </div>
          </div>

          {/* Mobile Report View */}
          {finalReport && (
            <div className="lg:hidden flex flex-col bg-white border-t border-gray-200 mt-4">
              <div className="px-4 py-4 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Research Report</h2>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 
                           hover:bg-blue-600 text-white transition-colors duration-200"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
                {renderReportContent()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;