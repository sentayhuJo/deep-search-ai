export interface Message {
    sender: 'user' | 'agent';
    text: string;
  }
  
  export interface ApiResponse {
    followUpQuestions?: string[];
    report?: string;
  }
  
  export interface ApiError {
    message: string;
    status?: number;
  }