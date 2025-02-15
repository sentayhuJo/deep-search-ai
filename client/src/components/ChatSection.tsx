import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Message } from '../types';

interface ChatSectionProps {
  readonly messages: Message[];
  readonly query: string;
  readonly loading: boolean;
  readonly currentQuestionIndex: number;
  readonly onQueryChange: (value: string) => void;
  readonly onSend: () => void;
  readonly messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function ChatSection({
  messages,
  query,
  loading,
  currentQuestionIndex,
  onQueryChange,
  onSend,
  messagesEndRef
}: ChatSectionProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && query.trim()) {
      onSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full lg:border-r border-gray-200">
      {/* Header */}
      <div className="bg-white px-4 lg:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold text-gray-800">Research Assistant</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-white">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div
              key={`${index + 1}`}
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
      </div>

      {/* Input */}
      <div className="p-4 lg:p-6 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 
                     bg-white text-gray-900 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={currentQuestionIndex === -1 ? "Enter your research query..." : "Type your answer..."}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            disabled={loading}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={onSend}
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
  );
} 