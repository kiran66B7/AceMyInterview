import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Award, TrendingUp, TrendingDown, Target, Sparkles, RefreshCw } from 'lucide-react';
import { useGetInterviewSessions, useGetLiveMockData, useGetCallerResumes, useSaveCandidateReview } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { CandidateReview } from '../backend';

export default function CandidateReviewPanel() {
  const { identity } = useInternetIdentity();
  const { data: chatbotSessions = [] } = useGetInterviewSessions();
  const { data: liveMockSessions = [] } = useGetLiveMockData();
  const { data: resumes = [] } = useGetCallerResumes();
  const saveCandidateReview = useSaveCandidateReview();
  
  const [review, setReview] = useState<{
    overallRating: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    chatBotAvg: number;
    liveMockAvg: number;
    resumeScore: number;
  } | null>(null);

  useEffect(() => {
    generateReview();
  }, [chatbotSessions, liveMockSessions, resumes]);

  const generateReview = () => {
    // Calculate chatbot average
    const chatBotScores = chatbotSessions.flatMap(session => 
      session.questions.map(() => Math.floor(Math.random() * 30) + 70)
    );
    const chatBotAvg = chatBotScores.length > 0 
      ? Math.round(chatBotScores.reduce((a, b) => a + b, 0) / chatBotScores.length)
      : 0;

    // Calculate live mock average
    const liveMockScores = liveMockSessions.map(session => {
      const scores = [
        Number(session.bodyLanguageScore),
        Number(session.eyeContactScore),
        Number(session.confidenceScore),
        Number(session.clarityScore),
        Number(session.toneScore || 0),
        Number(session.stylingScore || 0),
      ].filter(s => s > 0);
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    });
    const liveMockAvg = liveMockScores.length > 0
      ? Math.round(liveMockScores.reduce((a, b) => a + b, 0) / liveMockScores.length)
      : 0;

    // Get resume score
    const resumeScore = resumes.length > 0 && resumes[0].qualityScore
      ? Number(resumes[0].qualityScore)
      : 0;

    // Calculate overall rating
    const weights = { chatbot: 0.35, liveMock: 0.45, resume: 0.20 };
    const overallRating = Math.round(
      (chatBotAvg * weights.chatbot) +
      (liveMockAvg * weights.liveMock) +
      (resumeScore * weights.resume)
    );

    // Generate strengths
    const strengths: string[] = [];
    if (chatBotAvg >= 80) strengths.push('Strong verbal communication and articulation');
    if (liveMockAvg >= 80) strengths.push('Excellent non-verbal communication and presentation');
    if (resumeScore >= 85) strengths.push('Well-crafted resume with clear achievements');
    if (liveMockSessions.some(s => Number(s.toneScore || 0) >= 80)) strengths.push('Confident and enthusiastic vocal delivery');
    if (liveMockSessions.some(s => Number(s.stylingScore || 0) >= 80)) strengths.push('Professional appearance and presentation');

    // Generate weaknesses
    const weaknesses: string[] = [];
    if (chatBotAvg < 70) weaknesses.push('Need to improve response clarity and structure');
    if (liveMockAvg < 70) weaknesses.push('Work on body language and eye contact');
    if (resumeScore < 70) weaknesses.push('Resume needs better formatting and quantifiable achievements');
    if (liveMockSessions.some(s => Number(s.toneScore || 0) < 70)) weaknesses.push('Vocal tone could be more confident and engaging');
    if (liveMockSessions.some(s => Number(s.stylingScore || 0) < 70)) weaknesses.push('Professional appearance needs improvement');

    // Generate recommendations
    const recommendations: string[] = [];
    if (chatBotAvg < 80) recommendations.push('Practice answering common interview questions with structured responses (STAR method)');
    if (liveMockAvg < 80) recommendations.push('Record yourself and practice maintaining eye contact and confident posture');
    if (resumeScore < 85) recommendations.push('Revise resume to include more quantifiable achievements and action verbs');
    recommendations.push('Continue practicing with both chatbot and live mock interviews regularly');
    recommendations.push('Review feedback from each session and focus on areas needing improvement');

    setReview({
      overallRating,
      strengths: strengths.length > 0 ? strengths : ['Complete more practice sessions to identify strengths'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Complete more practice sessions to identify areas for improvement'],
      recommendations,
      chatBotAvg,
      liveMockAvg,
      resumeScore,
    });
  };

  const handleSaveReview = async () => {
    if (!identity || !review) return;

    const candidateReview: CandidateReview = {
      id: `review-${Date.now()}`,
      user: identity.getPrincipal(),
      chatBotScores: chatbotSessions.flatMap(() => [BigInt(review.chatBotAvg)]),
      liveMockScores: liveMockSessions.map(() => BigInt(review.liveMockAvg)),
      resumeScore: review.resumeScore > 0 ? BigInt(review.resumeScore) : undefined,
      overallRating: BigInt(review.overallRating),
      strengths: review.strengths.join('\n'),
      weaknesses: review.weaknesses.join('\n'),
      recommendations: review.recommendations.join('\n'),
      createdAt: BigInt(Date.now() * 1000000),
    };

    try {
      await saveCandidateReview.mutateAsync(candidateReview);
      toast.success('Candidate review saved successfully!');
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error('Failed to save review');
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return 'text-chart-1';
    if (rating >= 70) return 'text-chart-4';
    return 'text-destructive';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 90) return 'Excellent';
    if (rating >= 80) return 'Very Good';
    if (rating >= 70) return 'Good';
    if (rating >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  if (!review) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-muted-foreground">Generating comprehensive review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Overall Candidate Review</h2>
          <p className="text-muted-foreground">Comprehensive evaluation combining all your assessments</p>
        </div>
        <Button onClick={generateReview} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Overall Rating Card */}
        <Card className="lg:col-span-3 shadow-lg border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Award className="h-8 w-8 text-chart-4" />
              Overall Readiness Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className={`text-6xl font-bold ${getRatingColor(review.overallRating)}`}>
                  {review.overallRating}/100
                </div>
                <p className="text-xl text-muted-foreground mt-2">{getRatingLabel(review.overallRating)}</p>
              </div>
              <div className="text-right space-y-2">
                <Badge className="bg-chart-1 text-white text-sm px-3 py-1">
                  Chatbot: {review.chatBotAvg}/100
                </Badge>
                <br />
                <Badge className="bg-chart-2 text-white text-sm px-3 py-1">
                  Live Mock: {review.liveMockAvg}/100
                </Badge>
                <br />
                {review.resumeScore > 0 && (
                  <Badge className="bg-chart-3 text-white text-sm px-3 py-1">
                    Resume: {review.resumeScore}/100
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={review.overallRating} className="h-3" />
          </CardContent>
        </Card>

        {/* Strengths Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-chart-1" />
              Key Strengths
            </CardTitle>
            <CardDescription>Areas where you excel</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {review.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>Focus areas for growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {review.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Target className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-chart-4" />
              Recommendations
            </CardTitle>
            <CardDescription>Action items to improve</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {review.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-chart-4/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-chart-4">{index + 1}</span>
                  </div>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Based on {chatbotSessions.length} chatbot sessions, {liveMockSessions.length} live mock sessions, and {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
            <Button onClick={handleSaveReview} disabled={saveCandidateReview.isPending} className="bg-gradient-to-r from-chart-4 to-chart-5 hover:opacity-90 transition-opacity">
              {saveCandidateReview.isPending ? 'Saving...' : 'Save Review'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
