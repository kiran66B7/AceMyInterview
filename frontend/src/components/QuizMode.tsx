import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Trophy, Clock, CheckCircle2, XCircle, Play, RotateCcw } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveQuizResult } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { QuizResult } from '../backend';

const QUIZ_QUESTIONS = {
  'Software Engineer': [
    {
      question: 'What is the time complexity of binary search?',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      correctAnswer: 1,
    },
    {
      question: 'Which data structure uses LIFO principle?',
      options: ['Queue', 'Stack', 'Array', 'Tree'],
      correctAnswer: 1,
    },
    {
      question: 'What does REST stand for?',
      options: ['Remote State Transfer', 'Representational State Transfer', 'Resource State Transfer', 'Relational State Transfer'],
      correctAnswer: 1,
    },
    {
      question: 'Which sorting algorithm has the best average case time complexity?',
      options: ['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Selection Sort'],
      correctAnswer: 2,
    },
    {
      question: 'What is polymorphism in OOP?',
      options: ['Multiple inheritance', 'Method overloading', 'Ability to take multiple forms', 'Data encapsulation'],
      correctAnswer: 2,
    },
  ],
  'Product Manager': [
    {
      question: 'What is a product roadmap?',
      options: ['A list of bugs', 'Strategic plan for product development', 'Marketing strategy', 'Sales forecast'],
      correctAnswer: 1,
    },
    {
      question: 'What does MVP stand for?',
      options: ['Most Valuable Player', 'Minimum Viable Product', 'Maximum Value Proposition', 'Market Validation Process'],
      correctAnswer: 1,
    },
    {
      question: 'Which metric measures user engagement?',
      options: ['Revenue', 'DAU/MAU ratio', 'Cost per acquisition', 'Profit margin'],
      correctAnswer: 1,
    },
    {
      question: 'What is A/B testing?',
      options: ['Testing two products', 'Comparing two versions', 'Alpha and Beta testing', 'Automated testing'],
      correctAnswer: 1,
    },
    {
      question: 'What is product-market fit?',
      options: ['Product pricing', 'Product matching market needs', 'Market size', 'Product features'],
      correctAnswer: 1,
    },
  ],
  'Data Scientist': [
    {
      question: 'What is overfitting in machine learning?',
      options: ['Model too simple', 'Model too complex', 'Perfect model', 'Underfitting'],
      correctAnswer: 1,
    },
    {
      question: 'Which algorithm is used for classification?',
      options: ['Linear Regression', 'K-Means', 'Decision Tree', 'PCA'],
      correctAnswer: 2,
    },
    {
      question: 'What is the purpose of cross-validation?',
      options: ['Data cleaning', 'Model evaluation', 'Feature selection', 'Data visualization'],
      correctAnswer: 1,
    },
    {
      question: 'What does ROC curve measure?',
      options: ['Model accuracy', 'True positive vs false positive rate', 'Training time', 'Data quality'],
      correctAnswer: 1,
    },
    {
      question: 'What is feature engineering?',
      options: ['Creating new features', 'Removing features', 'Scaling features', 'All of the above'],
      correctAnswer: 3,
    },
  ],
};

const QUIZ_TIME_LIMIT = 60; // seconds per quiz

