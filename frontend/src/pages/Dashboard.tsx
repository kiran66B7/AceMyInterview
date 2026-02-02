import { useState, lazy, Suspense } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LogOut, Home, Loader2 } from 'lucide-react';
import InterviewSetup from '../components/InterviewSetup';
import SessionHistory from '../components/SessionHistory';
import QuizMode from '../components/QuizMode';
import ResourcePanel from '../components/ResourcePanel';
import ThemeToggle from '../components/ThemeToggle';

// Lazy load heavy components
const ChatbotInterview = lazy(() => import('../components/ChatbotInterview'));
const LiveMockInterview = lazy(() => import('../components/LiveMockInterview'));
const CandidateReviewPanel = lazy(() => import('../components/CandidateReviewPanel'));

type View = 'home' | 'setup' | 'chatbot' | 'live' | 'history' | 'quiz' | 'resources' | 'review';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
      <p className="text-muted-foreground">Loading component...</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<View>('home');
  const [interviewConfig, setInterviewConfig] = useState<{
    role: string;
    interviewType: string;
    difficulty: string;
    resumeId?: string;
  } | null>(null);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleStartInterview = (config: { role: string; interviewType: string; difficulty: string; resumeId?: string }, mode: 'chatbot' | 'live') => {
    setInterviewConfig(config);
    setCurrentView(mode);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setInterviewConfig(null);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/generated/pathwiz-logo-large-transparent.dim_300x150.png" 
              alt="PathWiz Logo" 
              className="h-14 w-auto object-contain"
              loading="eager"
            />
          </div>
          <div className="flex items-center gap-2">
            {currentView !== 'home' && (
              <Button variant="ghost" onClick={handleBackToHome}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            )}
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout} className="hover:border-primary transition-colors">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'home' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Welcome to Your Interview Studio</h1>
              <p className="text-xl text-muted-foreground">Choose how you want to practice today</p>
            </div>

            <Tabs defaultValue="practice" className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-5 h-auto">
                <TabsTrigger value="practice" className="text-sm">Practice</TabsTrigger>
                <TabsTrigger value="quiz" className="text-sm">Quiz</TabsTrigger>
                <TabsTrigger value="resources" className="text-sm">Resources</TabsTrigger>
                <TabsTrigger value="review" className="text-sm">Review</TabsTrigger>
                <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
              </TabsList>

              <TabsContent value="practice" className="mt-6">
                <InterviewSetup onStartInterview={handleStartInterview} />
              </TabsContent>

              <TabsContent value="quiz" className="mt-6">
                <QuizMode />
              </TabsContent>

              <TabsContent value="resources" className="mt-6">
                <ResourcePanel />
              </TabsContent>

              <TabsContent value="review" className="mt-6">
                <Suspense fallback={<LoadingFallback />}>
                  <CandidateReviewPanel />
                </Suspense>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <SessionHistory />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {currentView === 'chatbot' && interviewConfig && (
          <Suspense fallback={<LoadingFallback />}>
            <ChatbotInterview config={interviewConfig} onBack={handleBackToHome} />
          </Suspense>
        )}

        {currentView === 'live' && interviewConfig && (
          <Suspense fallback={<LoadingFallback />}>
            <LiveMockInterview config={interviewConfig} onBack={handleBackToHome} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
