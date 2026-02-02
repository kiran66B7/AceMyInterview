import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MessageSquare, Video, BarChart3, Upload, Sparkles, Target, Mic, Camera, BookOpen, Award } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/generated/pathwiz-logo-large-transparent.dim_300x150.png" 
              alt="PathWiz Logo" 
              className="h-16 w-auto object-contain"
              loading="eager"
            />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={login} disabled={isLoggingIn} size="lg" className="bg-gradient-to-r from-primary to-chart-1 hover:opacity-90 transition-opacity">
              {isLoggingIn ? 'Connecting...' : 'Get Started'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-chart-1/5 to-chart-2/5" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-chart-1/10 text-primary text-sm font-medium mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="h-4 w-4" />
              AI-Powered Interview Preparation Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-chart-1 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Master Your Next Interview with AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Practice with AI-driven mock interviews, voice analysis, resume scanning, and comprehensive feedback. 
              Prepare for technical, behavioral, and HR interviews with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Button onClick={login} disabled={isLoggingIn} size="lg" className="text-lg px-8 bg-gradient-to-r from-primary to-chart-1 hover:opacity-90 transition-opacity shadow-lg">
                {isLoggingIn ? 'Connecting...' : 'Start Practicing Now'}
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 border-2 hover:border-primary transition-colors" asChild>
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
          <div className="mt-16 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <div className="rounded-xl overflow-hidden border-2 border-border shadow-2xl">
              <img 
                src="/assets/generated/hero-interview-optimized.dim_1200x600.webp" 
                alt="Interview preparation dashboard"
                className="w-full h-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI-powered tools to help you prepare for any interview scenario
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-chart-1 to-chart-1/70 flex items-center justify-center mb-4 shadow-md">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">AI Chatbot Interviews</CardTitle>
                <CardDescription className="text-base">
                  Practice with an intelligent AI that asks contextual questions based on your resume and target role with instant feedback
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-chart-2 to-chart-2/70 flex items-center justify-center mb-4 shadow-md">
                  <Video className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Live Mock Interviews</CardTitle>
                <CardDescription className="text-base">
                  Record yourself and get real-time feedback on body language, eye contact, facial expressions, and professional appearance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-chart-3 to-chart-3/70 flex items-center justify-center mb-4 shadow-md">
                  <Mic className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Voice Analysis</CardTitle>
                <CardDescription className="text-base">
                  Advanced speech recognition and tone detection to analyze confidence, clarity, and enthusiasm in your responses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-chart-4 to-chart-4/70 flex items-center justify-center mb-4 shadow-md">
                  <Upload className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Resume Scanning</CardTitle>
                <CardDescription className="text-base">
                  LLM-powered resume analysis with quality ratings, content evaluation, and personalized improvement recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-chart-5 to-chart-5/70 flex items-center justify-center mb-4 shadow-md">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Game-Like Quiz Mode</CardTitle>
                <CardDescription className="text-base">
                  Timed, interactive multiple-choice questions tailored to your role with instant scoring and achievement tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-4 shadow-md">
                  <BarChart3 className="h-7 w-7 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">Comprehensive Analytics</CardTitle>
                <CardDescription className="text-base">
                  Overall candidate review combining all assessments with strength/weakness analysis and final readiness rating
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center mb-4 shadow-md">
                  <Camera className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Appearance Evaluation</CardTitle>
                <CardDescription className="text-base">
                  Professional dressing sense assessment with style scores and constructive feedback for interview presentation
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-chart-3 to-chart-4 flex items-center justify-center mb-4 shadow-md">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Resource Library</CardTitle>
                <CardDescription className="text-base">
                  Curated collection of reliable and free external resources tailored to your selected role for additional preparation
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-chart-5 to-primary flex items-center justify-center mb-4 shadow-md">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">Role-Specific Rounds</CardTitle>
                <CardDescription className="text-base">
                  Dynamic interview stages and questions customized for your target job role with progressive difficulty levels
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 via-chart-1/10 to-chart-2/10 rounded-2xl p-12 border-2 border-border shadow-xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Ready to Ace Your Interview?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of professionals who have improved their interview skills with PathWiz's AI-powered platform
            </p>
            <Button onClick={login} disabled={isLoggingIn} size="lg" className="text-lg px-8 bg-gradient-to-r from-primary to-chart-1 hover:opacity-90 transition-opacity shadow-lg">
              {isLoggingIn ? 'Connecting...' : 'Start Your Free Practice'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/generated/pathwiz-logo-large-transparent.dim_300x150.png" 
                alt="PathWiz Logo" 
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2025. Built with ❤️ using{' '}
              <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                caffeine.ai
              </a>
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <SiGithub className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
