import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { ArrowLeft, Send, Loader2, CheckCircle2, Star, AlertCircle } from 'lucide-react';
import { useSaveInterviewSession, useAddInterviewResponse, useHasUploadedResume, useGetCallerLatestResume } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { InterviewQuestion, InterviewSession, InterviewResponse } from '../backend';

interface ChatbotInterviewProps {
  config: {
    role: string;
    interviewType: string;
    difficulty: string;
    resumeId?: string;
    questionCount?: number;
  };
  onBack: () => void;
}

interface Message {
  role: 'ai' | 'user';
  content: string;
  feedback?: string;
  rating?: number;
}

const SAMPLE_QUESTIONS = {
  Technical: {
    Beginner: [
      'Can you explain what a variable is in programming?',
      'What is the difference between a class and an object?',
      'How would you explain recursion to someone new to programming?',
    ],
    Medium: [
      'Explain the difference between synchronous and asynchronous programming.',
      'What are the key principles of object-oriented programming?',
      'How would you optimize a slow database query?',
    ],
    Hard: [
      'Design a distributed caching system for a high-traffic application.',
      'Explain how you would implement a rate limiter for an API.',
      'Describe the trade-offs between different database indexing strategies.',
    ],
  },
  Behavioral: {
    Beginner: [
      'Tell me about a time when you worked on a team project.',
      'Describe a challenge you faced and how you overcame it.',
      'What motivates you in your work?',
    ],
    Medium: [
      'Tell me about a time when you had to deal with a difficult team member.',
      'Describe a situation where you had to make a decision with incomplete information.',
      'How do you handle conflicting priorities?',
    ],
    Hard: [
      'Tell me about a time when you had to influence others without authority.',
      'Describe a situation where you failed and what you learned from it.',
      'How have you handled a situation where your team disagreed with your approach?',
    ],
  },
  HR: {
    Beginner: [
      'Why are you interested in this position?',
      'What are your greatest strengths?',
      'Where do you see yourself in 5 years?',
    ],
    Medium: [
      'Why should we hire you over other candidates?',
      'What is your expected salary range?',
      'How do you handle work-life balance?',
    ],
    Hard: [
      'What would you do if you disagreed with a company policy?',
      'Tell me about a time when you had to make an ethical decision at work.',
      'How would you handle a situation where you were asked to do something you felt was wrong?',
    ],
  },
};

const INACTIVITY_TIMEOUT = 30000; // 30 seconds

