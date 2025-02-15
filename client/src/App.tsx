import { useEffect, useRef } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import { ResearchReport } from './components/ResearchReport';
// Import icons from heroicons
import {DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ChatSection } from './components/ChatSection';
import { useResearch } from './hooks/useResearch';
import { downloadReport } from './utils/download';

function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    query,
    setQuery,
    messages,
    currentQuestionIndex,
    finalReport,
    loading,
    sendInitialQuery,
    handleAnswer
  } = useResearch();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-6">
      <div className="max-w-[1600px] h-[90vh] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          <ChatSection
            messages={messages}
            query={query}
            loading={loading}
            currentQuestionIndex={currentQuestionIndex}
            onQueryChange={setQuery}
            onSend={() => {
              if (!loading && query.trim()) {
                if (currentQuestionIndex === -1) {
                  sendInitialQuery();
                } else {
                  handleAnswer(query);
                }
                setQuery('');
              }
            }}
            messagesEndRef={messagesEndRef}
          />

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
                    onClick={() => downloadReport(finalReport)}
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
                <ResearchReport loading={loading} finalReport={finalReport} />
              )}
            </div>
          </div>

          {/* Mobile Report View */}
          {finalReport && (
            <div className="lg:hidden flex flex-col bg-white border-t border-gray-200 mt-4">
              <div className="px-4 py-4 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Research Report</h2>
                <button
                  onClick={() => downloadReport(finalReport)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 
                           hover:bg-blue-600 text-white transition-colors duration-200"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
                <ResearchReport loading={loading} finalReport={finalReport} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;