export default function QuizMode() {
  const { identity } = useInternetIdentity();
  const saveQuizResult = useSaveQuizResult();
  const [selectedRole, setSelectedRole] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(QUIZ_TIME_LIMIT);
  const [isComplete, setIsComplete] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const questions = QUIZ_QUESTIONS[selectedRole as keyof typeof QUIZ_QUESTIONS] || [];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuizActive && timeRemaining > 0 && !isComplete) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isQuizActive, timeRemaining, isComplete]);

  const handleStartQuiz = () => {
    if (!selectedRole) {
      toast.error('Please select a role first');
      return;
    }
    setIsQuizActive(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeRemaining(QUIZ_TIME_LIMIT);
    setIsComplete(false);
    setAnswers([]);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const isCorrect = answerIndex === questions[currentQuestionIndex].correctAnswer;
    setAnswers([...answers, isCorrect]);
    
    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
      } else {
        handleQuizComplete();
      }
    }, 1500);
  };

  const handleTimeUp = () => {
    handleQuizComplete();
  };

  const handleQuizComplete = async () => {
    setIsComplete(true);
    setIsQuizActive(false);

    if (!identity) return;

    const result: QuizResult = {
      id: `quiz-${Date.now()}`,
      user: identity.getPrincipal(),
      score: BigInt(score),
      completedAt: BigInt(Date.now() * 1000000),
      role: selectedRole,
    };

    try {
      await saveQuizResult.mutateAsync(result);
      toast.success('Quiz results saved!');
    } catch (error) {
      console.error('Error saving quiz result:', error);
      toast.error('Failed to save quiz results');
    }
  };

  const handleRestart = () => {
    setIsQuizActive(false);
    setIsComplete(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeRemaining(QUIZ_TIME_LIMIT);
    setAnswers([]);
    setSelectedAnswer(null);
  };

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Game-Like Quiz Mode</h2>
        <p className="text-muted-foreground">Test your knowledge with timed, interactive questions</p>
      </div>

      {!isQuizActive && !isComplete && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-chart-4" />
              Quiz Setup
            </CardTitle>
            <CardDescription>Select your role and difficulty to begin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quizRole">Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="quizRole">
                  <SelectValue placeholder="Choose your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                  <SelectItem value="Product Manager">Product Manager</SelectItem>
                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quizDifficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="quizDifficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Quiz Details:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {questions.length} multiple-choice questions</li>
                <li>• {QUIZ_TIME_LIMIT} seconds time limit</li>
                <li>• Instant feedback after each answer</li>
                <li>• Score tracking and achievements</li>
              </ul>
            </div>

            <Button onClick={handleStartQuiz} disabled={!selectedRole} className="w-full bg-gradient-to-r from-chart-4 to-chart-5 hover:opacity-90 transition-opacity" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {isQuizActive && !isComplete && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-sm">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
              <Badge className="bg-chart-4 text-white flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeRemaining}s
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">{questions[currentQuestionIndex]?.question}</h3>
              <div className="space-y-3">
                {questions[currentQuestionIndex]?.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === questions[currentQuestionIndex].correctAnswer;
                  const showResult = selectedAnswer !== null;

                  return (
                    <Button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={selectedAnswer !== null}
                      variant="outline"
                      className={`w-full justify-start text-left h-auto py-4 px-4 transition-all ${
                        showResult && isSelected && isCorrect
                          ? 'bg-chart-1/20 border-chart-1 text-chart-1'
                          : showResult && isSelected && !isCorrect
                          ? 'bg-destructive/20 border-destructive text-destructive'
                          : showResult && isCorrect
                          ? 'bg-chart-1/10 border-chart-1/50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          showResult && isSelected && isCorrect
                            ? 'bg-chart-1 text-white'
                            : showResult && isSelected && !isCorrect
                            ? 'bg-destructive text-white'
                            : 'bg-muted'
                        }`}>
                          {showResult && isSelected && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4" />}
                          {(!showResult || !isSelected) && String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{option}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">Current Score:</span>
              <Badge className="bg-chart-4 text-white text-lg px-4 py-1">
                {score} / {questions.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {isComplete && (
        <Card className="shadow-lg border-2 border-chart-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-8 w-8 text-chart-4" />
              Quiz Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-chart-4 mb-2">
                {score}/{questions.length}
              </div>
              <p className="text-xl text-muted-foreground">
                {score === questions.length ? 'Perfect Score! 🎉' : score >= questions.length * 0.7 ? 'Great Job! 👏' : 'Keep Practicing! 💪'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                <p className="text-2xl font-bold">{Math.round((score / questions.length) * 100)}%</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Time Used</p>
                <p className="text-2xl font-bold">{QUIZ_TIME_LIMIT - timeRemaining}s</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Question Results:</p>
              <div className="flex flex-wrap gap-2">
                {answers.map((isCorrect, index) => (
                  <Badge
                    key={index}
                    className={isCorrect ? 'bg-chart-1' : 'bg-destructive'}
                  >
                    Q{index + 1}: {isCorrect ? '✓' : '✗'}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleRestart} className="w-full bg-gradient-to-r from-chart-4 to-chart-5 hover:opacity-90 transition-opacity" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
