import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Video, VideoOff, Loader2, CheckCircle2, AlertCircle, RefreshCw, Mic, MicOff, Camera, AlertTriangle, ListOrdered } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useCamera } from '../camera/useCamera';
import { useSaveLiveMockData, useSaveInterviewSettings, useHasUploadedResume } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { LiveMockInterviewData, SpokenAnswerFeedback } from '../backend';

interface LiveMockInterviewProps {
  config: {
    role: string;
    interviewType: string;
    difficulty: string;
    resumeId?: string;
    questionCount?: number;
  };
  onBack: () => void;
}

interface QuestionData {
  question: string;
  expectedKeywords: string[];
  expectedAnswer: string;
}

const SAMPLE_QUESTIONS: QuestionData[] = [
  {
    question: 'Tell me about yourself and your background.',
    expectedKeywords: ['experience', 'education', 'skills', 'background', 'work', 'career'],
    expectedAnswer: 'A good answer should include your professional background, relevant experience, education, and key skills that make you suitable for the role.',
  },
  {
    question: 'Why are you interested in this position?',
    expectedKeywords: ['interest', 'passion', 'company', 'role', 'opportunity', 'growth', 'align'],
    expectedAnswer: 'Explain your genuine interest in the role, how it aligns with your career goals, and what attracts you to the company.',
  },
  {
    question: 'What are your greatest strengths?',
    expectedKeywords: ['strength', 'skill', 'ability', 'expertise', 'proficient', 'excel'],
    expectedAnswer: 'Highlight 2-3 key strengths with specific examples demonstrating how you\'ve applied them successfully in your work.',
  },
  {
    question: 'Describe a challenging project you worked on.',
    expectedKeywords: ['challenge', 'project', 'problem', 'solution', 'result', 'overcome', 'team'],
    expectedAnswer: 'Use the STAR method: describe the Situation, Task, Action you took, and the positive Result achieved.',
  },
  {
    question: 'Where do you see yourself in 5 years?',
    expectedKeywords: ['future', 'goal', 'growth', 'develop', 'career', 'aspiration', 'plan'],
    expectedAnswer: 'Discuss your career aspirations, how this role fits into your long-term goals, and your commitment to professional growth.',
  },
  {
    question: 'How do you handle stress and pressure?',
    expectedKeywords: ['stress', 'pressure', 'manage', 'cope', 'prioritize', 'deadline', 'balance'],
    expectedAnswer: 'Describe specific strategies you use to manage stress, prioritize tasks, and maintain productivity under pressure.',
  },
  {
    question: 'Tell me about a time you failed and what you learned.',
    expectedKeywords: ['failure', 'mistake', 'learn', 'improve', 'growth', 'lesson', 'overcome'],
    expectedAnswer: 'Share a genuine failure, focus on what you learned, and how you applied those lessons to improve and succeed later.',
  },
  {
    question: 'Why should we hire you?',
    expectedKeywords: ['value', 'contribution', 'skills', 'experience', 'fit', 'unique', 'benefit'],
    expectedAnswer: 'Highlight your unique value proposition, relevant skills, and how you can contribute to the company\'s success.',
  },
  {
    question: 'Describe your ideal work environment.',
    expectedKeywords: ['environment', 'culture', 'team', 'collaboration', 'communication', 'values', 'work'],
    expectedAnswer: 'Describe an environment that aligns with the company culture while highlighting your adaptability and teamwork skills.',
  },
  {
    question: 'What questions do you have for us?',
    expectedKeywords: ['question', 'curious', 'learn', 'team', 'company', 'role', 'growth', 'culture'],
    expectedAnswer: 'Ask thoughtful questions about the role, team dynamics, company culture, growth opportunities, or current challenges.',
  },
];

