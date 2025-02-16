import { useState, useRef } from 'react';

type Message = {
  sender: 'user' | 'agent';
  text: string;
  isQuestion?: boolean;
};

export function useResearch() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sendInitialQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setInitialQuery(query);
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    
    try {
      const res = await fetch('/research', {
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
    
    if (followUpQuestions.length === 0) {
      sendInitialQuery();
      return;
    }
    
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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } else if (newAnswers.length === followUpQuestions.length && 
        newAnswers.every(answer => answer?.trim())) {
      await sendFinalRequest(newAnswers);
    }
  };

  const sendFinalRequest = async (answers: string[]) => {
    setLoading(true);
    try {
      const res = await fetch('/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          initialQuery,
          followUpQuestions,
          followUpAnswers: answers,
          breadth: 4,
          depth: 2
        })
      });

      const data = await res.json();
      if (data.report) {
        setFinalReport(data.report);
        setMessages(prev => [...prev, { 
          sender: 'agent', 
          text: 'Here is your research report:'
        }]);
        setQuery('');
        setCurrentQuestionIndex(-1);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        sender: 'agent', 
        text: 'Sorry, there was an error generating the report. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return {
    query,
    setQuery,
    messages,
    followUpQuestions,
    currentQuestionIndex,
    followUpAnswers,
    finalReport,
    loading,
    inputRef,
    sendInitialQuery,
    handleAnswer,
    sendFinalRequest
  };
}