export default function ChatbotInterview({ config, onBack }: ChatbotInterviewProps) {
  const { identity } = useInternetIdentity();
  const saveSession = useSaveInterviewSession();
  const addResponse = useAddInterviewResponse();
  const { data: hasResume, isLoading: checkingResume } = useHasUploadedResume();
  const { data: latestResume } = useGetCallerLatestResume();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [resumeCheckFailed, setResumeCheckFailed] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const questions = SAMPLE_QUESTIONS[config.interviewType as keyof typeof SAMPLE_QUESTIONS]?.[config.difficulty as keyof typeof SAMPLE_QUESTIONS.Technical] || SAMPLE_QUESTIONS.Technical.Beginner;

  useEffect(() => {
    // Check resume status and verification on mount
    if (!checkingResume) {
      if (hasResume === false) {
        setResumeCheckFailed(true);
        toast.error('Resume upload required. Please upload your resume before continuing.');
        return;
      }

      // Check if resume is verified for the target role
      if (latestResume && config.role) {
        if (!latestResume.verified || latestResume.targetRole !== config.role) {
          setVerificationFailed(true);
          toast.error('Resume-role verification required. Please complete the verification process.');
          return;
        }
      }

      if (hasResume) {
        const initialMessage: Message = {
          role: 'ai',
          content: `Hello! I'm your AI interviewer. Today we'll be conducting a ${config.difficulty} level ${config.interviewType} interview for the ${config.role} position. I'll ask you ${questions.length} questions and provide feedback after each response. Let's begin!\n\n${questions[0]}`,
        };
        setMessages([initialMessage]);
      }
    }
  }, [hasResume, checkingResume, latestResume, config.role]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Inactivity timer
  useEffect(() => {
    if (currentAnswer.trim() && !isProcessing && !isComplete) {
      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Set new timer
      inactivityTimerRef.current = setTimeout(() => {
        handleSubmitAnswer();
      }, INACTIVITY_TIMEOUT);
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [currentAnswer, isProcessing, isComplete]);

  const generateFeedback = (answer: string, question: string): { feedback: string; rating: number } => {
    const answerLength = answer.trim().length;
    const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('for instance');
    const hasStructure = answer.includes('\n') || answer.split('.').length > 2;

    let rating = 3; // Base rating
    let feedbackParts: string[] = [];

    // Clarity assessment
    if (answerLength > 200) {
      feedbackParts.push('Your answer was comprehensive and detailed.');
      rating += 1;
    } else if (answerLength > 100) {
      feedbackParts.push('Your answer was clear and concise.');
    } else {
      feedbackParts.push('Your answer could benefit from more elaboration.');
      rating -= 1;
    }

    // Confidence evaluation (based on structure and examples)
    if (hasExamples) {
      feedbackParts.push('Great job providing specific examples to support your points.');
      rating += 1;
    } else {
      feedbackParts.push('Consider adding concrete examples to strengthen your response.');
    }

    // Relevance scoring
    if (hasStructure) {
      feedbackParts.push('Your response was well-structured and easy to follow.');
      rating += 0.5;
    }

    // Cap rating between 1 and 5
    rating = Math.max(1, Math.min(5, Math.round(rating)));

    const feedback = feedbackParts.join(' ');
    return { feedback, rating };
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || isProcessing) {
      return;
    }

    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    setIsProcessing(true);

    const userMessage: Message = {
      role: 'user',
      content: currentAnswer,
    };

    const { feedback, rating } = generateFeedback(currentAnswer, questions[currentQuestionIndex]);

    const question: InterviewQuestion = {
      question: questions[currentQuestionIndex],
      answer: currentAnswer,
      feedback,
      difficulty: config.difficulty,
      interviewType: config.interviewType,
      role: config.role,
    };

    setInterviewQuestions([...interviewQuestions, question]);

    // Save response to backend
    if (identity) {
      const response: InterviewResponse = {
        answer: currentAnswer,
        feedback,
        rating,
        createdAt: BigInt(Date.now() * 1000000),
      };

      try {
        await addResponse.mutateAsync(response);
      } catch (error) {
        console.error('Error saving response:', error);
      }
    }

    const feedbackMessage: Message = {
      role: 'ai',
      content: feedback,
      feedback: feedback,
      rating,
    };

    setMessages([...messages, userMessage, feedbackMessage]);
    setCurrentAnswer('');

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        const nextQuestion = questions[currentQuestionIndex + 1];
        const nextMessage: Message = {
          role: 'ai',
          content: `Great! Let's move on to the next question:\n\n${nextQuestion}`,
        };
        setMessages((prev) => [...prev, nextMessage]);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        const avgRating = interviewQuestions.reduce((sum, q) => sum + (rating || 3), rating) / (interviewQuestions.length + 1);
        const finalMessage: Message = {
          role: 'ai',
          content: `Excellent work! You've completed the interview. Your average rating was ${avgRating.toFixed(1)}/5. Overall, you demonstrated good understanding and communication skills. Keep practicing to further improve your interview performance!`,
        };
        setMessages((prev) => [...prev, finalMessage]);
        setIsComplete(true);
        saveInterviewSessionData();
      }
      setIsProcessing(false);
    }, 1000);
  };

  const saveInterviewSessionData = async () => {
    if (!identity) return;

    const session: InterviewSession = {
      id: `session-${Date.now()}`,
      user: identity.getPrincipal(),
      role: config.role,
      interviewType: config.interviewType,
      difficulty: config.difficulty,
      questions: interviewQuestions,
      startTime: BigInt(Date.now() * 1000000),
      endTime: BigInt(Date.now() * 1000000),
      overallFeedback: 'Good performance overall. Continue practicing to improve your interview skills.',
      numberOfQuestions: BigInt(config.questionCount || questions.length),
    };

    try {
      await saveSession.mutateAsync(session);
      toast.success('Interview session saved!');
    } catch (error: any) {
      console.error('Error saving session:', error);
      if (error?.message?.includes('Resume upload required')) {
        toast.error('Resume upload required. Please upload your resume before continuing.');
      } else if (error?.message?.includes('Target role not verified')) {
        toast.error('Resume-role verification required. Please complete the verification process.');
      } else {
        toast.error('Failed to save session');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCurrentAnswer(value);

    // Check for "enough" keyword (case-insensitive)
    if (value.trim().toLowerCase() === 'enough') {
      handleSubmitAnswer();
    }
  };

  if (checkingResume) {
    return (
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Setup
        </Button>
        <Card>
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Verifying resume status...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resumeCheckFailed || verificationFailed) {
    return (
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Setup
        </Button>
        <Card>
          <CardContent className="p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{resumeCheckFailed ? 'Resume Required' : 'Verification Required'}</AlertTitle>
              <AlertDescription>
                {resumeCheckFailed 
                  ? 'Resume upload required. Please upload your resume before continuing with the interview.'
                  : 'Resume-role verification required. Please complete the verification process in the interview setup.'}
              </AlertDescription>
            </Alert>
            <Button onClick={onBack} className="mt-4">
              Go Back to Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Setup
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Chatbot Interview</span>
            <div className="text-sm font-normal text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 transition-all ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.feedback
                          ? 'bg-chart-1/10 border border-chart-1/20'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {message.role === 'user' ? 'You' : 'AI Interviewer'}
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.rating && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-chart-1/20">
                          <span className="text-xs font-medium mr-1">Rating:</span>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < message.rating!
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                          <span className="text-xs ml-1 font-medium">{message.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {!isComplete && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your answer here... (Press Enter to submit, or type 'enough' when ready)"
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  disabled={isProcessing}
                  className="transition-all"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Press Enter to submit • Type "enough" to finish • Auto-submit after 30s of inactivity
                  </p>
                  <Button onClick={handleSubmitAnswer} disabled={isProcessing || !currentAnswer.trim()}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Answer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {isComplete && (
              <div className="flex items-center justify-center gap-2 p-4 bg-chart-1/10 rounded-lg border border-chart-1/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <CheckCircle2 className="h-5 w-5 text-chart-1" />
                <span className="font-medium">Interview Complete!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