export default function LiveMockInterview({ config, onBack }: LiveMockInterviewProps) {
  const { identity } = useInternetIdentity();
  const saveLiveMock = useSaveLiveMockData();
  const saveSettings = useSaveInterviewSettings();
  const { data: hasResume, isLoading: checkingResume } = useHasUploadedResume();
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    retry,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'user' });

  const [setupStep, setSetupStep] = useState<'config' | 'interview'>('config');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentAnswerTranscript, setCurrentAnswerTranscript] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState({
    confidence: 0,
    clarity: 0,
    enthusiasm: 0,
  });
  const [dressingScore, setDressingScore] = useState(0);
  const [analysisScores, setAnalysisScores] = useState({
    bodyLanguage: 0,
    eyeContact: 0,
    facialExpression: 0,
    confidence: 0,
    attentiveness: 0,
    clarity: 0,
    toneScore: 0,
    stylingScore: 0,
  });
  const [spokenAnswerFeedback, setSpokenAnswerFeedback] = useState<SpokenAnswerFeedback | null>(null);
  const [allAnswerFeedbacks, setAllAnswerFeedbacks] = useState<SpokenAnswerFeedback[]>([]);
  const [resumeCheckFailed, setResumeCheckFailed] = useState(false);
  const recognitionRef = useRef<any>(null);

  const interviewQuestions = SAMPLE_QUESTIONS.slice(0, selectedQuestionCount);

  useEffect(() => {
    // Check resume status on mount
    if (!checkingResume && hasResume === false) {
      setResumeCheckFailed(true);
      toast.error('Resume upload required. Please upload your resume before continuing.');
    }
  }, [hasResume, checkingResume]);

  useEffect(() => {
    if (setupStep === 'interview' && !resumeCheckFailed) {
      handleRequestCameraPermission();
      initializeSpeechRecognition();
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [setupStep, resumeCheckFailed]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            analyzeVoiceTone(transcript);
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
          setCurrentAnswerTranscript((prev) => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          // Ignore no-speech errors during continuous recognition
        }
      };

      recognition.onend = () => {
        // Auto-restart if still recording
        if (isRecording && isListening) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }
      };

      recognitionRef.current = recognition;
    }
  };

  const analyzeVoiceTone = (text: string) => {
    const words = text.toLowerCase().split(' ');
    const confidenceWords = ['definitely', 'certainly', 'absolutely', 'confident', 'sure', 'believe', 'know'];
    const enthusiasmWords = ['excited', 'passionate', 'love', 'amazing', 'great', 'excellent', 'wonderful', 'fantastic'];
    
    const confidenceScore = words.filter(w => confidenceWords.includes(w)).length * 10;
    const enthusiasmScore = words.filter(w => enthusiasmWords.includes(w)).length * 10;
    const clarityScore = text.length > 50 ? 80 : 60;

    setVoiceAnalysis({
      confidence: Math.min(100, 70 + confidenceScore),
      clarity: Math.min(100, clarityScore),
      enthusiasm: Math.min(100, 65 + enthusiasmScore),
    });
  };

  const evaluateSpokenAnswer = (transcript: string, questionData: QuestionData): SpokenAnswerFeedback => {
    const lowerTranscript = transcript.toLowerCase();
    const words = lowerTranscript.split(/\s+/);
    
    // Calculate keyword match score
    const matchedKeywords = questionData.expectedKeywords.filter(keyword => 
      lowerTranscript.includes(keyword.toLowerCase())
    );
    const keywordScore = (matchedKeywords.length / questionData.expectedKeywords.length) * 100;
    
    // Calculate length score (penalize too short answers)
    const wordCount = words.length;
    const lengthScore = wordCount < 20 ? (wordCount / 20) * 100 : 100;
    
    // Calculate overall correctness rating
    const correctnessRating = Math.round((keywordScore * 0.7 + lengthScore * 0.3));
    
    // Generate improvement suggestions based on analysis
    let suggestedImprovements = '';
    const missingKeywords = questionData.expectedKeywords.filter(keyword => 
      !lowerTranscript.includes(keyword.toLowerCase())
    );
    
    if (correctnessRating >= 80) {
      suggestedImprovements = 'Excellent answer! You covered the key points effectively. To further improve, consider adding more specific examples or quantifiable achievements.';
    } else if (correctnessRating >= 60) {
      suggestedImprovements = `Good start! To strengthen your answer, try to incorporate these key concepts: ${missingKeywords.slice(0, 3).join(', ')}. `;
      if (wordCount < 30) {
        suggestedImprovements += 'Also, provide more detailed explanations and specific examples to demonstrate your points.';
      }
    } else if (correctnessRating >= 40) {
      suggestedImprovements = `Your answer needs more development. Focus on addressing: ${missingKeywords.slice(0, 4).join(', ')}. `;
      suggestedImprovements += 'Structure your response using the STAR method (Situation, Task, Action, Result) for better clarity.';
    } else {
      suggestedImprovements = `Your answer is incomplete. Make sure to address the core question by discussing: ${missingKeywords.slice(0, 5).join(', ')}. `;
      suggestedImprovements += 'Take time to think through your response and provide concrete examples from your experience.';
    }
    
    // Add length-specific feedback
    if (wordCount < 15) {
      suggestedImprovements += ' Your answer is too brief. Aim for at least 30-50 words to provide sufficient detail.';
    } else if (wordCount > 150) {
      suggestedImprovements += ' Consider being more concise. Focus on the most relevant points to keep the interviewer engaged.';
    }
    
    return {
      transcript,
      correctnessRating: BigInt(correctnessRating),
      suggestedImprovements,
      recommendedAnswer: questionData.expectedAnswer,
    };
  };

  const handleRequestCameraPermission = async () => {
    setPermissionState('requesting');
    
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const success = await startCamera();
      if (success) {
        setPermissionState('granted');
      } else {
        setPermissionState('denied');
        toast.error('Failed to start camera');
      }
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setPermissionState('denied');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera/microphone access denied. Please allow access to continue.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No camera/microphone found. Please connect devices to use this feature.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast.error('Camera/microphone is already in use by another application.');
      } else {
        toast.error('Failed to access camera/microphone. Please check your browser settings.');
      }
    }
  };

  const handleRetryCamera = async () => {
    setPermissionState('requesting');
    const success = await retry();
    if (success) {
      setPermissionState('granted');
      toast.success('Camera access granted!');
    } else {
      setPermissionState('denied');
      toast.error('Failed to access camera. Please check your permissions.');
    }
  };

  const handleStartSession = async () => {
    if (!identity) {
      toast.error('Please log in to continue');
      return;
    }

    // Check resume before proceeding
    if (!hasResume) {
      toast.error('Resume upload required. Please upload your resume before continuing.');
      setResumeCheckFailed(true);
      return;
    }

    // Save settings with selected question count
    try {
      await saveSettings.mutateAsync({
        targetRole: config.role,
        interviewType: config.interviewType,
        difficulty: config.difficulty,
        questionCount: BigInt(selectedQuestionCount),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }

    setSetupStep('interview');
    toast.success(`Starting interview with ${selectedQuestionCount} questions`);
  };

  const handleStartRecording = async () => {
    if (!isActive) {
      setPermissionState('requesting');
      const success = await startCamera();
      if (!success) {
        setPermissionState('denied');
        toast.error('Failed to start camera');
        return;
      }
      setPermissionState('granted');
    }
    
    // Mark session as started
    setSessionStarted(true);
    setIsRecording(true);
    setRecordingTime(0);
    setTranscript('');
    setCurrentAnswerTranscript('');
    setSpokenAnswerFeedback(null);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast.error('Failed to start speech recognition. Please check microphone permissions.');
      }
    }

    // Capture image for dressing evaluation
    setTimeout(async () => {
      const photo = await capturePhoto();
      if (photo) {
        const mockDressingScore = Math.floor(Math.random() * 30) + 70;
        setDressingScore(mockDressingScore);
      }
    }, 2000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
      setIsListening(false);
    }
    
    // Evaluate the spoken answer
    if (currentAnswerTranscript.trim()) {
      const questionData = interviewQuestions[currentQuestionIndex];
      const feedback = evaluateSpokenAnswer(currentAnswerTranscript, questionData);
      setSpokenAnswerFeedback(feedback);
      setAllAnswerFeedbacks(prev => [...prev, feedback]);
      
      // Show toast based on correctness
      const rating = Number(feedback.correctnessRating);
      if (rating >= 80) {
        toast.success('Excellent answer! Well done.');
      } else if (rating >= 60) {
        toast.info('Good answer. Check the feedback for improvements.');
      } else {
        toast.warning('Your answer needs improvement. Review the suggestions.');
      }
    }
  };

  const generateRandomScores = () => {
    return {
      bodyLanguage: Math.floor(Math.random() * 30) + 70,
      eyeContact: Math.floor(Math.random() * 30) + 70,
      facialExpression: Math.floor(Math.random() * 30) + 70,
      confidence: voiceAnalysis.confidence || Math.floor(Math.random() * 30) + 70,
      attentiveness: Math.floor(Math.random() * 30) + 70,
      clarity: voiceAnalysis.clarity || Math.floor(Math.random() * 30) + 70,
      toneScore: Math.floor((voiceAnalysis.confidence + voiceAnalysis.enthusiasm) / 2) || Math.floor(Math.random() * 30) + 70,
      stylingScore: dressingScore || Math.floor(Math.random() * 30) + 70,
    };
  };

  const handleNextQuestion = () => {
    if (isRecording) {
      handleStopRecording();
    }
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      // Wait a moment for feedback to be generated, then move to next question
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setRecordingTime(0);
        setTranscript('');
        setCurrentAnswerTranscript('');
        setSpokenAnswerFeedback(null);
      }, 500);
    } else {
      handleCompleteInterview();
    }
  };

  const handleCompleteInterview = async () => {
    if (isRecording) {
      handleStopRecording();
    }
    
    // Wait for final answer evaluation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await stopCamera();

    const scores = generateRandomScores();
    setAnalysisScores(scores);
    setIsComplete(true);

    if (!identity) return;

    const mockVideoData = new Uint8Array([1, 2, 3, 4, 5]);
    const videoBlob = ExternalBlob.fromBytes(mockVideoData);

    const appearanceFeedback = generateAppearanceFeedback(scores.stylingScore);
    
    // Calculate average answer correctness
    const avgAnswerCorrectness = allAnswerFeedbacks.length > 0
      ? allAnswerFeedbacks.reduce((sum, f) => sum + Number(f.correctnessRating), 0) / allAnswerFeedbacks.length
      : 0;

    // Use the last answer's feedback or aggregate feedback
    const finalSpokenAnswerFeedback: SpokenAnswerFeedback | undefined = allAnswerFeedbacks.length > 0
      ? {
          transcript: allAnswerFeedbacks.map(f => f.transcript).join('\n\n'),
          correctnessRating: BigInt(Math.round(avgAnswerCorrectness)),
          suggestedImprovements: generateAggregatedImprovements(allAnswerFeedbacks),
          recommendedAnswer: 'Review each question\'s recommended answer for best practices.',
        }
      : undefined;

    const liveMockData: LiveMockInterviewData = {
      id: `live-${Date.now()}`,
      user: identity.getPrincipal(),
      sessionId: `session-${Date.now()}`,
      videoFile: videoBlob,
      bodyLanguageScore: BigInt(scores.bodyLanguage),
      eyeContactScore: BigInt(scores.eyeContact),
      facialExpressionScore: BigInt(scores.facialExpression),
      confidenceScore: BigInt(scores.confidence),
      attentivenessScore: BigInt(scores.attentiveness),
      clarityScore: BigInt(scores.clarity),
      toneScore: BigInt(scores.toneScore),
      stylingScore: BigInt(scores.stylingScore),
      appearanceFeedback,
      feedback: generateComprehensiveFeedback(scores, avgAnswerCorrectness),
      spokenAnswerFeedback: finalSpokenAnswerFeedback,
      recordedAt: BigInt(Date.now() * 1000000),
      numberOfQuestions: BigInt(selectedQuestionCount),
      sessionStarted: true,
    };

    try {
      await saveLiveMock.mutateAsync(liveMockData);
      toast.success('Live mock interview saved with comprehensive analysis and answer evaluation!');
    } catch (error: any) {
      console.error('Error saving live mock:', error);
      if (error?.message?.includes('Resume upload required')) {
        toast.error('Resume upload required. Please upload your resume before continuing.');
      } else {
        toast.error('Failed to save interview data');
      }
    }
  };

  const generateAggregatedImprovements = (feedbacks: SpokenAnswerFeedback[]): string => {
    const avgRating = feedbacks.reduce((sum, f) => sum + Number(f.correctnessRating), 0) / feedbacks.length;
    
    let improvements = `Overall Answer Quality: ${Math.round(avgRating)}/100\n\n`;
    
    if (avgRating >= 80) {
      improvements += 'Your answers were consistently strong across all questions. Continue practicing to maintain this level of performance.';
    } else if (avgRating >= 60) {
      improvements += 'You provided good answers overall, but there\'s room for improvement. Focus on:\n';
      improvements += '• Including more specific examples and quantifiable results\n';
      improvements += '• Addressing all key aspects of each question\n';
      improvements += '• Structuring responses using frameworks like STAR method';
    } else {
      improvements += 'Your answers need significant improvement. Key areas to work on:\n';
      improvements += '• Thoroughly understand the question before answering\n';
      improvements += '• Include relevant keywords and concepts in your responses\n';
      improvements += '• Provide concrete examples from your experience\n';
      improvements += '• Practice common interview questions to build confidence';
    }
    
    return improvements;
  };

  const generateAppearanceFeedback = (score: number): string => {
    if (score >= 85) {
      return 'Excellent professional appearance! Your attire is appropriate and well-presented. You project a polished, professional image that would make a strong impression in an interview setting.';
    } else if (score >= 70) {
      return 'Good professional appearance. Your attire is generally appropriate. Consider: ensuring clothes are well-fitted, choosing solid colors or subtle patterns, and paying attention to grooming details.';
    } else {
      return 'Your appearance could be improved for a professional interview. Recommendations: wear business professional attire, ensure clothes are clean and pressed, maintain good grooming, and choose conservative colors.';
    }
  };

  const generateComprehensiveFeedback = (scores: typeof analysisScores, answerCorrectness: number): string => {
    const avgScore = Math.round((scores.bodyLanguage + scores.eyeContact + scores.confidence + scores.clarity + scores.toneScore + scores.stylingScore) / 6);
    
    let feedback = `Overall Performance: ${avgScore}/100\n`;
    feedback += `Answer Quality: ${Math.round(answerCorrectness)}/100\n`;
    feedback += `Questions Completed: ${selectedQuestionCount}\n\n`;
    
    feedback += `Voice Analysis: Your vocal tone showed ${scores.toneScore >= 80 ? 'excellent' : scores.toneScore >= 70 ? 'good' : 'moderate'} confidence and clarity. `;
    feedback += `Continue to speak with enthusiasm and maintain a steady pace.\n\n`;
    
    feedback += `Answer Evaluation: `;
    if (answerCorrectness >= 80) {
      feedback += 'Your answers were comprehensive and well-structured. You effectively addressed the key points in each question.\n\n';
    } else if (answerCorrectness >= 60) {
      feedback += 'Your answers were generally good but could be improved by including more specific examples and addressing all key concepts.\n\n';
    } else {
      feedback += 'Your answers need more development. Focus on understanding the question fully and providing detailed, relevant responses.\n\n';
    }
    
    feedback += `Professional Presentation: ${scores.stylingScore >= 85 ? 'Outstanding' : scores.stylingScore >= 70 ? 'Good' : 'Needs improvement'} professional appearance. `;
    feedback += `Your attire and grooming contribute significantly to first impressions.\n\n`;
    
    feedback += `Body Language: ${scores.bodyLanguage >= 80 ? 'Strong' : 'Moderate'} body language with ${scores.eyeContact >= 80 ? 'excellent' : 'good'} eye contact. `;
    feedback += `Keep practicing to maintain natural, confident posture throughout the interview.`;
    
    return feedback;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  if (resumeCheckFailed) {
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
              <AlertTitle>Resume Required</AlertTitle>
              <AlertDescription>
                Resume upload required. Please upload your resume before continuing with the live mock interview.
              </AlertDescription>
            </Alert>
            <Button onClick={onBack} className="mt-4">
              Go Back to Upload Resume
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSupported === false) {
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
              <AlertTitle>Camera Not Supported</AlertTitle>
              <AlertDescription>
                Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, Safari, or Edge to use this feature.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Configuration step
  if (setupStep === 'config') {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Setup
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-chart-2" />
              Configure Your Interview
            </CardTitle>
            <CardDescription>
              Select the number of questions for your live mock interview session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Interview Details:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <p className="font-medium">{config.role}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{config.interviewType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Difficulty:</span>
                  <p className="font-medium">{config.difficulty}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions *</Label>
              <Select 
                value={selectedQuestionCount.toString()} 
                onValueChange={(value) => setSelectedQuestionCount(parseInt(value))}
              >
                <SelectTrigger id="questionCount">
                  <SelectValue placeholder="Select number of questions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Questions (Quick Practice - ~10 min)</SelectItem>
                  <SelectItem value="5">5 Questions (Standard - ~15 min)</SelectItem>
                  <SelectItem value="7">7 Questions (Extended - ~20 min)</SelectItem>
                  <SelectItem value="10">10 Questions (Comprehensive - ~30 min)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how many questions you'd like to practice. More questions provide comprehensive feedback but take longer.
              </p>
            </div>

            <div className="p-4 bg-chart-2/10 border border-chart-2/20 rounded-lg space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Video className="h-4 w-4 text-chart-2" />
                What to Expect:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Camera and microphone will be activated</li>
                <li>You'll answer {selectedQuestionCount} interview questions</li>
                <li>Real-time voice and appearance analysis</li>
                <li>Comprehensive feedback on each answer</li>
                <li>Overall performance summary at the end</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleStartSession}
                className="flex-1 bg-gradient-to-r from-chart-2 to-chart-2/80 hover:opacity-90"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Interview Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interview step
  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Setup
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Preview */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Camera Preview
                  {isListening && (
                    <Badge className="bg-destructive animate-pulse">
                      <Mic className="h-3 w-3 mr-1" />
                      Listening
                    </Badge>
                  )}
                </span>
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-sm font-normal">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permissionState === 'requesting' && (
                <Alert className="mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertTitle>Requesting Camera & Microphone Access</AlertTitle>
                  <AlertDescription>
                    Please allow camera and microphone access in your browser to continue with voice analysis and appearance evaluation.
                  </AlertDescription>
                </Alert>
              )}

              {permissionState === 'denied' && error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Access Denied</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{error.message}</p>
                    <p className="text-sm">
                      {error.type === 'permission' && 'Please click the camera icon in your browser\'s address bar and allow camera/microphone access.'}
                      {error.type === 'not-found' && 'Please connect a camera and microphone to your computer.'}
                      {error.type === 'not-supported' && 'Your browser does not support camera/microphone access.'}
                      {error.type === 'unknown' && 'Please check your browser settings and try again.'}
                    </p>
                    <Button onClick={handleRetryCamera} variant="outline" size="sm" className="mt-2">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Access
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {(isLoading || permissionState === 'requesting') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 mx-auto mb-2 text-primary animate-spin" />
                      <p className="text-foreground font-medium">Waiting for camera & microphone access...</p>
                      <p className="text-sm text-muted-foreground mt-1">Please allow permissions in your browser</p>
                    </div>
                  </div>
                )}

                {!isActive && !isComplete && !isLoading && permissionState !== 'requesting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <VideoOff className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Camera not active</p>
                      {permissionState === 'denied' && (
                        <Button onClick={handleRetryCamera} variant="outline" size="sm" className="mt-4">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {dressingScore > 0 && sessionStarted && isRecording && (
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-chart-3" />
                      <span className="text-sm font-medium">Appearance: {dressingScore}/100</span>
                    </div>
                  </div>
                )}

                {/* Progress indicator */}
                {!isComplete && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-background/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">Question {currentQuestionIndex + 1} of {selectedQuestionCount}</span>
                        <span className="text-muted-foreground">{Math.round((currentQuestionIndex / selectedQuestionCount) * 100)}% Complete</span>
                      </div>
                      <Progress value={(currentQuestionIndex / selectedQuestionCount) * 100} className="h-2" />
                    </div>
                  </div>
                )}
              </div>

              {transcript && isRecording && (
                <div className="mt-4 p-3 bg-muted rounded-lg transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Mic className="h-3 w-3" />
                    Live Transcript:
                  </p>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}

              {spokenAnswerFeedback && !isRecording && (
                <div className="mt-4 space-y-3 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4">
                  <Card className={`border-2 ${Number(spokenAnswerFeedback.correctnessRating) >= 80 ? 'border-chart-1' : Number(spokenAnswerFeedback.correctnessRating) >= 60 ? 'border-chart-3' : 'border-destructive'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {Number(spokenAnswerFeedback.correctnessRating) >= 80 ? (
                            <CheckCircle2 className="h-4 w-4 text-chart-1" />
                          ) : Number(spokenAnswerFeedback.correctnessRating) >= 60 ? (
                            <AlertTriangle className="h-4 w-4 text-chart-3" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          Answer Evaluation
                        </span>
                        <Badge variant={Number(spokenAnswerFeedback.correctnessRating) >= 80 ? 'default' : Number(spokenAnswerFeedback.correctnessRating) >= 60 ? 'secondary' : 'destructive'}>
                          {Number(spokenAnswerFeedback.correctnessRating)}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Correctness Rating:</p>
                        <Progress value={Number(spokenAnswerFeedback.correctnessRating)} className="h-2" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Improvement Suggestions:</p>
                        <p className="text-sm">{spokenAnswerFeedback.suggestedImprovements}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Recommended Answer:</p>
                        <p className="text-sm italic text-muted-foreground">{spokenAnswerFeedback.recommendedAnswer}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!isComplete && permissionState === 'granted' && (
                <div className="mt-4 flex gap-2">
                  {!isRecording ? (
                    <Button onClick={handleStartRecording} disabled={isLoading || !isActive} className="flex-1 bg-gradient-to-r from-chart-2 to-chart-2/80">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleStopRecording} variant="destructive" className="flex-1">
                        <VideoOff className="h-4 w-4 mr-2" />
                        Stop Recording
                      </Button>
                      <Button onClick={handleNextQuestion} variant="outline">
                        {currentQuestionIndex < interviewQuestions.length - 1 ? 'Next Question' : 'Complete Interview'}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {!isComplete && permissionState === 'denied' && (
                <div className="mt-4">
                  <Button onClick={handleRetryCamera} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Camera & Microphone Access
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Questions & Feedback */}
        <div className="space-y-4">
          {!isComplete ? (
            <>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base">
                    Question {currentQuestionIndex + 1} of {selectedQuestionCount}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium mb-4">{interviewQuestions[currentQuestionIndex].question}</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Maintain eye contact with the camera</p>
                    <p>• Speak clearly and confidently</p>
                    <p>• Use appropriate body language</p>
                    <p>• Address key concepts in your answer</p>
                    <p>• Provide specific examples</p>
                  </div>
                </CardContent>
              </Card>

              {sessionStarted && isRecording && (
                <Card className="shadow-lg border-chart-3 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-right-4">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mic className="h-4 w-4 text-chart-3" />
                      Voice Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="transition-all duration-300 ease-in-out">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Confidence</span>
                        <span className="font-medium">{voiceAnalysis.confidence}%</span>
                      </div>
                      <Progress value={voiceAnalysis.confidence} className="h-2" />
                    </div>
                    <div className="transition-all duration-300 ease-in-out">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Clarity</span>
                        <span className="font-medium">{voiceAnalysis.clarity}%</span>
                      </div>
                      <Progress value={voiceAnalysis.clarity} className="h-2" />
                    </div>
                    <div className="transition-all duration-300 ease-in-out">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Enthusiasm</span>
                        <span className="font-medium">{voiceAnalysis.enthusiasm}%</span>
                      </div>
                      <Progress value={voiceAnalysis.enthusiasm} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {!sessionStarted && (
                <Card className="shadow-lg border-muted">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      Analysis Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Voice and appearance analysis will begin once you start recording your answer.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="shadow-lg transition-all duration-500 ease-in-out animate-in fade-in zoom-in-95">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-chart-1" />
                  Interview Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Session Summary</p>
                  <p className="text-xs text-muted-foreground">
                    Completed {selectedQuestionCount} questions for {config.role}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '100ms' }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Body Language</span>
                      <span className="font-medium">{analysisScores.bodyLanguage}%</span>
                    </div>
                    <Progress value={analysisScores.bodyLanguage} className="h-2" />
                  </div>

                  <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '200ms' }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Eye Contact</span>
                      <span className="font-medium">{analysisScores.eyeContact}%</span>
                    </div>
                    <Progress value={analysisScores.eyeContact} className="h-2" />
                  </div>

                  <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '300ms' }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Voice Tone</span>
                      <span className="font-medium">{analysisScores.toneScore}%</span>
                    </div>
                    <Progress value={analysisScores.toneScore} className="h-2" />
                  </div>

                  <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '400ms' }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Professional Appearance</span>
                      <span className="font-medium">{analysisScores.stylingScore}%</span>
                    </div>
                    <Progress value={analysisScores.stylingScore} className="h-2" />
                  </div>

                  <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '500ms' }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Confidence</span>
                      <span className="font-medium">{analysisScores.confidence}%</span>
                    </div>
                    <Progress value={analysisScores.confidence} className="h-2" />
                  </div>

                  <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '600ms' }}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Clarity</span>
                      <span className="font-medium">{analysisScores.clarity}%</span>
                    </div>
                    <Progress value={analysisScores.clarity} className="h-2" />
                  </div>

                  {allAnswerFeedbacks.length > 0 && (
                    <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '700ms' }}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Answer Quality</span>
                        <span className="font-medium">
                          {Math.round(allAnswerFeedbacks.reduce((sum, f) => sum + Number(f.correctnessRating), 0) / allAnswerFeedbacks.length)}%
                        </span>
                      </div>
                      <Progress 
                        value={allAnswerFeedbacks.reduce((sum, f) => sum + Number(f.correctnessRating), 0) / allAnswerFeedbacks.length} 
                        className="h-2" 
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {generateComprehensiveFeedback(
                      analysisScores, 
                      allAnswerFeedbacks.length > 0 
                        ? allAnswerFeedbacks.reduce((sum, f) => sum + Number(f.correctnessRating), 0) / allAnswerFeedbacks.length 
                        : 0
                    )}
                  </p>
                </div>

                {allAnswerFeedbacks.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Correct Answers Reference:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {interviewQuestions.map((q, idx) => (
                        <div key={idx} className="p-2 bg-muted rounded text-xs">
                          <p className="font-medium mb-1">Q{idx + 1}: {q.question}</p>
                          <p className="text-muted-foreground italic">{q.expectedAnswer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
