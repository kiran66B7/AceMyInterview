import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useGetInterviewSessions, useGetLiveMockData } from '../hooks/useQueries';
import { MessageSquare, Video, Calendar, Target, TrendingUp } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export default function SessionHistory() {
  const { data: chatbotSessions = [], isLoading: loadingSessions } = useGetInterviewSessions();
  const { data: liveMockSessions = [], isLoading: loadingLiveMock } = useGetLiveMockData();

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
      case 'medium':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      case 'hard':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loadingSessions || loadingLiveMock) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Practice History</h2>
        <p className="text-muted-foreground">Review your past interview sessions and track your progress</p>
      </div>

      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="chatbot">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chatbot ({chatbotSessions.length})
          </TabsTrigger>
          <TabsTrigger value="live">
            <Video className="h-4 w-4 mr-2" />
            Live Mock ({liveMockSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chatbot" className="mt-6">
          {chatbotSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No chatbot interview sessions yet</p>
                <p className="text-sm text-muted-foreground mt-2">Start your first practice session to see it here</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {chatbotSessions.map((session) => (
                  <Card key={session.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{session.role}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.startTime)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{session.interviewType}</Badge>
                          <Badge className={getDifficultyColor(session.difficulty)}>{session.difficulty}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Target className="h-4 w-4" />
                          <span>{session.questions.length} questions answered</span>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{session.overallFeedback}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          {liveMockSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No live mock interview sessions yet</p>
                <p className="text-sm text-muted-foreground mt-2">Start your first live practice to see it here</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {liveMockSessions.map((session) => (
                  <Card key={session.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Live Mock Interview</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.recordedAt)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Session #{session.sessionId.slice(-6)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Body Language</p>
                            <p className="text-lg font-semibold">{Number(session.bodyLanguageScore)}%</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Eye Contact</p>
                            <p className="text-lg font-semibold">{Number(session.eyeContactScore)}%</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                            <p className="text-lg font-semibold">{Number(session.confidenceScore)}%</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Clarity</p>
                            <p className="text-lg font-semibold">{Number(session.clarityScore)}%</p>
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{session.feedback}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
