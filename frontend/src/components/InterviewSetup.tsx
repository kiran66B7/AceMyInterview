import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MessageSquare, Video, Upload, Loader2, FileText, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { useUploadResume, useGetCallerResumes, useSaveInterviewSettings, useHasUploadedResume, useGetCallerLatestResume, useGetImprovementSuggestions } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import ResumeRoleVerification from './ResumeRoleVerification';
import type { ImprovementSuggestion } from '../backend';

interface InterviewSetupProps {
  onStartInterview: (config: { role: string; interviewType: string; difficulty: string; resumeId?: string; questionCount: number }, mode: 'chatbot' | 'live') => void;
}

const ROLE_SPECIFIC_ROUNDS: Record<string, string[]> = {
  'Software Engineer': ['Technical Screening', 'Coding Challenge', 'System Design', 'Behavioral', 'Final Round'],
  'Product Manager': ['Product Sense', 'Analytical', 'Technical Understanding', 'Leadership', 'Final Round'],
  'Data Scientist': ['Technical Screening', 'Statistics & ML', 'Coding', 'Case Study', 'Final Round'],
  'Designer': ['Portfolio Review', 'Design Challenge', 'Collaboration', 'Presentation', 'Final Round'],
  'Marketing Manager': ['Strategy', 'Analytics', 'Campaign Planning', 'Behavioral', 'Final Round'],
};

// Auto-suggest interview type based on role keywords
const suggestInterviewType = (role: string): string => {
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes('engineer') || lowerRole.includes('developer') || lowerRole.includes('programmer')) {
    return 'Technical';
  } else if (lowerRole.includes('manager') || lowerRole.includes('lead') || lowerRole.includes('director')) {
    return 'Behavioral';
  } else if (lowerRole.includes('designer') || lowerRole.includes('ux') || lowerRole.includes('ui')) {
    return 'Case Study';
  } else if (lowerRole.includes('data') || lowerRole.includes('analyst')) {
    return 'Technical';
  }
  return 'HR';
};

// Auto-suggest difficulty based on role seniority
const suggestDifficulty = (role: string): string => {
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes('senior') || lowerRole.includes('lead') || lowerRole.includes('principal') || lowerRole.includes('staff')) {
    return 'Hard';
  } else if (lowerRole.includes('junior') || lowerRole.includes('entry') || lowerRole.includes('intern')) {
    return 'Beginner';
  }
  return 'Medium';
};

// Simulate LLM role detection from resume content
const detectRoleFromResume = (resumeContent: string, fileName: string): string => {
  const content = resumeContent.toLowerCase() + ' ' + fileName.toLowerCase();
  
  if (content.includes('software') || content.includes('developer') || content.includes('engineer') || content.includes('programming')) {
    return 'Software Engineer';
  } else if (content.includes('product') || content.includes('manager') || content.includes('pm')) {
    return 'Product Manager';
  } else if (content.includes('data') || content.includes('scientist') || content.includes('analyst') || content.includes('analytics')) {
    return 'Data Scientist';
  } else if (content.includes('design') || content.includes('ux') || content.includes('ui')) {
    return 'Designer';
  } else if (content.includes('marketing') || content.includes('sales') || content.includes('business')) {
    return 'Marketing Manager';
  }
  
  return 'General Professional';
};

// Check if roles are significantly different
const areRolesMismatched = (detectedRole: string, targetRole: string): boolean => {
  const detected = detectedRole.toLowerCase();
  const target = targetRole.toLowerCase();
  
  // Exact match or very similar
  if (detected === target || target.includes(detected) || detected.includes(target)) {
    return false;
  }
  
  // Check for role category matches
  const techRoles = ['software', 'engineer', 'developer', 'programmer', 'technical'];
  const managerRoles = ['manager', 'lead', 'director', 'head'];
  const dataRoles = ['data', 'scientist', 'analyst', 'analytics'];
  const designRoles = ['design', 'ux', 'ui', 'creative'];
  
  const detectedIsTech = techRoles.some(r => detected.includes(r));
  const targetIsTech = techRoles.some(r => target.includes(r));
  
  const detectedIsManager = managerRoles.some(r => detected.includes(r));
  const targetIsManager = managerRoles.some(r => target.includes(r));
  
  const detectedIsData = dataRoles.some(r => detected.includes(r));
  const targetIsData = dataRoles.some(r => target.includes(r));
  
  const detectedIsDesign = designRoles.some(r => detected.includes(r));
  const targetIsDesign = designRoles.some(r => target.includes(r));
  
  // If both are in the same category, not a mismatch
  if ((detectedIsTech && targetIsTech) || 
      (detectedIsManager && targetIsManager) ||
      (detectedIsData && targetIsData) ||
      (detectedIsDesign && targetIsDesign)) {
    return false;
  }
  
  // Otherwise, it's a mismatch
  return true;
};

// Generate role-specific improvement suggestions
const generateImprovementSuggestions = (targetRole: string, resumeScore: number): ImprovementSuggestion[] => {
  const baseRole = targetRole.toLowerCase();
  const suggestions: ImprovementSuggestion[] = [];
  
  if (baseRole.includes('software') || baseRole.includes('engineer') || baseRole.includes('developer')) {
    suggestions.push(
      {
        title: 'Highlight Technical Skills and Technologies',
        description: 'Ensure your resume prominently features programming languages, frameworks, and tools relevant to the role. Include specific versions and proficiency levels.',
        priority: BigInt(1),
        implementationTips: [
          'Create a dedicated "Technical Skills" section near the top of your resume',
          'List technologies in order of proficiency and relevance to the target role',
          'Include both frontend and backend technologies if applying for full-stack positions',
          'Mention cloud platforms (AWS, Azure, GCP) and DevOps tools if applicable'
        ]
      },
      {
        title: 'Quantify Your Technical Achievements',
        description: 'Add measurable outcomes to your project descriptions, such as performance improvements, user growth, or system reliability metrics.',
        priority: BigInt(1),
        implementationTips: [
          'Use metrics like "Improved API response time by 40%"',
          'Include scale indicators: "Built system handling 1M+ daily requests"',
          'Mention code quality improvements: "Reduced bug rate by 30%"',
          'Highlight team impact: "Mentored 3 junior developers"'
        ]
      },
      {
        title: 'Showcase System Design Experience',
        description: 'Demonstrate your ability to architect scalable systems and make technical trade-off decisions.',
        priority: BigInt(2),
        implementationTips: [
          'Describe architecture decisions you made and why',
          'Mention scalability challenges you solved',
          'Include experience with microservices, databases, or distributed systems',
          'Reference design patterns and best practices you follow'
        ]
      }
    );
  } else if (baseRole.includes('product') || baseRole.includes('manager')) {
    suggestions.push(
      {
        title: 'Emphasize Product Strategy and Vision',
        description: 'Highlight your experience defining product roadmaps, conducting market research, and aligning product strategy with business goals.',
        priority: BigInt(1),
        implementationTips: [
          'Describe products you launched from concept to market',
          'Include market research and competitive analysis experience',
          'Mention stakeholder management and cross-functional collaboration',
          'Highlight strategic decisions that drove business outcomes'
        ]
      },
      {
        title: 'Demonstrate Data-Driven Decision Making',
        description: 'Show how you use analytics, A/B testing, and user feedback to inform product decisions and measure success.',
        priority: BigInt(1),
        implementationTips: [
          'Include specific metrics you tracked and improved',
          'Mention A/B tests you designed and their outcomes',
          'Reference analytics tools you use (Google Analytics, Mixpanel, etc.)',
          'Show how data influenced your product decisions'
        ]
      },
      {
        title: 'Highlight Leadership and Communication Skills',
        description: 'Showcase your ability to lead teams, influence stakeholders, and communicate product vision effectively.',
        priority: BigInt(2),
        implementationTips: [
          'Describe teams you led or collaborated with',
          'Mention presentations to executives or stakeholders',
          'Include examples of resolving conflicts or aligning teams',
          'Highlight your role in agile ceremonies and sprint planning'
        ]
      }
    );
  } else if (baseRole.includes('data') || baseRole.includes('scientist') || baseRole.includes('analyst')) {
    suggestions.push(
      {
        title: 'Showcase Statistical and ML Expertise',
        description: 'Highlight your proficiency in statistical analysis, machine learning algorithms, and data modeling techniques.',
        priority: BigInt(1),
        implementationTips: [
          'List ML frameworks (TensorFlow, PyTorch, scikit-learn)',
          'Mention specific algorithms you\'ve implemented',
          'Include statistical methods and hypothesis testing experience',
          'Reference model performance metrics and improvements'
        ]
      },
      {
        title: 'Demonstrate Business Impact of Your Analysis',
        description: 'Show how your data insights led to actionable business decisions and measurable outcomes.',
        priority: BigInt(1),
        implementationTips: [
          'Quantify business impact: "Analysis led to 15% revenue increase"',
          'Describe insights that changed business strategy',
          'Mention cost savings or efficiency improvements from your work',
          'Include examples of predictive models in production'
        ]
      },
      {
        title: 'Highlight Data Engineering and Pipeline Skills',
        description: 'Demonstrate your ability to work with large datasets, build data pipelines, and ensure data quality.',
        priority: BigInt(2),
        implementationTips: [
          'Mention experience with SQL, Python, R, and data tools',
          'Include ETL pipeline development experience',
          'Reference big data technologies (Spark, Hadoop, etc.)',
          'Describe data quality and validation processes you implemented'
        ]
      }
    );
  }
  
  // Add common suggestions for all roles
  suggestions.push(
    {
      title: 'Use Strong Action Verbs',
      description: 'Begin each bullet point with powerful action verbs that demonstrate your impact and initiative.',
      priority: BigInt(2),
      implementationTips: [
        'Replace weak verbs: "Responsible for" → "Led", "Managed", "Drove"',
        'Use achievement-focused verbs: "Achieved", "Delivered", "Optimized"',
        'Vary your verb choices to avoid repetition',
        'Match verb tense: past tense for previous roles, present for current'
      ]
    },
    {
      title: 'Tailor Content to Job Description',
      description: 'Align your resume content with the specific requirements and keywords from the target job posting.',
      priority: BigInt(1),
      implementationTips: [
        'Mirror keywords from the job description naturally',
        'Prioritize relevant experience over less relevant roles',
        'Adjust your summary to match the role requirements',
        'Highlight transferable skills that match the position'
      ]
    },
    {
      title: 'Improve Resume Formatting and Readability',
      description: 'Ensure your resume is well-organized, easy to scan, and professionally formatted.',
      priority: BigInt(3),
      implementationTips: [
        'Use consistent formatting for dates, locations, and titles',
        'Keep bullet points concise (1-2 lines each)',
        'Use white space effectively to improve readability',
        'Ensure font sizes and styles are professional and consistent'
      ]
    },
    {
      title: 'Add Relevant Certifications and Education',
      description: 'Include certifications, courses, and educational achievements that strengthen your candidacy for this role.',
      priority: BigInt(3),
      implementationTips: [
        'List relevant certifications prominently',
        'Include online courses from reputable platforms',
        'Mention relevant academic projects or research',
        'Add professional development and continuous learning activities'
      ]
    }
  );
  
  // Return top 7-8 suggestions based on priority and relevance
  return suggestions.slice(0, 8);
};

export default function InterviewSetup({ onStartInterview }: InterviewSetupProps) {
  const { identity } = useInternetIdentity();
  const [role, setRole] = useState('');
  const [interviewType, setInterviewType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isStartingChatbot, setIsStartingChatbot] = useState(false);
  const [isStartingLive, setIsStartingLive] = useState(false);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<{
    qualityScore: number;
    suggestions: string;
  } | null>(null);
  const [autoSuggestApplied, setAutoSuggestApplied] = useState(false);
  const [showResumeWarning, setShowResumeWarning] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationType, setVerificationType] = useState<'mismatch' | 'suggestions' | null>(null);
  const [detectedRole, setDetectedRole] = useState<string>('');
  const [improvementSuggestions, setImprovementSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingInterviewMode, setPendingInterviewMode] = useState<'chatbot' | 'live' | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const uploadResume = useUploadResume();
  const saveSettings = useSaveInterviewSettings();
  const { data: existingResumes = [] } = useGetCallerResumes();
  const { data: hasResume, isLoading: checkingResume } = useHasUploadedResume();
  const { data: latestResume } = useGetCallerLatestResume();
  const getImprovementSuggestions = useGetImprovementSuggestions();

  // Debounced verification effect - triggers after 1.5 seconds of inactivity
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // STRICT PREREQUISITE CHECK: Only set up debounce if BOTH role AND resume are present
    const hasValidRole = role && role.trim() !== '';
    const hasValidResume = (latestResume || resumeFile) !== null;
    const shouldSetupDebounce = hasValidRole && hasValidResume && !verificationComplete;
    
    if (shouldSetupDebounce) {
      // Set new timer for 1.5 seconds
      debounceTimerRef.current = setTimeout(() => {
        handleAutoVerification();
      }, 1500);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [role, latestResume, resumeFile, verificationComplete]);

  // Proceed with interview after verification is complete
  useEffect(() => {
    if (verificationComplete && pendingInterviewMode) {
      proceedWithInterview(pendingInterviewMode);
    }
  }, [verificationComplete, pendingInterviewMode]);

  const handleAutoVerification = async () => {
    // Double-check prerequisites before verification
    if (!role || role.trim() === '') return;
    if (!latestResume && !resumeFile) return;
    
    setIsVerifying(true);
    
    try {
      let detected: string;
      let qualityScore = 75;
      
      // Detect role from resume
      if (resumeFile) {
        detected = detectRoleFromResume(resumeFile.name, resumeFile.name);
        qualityScore = resumeAnalysis?.qualityScore || 75;
      } else if (latestResume) {
        detected = latestResume.suggestedRole || detectRoleFromResume(latestResume.parsedContent, 'resume');
        qualityScore = Number(latestResume.qualityScore || 75);
      } else {
        return;
      }
      
      setDetectedRole(detected);
      
      const mismatch = areRolesMismatched(detected, role);
      
      if (mismatch) {
        // Show mismatch warning - user cannot proceed
        setVerificationType('mismatch');
        setVerificationModalOpen(true);
        setVerificationComplete(false);
        toast.error('You\'re not applicable — please change your role or upload a matching resume.');
      } else {
        // Generate and show improvement suggestions - user can proceed
        const suggestions = generateImprovementSuggestions(role, qualityScore);
        setImprovementSuggestions(suggestions);
        setVerificationType('suggestions');
        setVerificationModalOpen(true);
        toast.success('You\'re applicable for this job!');
      }
    } catch (error) {
      console.error('Error verifying resume:', error);
      toast.error('Failed to verify resume. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    setVerificationComplete(false);
    
    // Auto-suggest interview type and difficulty
    const suggestedType = suggestInterviewType(value);
    const suggestedDifficulty = suggestDifficulty(value);
    
    setInterviewType(suggestedType);
    setDifficulty(suggestedDifficulty);
    setAutoSuggestApplied(true);
    
    toast.success(`Auto-configured: ${suggestedType} interview at ${suggestedDifficulty} level`, {
      description: 'You can adjust these settings if needed',
    });
  };

  const handleRoleBlur = () => {
    // Trigger verification immediately on blur ONLY if both prerequisites are met
    const hasValidRole = role && role.trim() !== '';
    const hasValidResume = (latestResume || resumeFile) !== null;
    
    if (hasValidRole && hasValidResume && !verificationComplete) {
      // Clear debounce timer and verify immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      handleAutoVerification();
    }
  };

  const handleRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Trigger verification immediately on Enter key ONLY if both prerequisites are met
    const hasValidRole = role && role.trim() !== '';
    const hasValidResume = (latestResume || resumeFile) !== null;
    
    if (e.key === 'Enter' && hasValidRole && hasValidResume && !verificationComplete) {
      // Clear debounce timer and verify immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      handleAutoVerification();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setResumeFile(file);
      setVerificationComplete(false);
      
      // Simulate LLM resume analysis
      setIsAnalyzingResume(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockScore = Math.floor(Math.random() * 30) + 70;
      const mockSuggestions = generateResumeSuggestions(mockScore);
      
      setResumeAnalysis({
        qualityScore: mockScore,
        suggestions: mockSuggestions,
      });
      setIsAnalyzingResume(false);
      toast.success('Resume analyzed successfully!');
    }
  };

  const generateResumeSuggestions = (score: number): string => {
    if (score >= 90) {
      return 'Excellent resume! Your content is well-structured with strong action verbs and quantifiable achievements. Consider adding more specific metrics to further strengthen your impact statements.';
    } else if (score >= 75) {
      return 'Good resume overall. Strengthen your bullet points with more quantifiable results. Add specific technologies and tools you\'ve used. Consider reorganizing sections for better flow.';
    } else {
      return 'Your resume needs improvement. Focus on: 1) Adding quantifiable achievements, 2) Using stronger action verbs, 3) Highlighting relevant skills, 4) Improving formatting and consistency, 5) Tailoring content to target roles.';
    }
  };

  const handleStartInterview = async (mode: 'chatbot' | 'live') => {
    if (!role || !interviewType || !difficulty) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!identity) {
      toast.error('Please log in to continue');
      return;
    }

    // Check if resume is uploaded
    if (!hasResume && !resumeFile) {
      setShowResumeWarning(true);
      return;
    }

    // Set loading state immediately
    if (mode === 'chatbot') {
      setIsStartingChatbot(true);
    } else {
      setIsStartingLive(true);
    }

    // Check if verification is needed and not yet complete
    const hasValidRole = role && role.trim() !== '';
    const hasValidResume = (latestResume || resumeFile) !== null;
    
    if (hasValidRole && hasValidResume && !verificationComplete) {
      setPendingInterviewMode(mode);
      
      // If modal is not open yet, trigger verification immediately
      if (!verificationModalOpen) {
        // Clear debounce timer and verify immediately
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        await handleAutoVerification();
      } else {
        // Modal is already open, user needs to complete verification
        toast.info('Please complete the verification process to continue');
      }
      
      return;
    }

    // If verification is complete, proceed
    await proceedWithInterview(mode);
  };

  const proceedWithInterview = async (mode: 'chatbot' | 'live') => {
    let resumeId: string | undefined;

    try {
      if (resumeFile && resumeAnalysis) {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        resumeId = `resume-${Date.now()}`;
        const detected = detectRoleFromResume(resumeFile.name, resumeFile.name);
        const verified = !areRolesMismatched(detected, role);
        
        await uploadResume.mutateAsync({
          id: resumeId,
          owner: identity!.getPrincipal(),
          file: blob,
          parsedContent: `Resume content for ${role} position`,
          uploadedAt: BigInt(Date.now() * 1000000),
          qualityScore: BigInt(resumeAnalysis.qualityScore),
          improvementSuggestions: resumeAnalysis.suggestions,
          targetRole: role,
          verified,
          improvementDetails: verified ? improvementSuggestions : undefined,
          suggestedRole: detected,
        });

        toast.success('Resume uploaded with analysis!');
        setCurrentResumeId(resumeId);
      }

      // Save interview settings
      await saveSettings.mutateAsync({
        targetRole: role,
        interviewType,
        difficulty,
        questionCount: BigInt(5), // Default for chatbot
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call the parent handler to switch views
      onStartInterview({ 
        role, 
        interviewType, 
        difficulty, 
        resumeId: resumeId || latestResume?.id, 
        questionCount: 5 
      }, mode);
      
      toast.success(`Starting ${mode === 'chatbot' ? 'chatbot' : 'live mock'} interview...`);
    } catch (error: any) {
      console.error('Error starting interview:', error);
      
      // Check if error is from backend validation
      if (error?.message?.includes('Resume upload required')) {
        toast.error('Resume upload required. Please upload your resume before continuing.');
        setShowResumeWarning(true);
      } else if (error?.message?.includes('Target role not verified')) {
        toast.error('Resume-role verification required. Please complete the verification process.');
      } else if (mode === 'chatbot') {
        toast.error('Failed to start chatbot interview. Please try again.');
      } else {
        toast.error('Failed to start live mock interview. Please check camera permissions.');
      }
    } finally {
      setIsStartingChatbot(false);
      setIsStartingLive(false);
      setPendingInterviewMode(null);
    }
  };

  const handleChangeRole = () => {
    setVerificationModalOpen(false);
    setVerificationComplete(false);
    setPendingInterviewMode(null);
    setIsStartingChatbot(false);
    setIsStartingLive(false);
    toast.info('Please update your target role to match your resume');
  };

  const handleUploadNewResume = () => {
    setVerificationModalOpen(false);
    setResumeFile(null);
    setResumeAnalysis(null);
    setVerificationComplete(false);
    setPendingInterviewMode(null);
    setIsStartingChatbot(false);
    setIsStartingLive(false);
    toast.info('Please upload a new resume that matches your target role');
  };

  const handleProceedAfterSuggestions = () => {
    setVerificationModalOpen(false);
    setVerificationComplete(true);
    toast.success('Verification complete! You can now start your interview.');
  };

  const isFormValid = role && interviewType && difficulty;
  const isAnyLoading = uploadResume.isPending || isStartingChatbot || isStartingLive || isAnalyzingResume || checkingResume || isVerifying;
  const roleRounds = ROLE_SPECIFIC_ROUNDS[role] || [];
  const resumeUploaded = hasResume || resumeFile !== null;
  
  // Disable buttons if verification is not complete and there's a mismatch
  const canStartInterview = verificationComplete || verificationType === null;

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Interview Configuration</CardTitle>
            <CardDescription>Set up your interview preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Target Role *</Label>
              <Input
                id="role"
                type="text"
                placeholder="e.g., Senior Software Engineer, Product Manager..."
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                onBlur={handleRoleBlur}
                onKeyDown={handleRoleKeyDown}
                disabled={isAnyLoading}
                className="font-medium"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Type your desired role - we'll auto-configure the interview settings
              </p>
            </div>

            {roleRounds.length > 0 && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Interview Rounds for {role}:</p>
                <div className="flex flex-wrap gap-2">
                  {roleRounds.map((round, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {index + 1}. {round}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="interviewType" className="flex items-center gap-2">
                Interview Type *
                {autoSuggestApplied && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-selected
                  </Badge>
                )}
              </Label>
              <Select value={interviewType} onValueChange={setInterviewType} disabled={isAnyLoading}>
                <SelectTrigger id="interviewType">
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="System Design">System Design</SelectItem>
                  <SelectItem value="Case Study">Case Study</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="flex items-center gap-2">
                Difficulty Level *
                {autoSuggestApplied && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-selected
                  </Badge>
                )}
              </Label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={isAnyLoading}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume" className="flex items-center gap-2">
                Upload Resume *
                {resumeUploaded && (
                  <Badge variant="default" className="text-xs bg-chart-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
                {isVerifying && (
                  <Badge variant="secondary" className="text-xs">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Verifying...
                  </Badge>
                )}
              </Label>
              <div className={`flex items-center gap-2 ${!resumeUploaded ? 'ring-2 ring-destructive ring-offset-2 rounded-md' : ''}`}>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={isAnyLoading}
                />
              </div>
              {!resumeUploaded && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Resume upload is required to start any interview
                </p>
              )}
              {hasResume && !resumeFile && (
                <p className="text-xs text-chart-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  You have already uploaded a resume. You can upload a new one if needed.
                </p>
              )}
              {resumeFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded">
                  <FileText className="h-4 w-4" />
                  {resumeFile.name}
                </div>
              )}
              {isAnalyzingResume && (
                <div className="flex items-center gap-2 text-sm text-primary p-2 bg-primary/10 rounded animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing resume with AI...
                </div>
              )}
              {resumeAnalysis && (
                <div className="p-3 bg-chart-1/10 border border-chart-1/20 rounded-lg space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quality Score:</span>
                    <Badge className="bg-chart-1 text-white">{resumeAnalysis.qualityScore}/100</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{resumeAnalysis.suggestions}</p>
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mode Selection Cards */}
        <div className="space-y-4">
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-chart-1 to-chart-1/70 flex items-center justify-center mb-2 shadow-md">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <Button 
                  disabled={!isFormValid || isAnyLoading || !resumeUploaded || !canStartInterview} 
                  onClick={() => handleStartInterview('chatbot')}
                  className="bg-gradient-to-r from-chart-1 to-chart-1/80 hover:opacity-90 transition-opacity"
                >
                  {isStartingChatbot ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : uploadResume.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Start Chatbot'
                  )}
                </Button>
              </div>
              <CardTitle>AI Chatbot Interview</CardTitle>
              <CardDescription>
                Practice with an AI interviewer that asks contextual questions and provides instant feedback on your responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                  <span>Personalized questions based on your resume</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                  <span>Instant feedback after each answer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                  <span>Text-based conversation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
                  <span>Perfect for practicing responses</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-chart-2 to-chart-2/70 flex items-center justify-center mb-2 shadow-md">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <Button 
                  disabled={!isFormValid || isAnyLoading || !resumeUploaded || !canStartInterview} 
                  onClick={() => handleStartInterview('live')}
                  className="bg-gradient-to-r from-chart-2 to-chart-2/80 hover:opacity-90 transition-opacity"
                >
                  {isStartingLive ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : uploadResume.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Start Live Mock'
                  )}
                </Button>
              </div>
              <CardTitle>Live Mock Interview</CardTitle>
              <CardDescription>
                Record yourself answering questions and get feedback on body language, voice tone, eye contact, and professional appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  <span>Camera-based recording with voice analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  <span>Body language and appearance evaluation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  <span>Eye contact and tone detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                  <span>Comprehensive feedback report</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resume Warning Modal */}
      <AlertDialog open={showResumeWarning} onOpenChange={setShowResumeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Resume Upload Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Resume upload required. Please upload your resume before continuing.</p>
              <p className="text-sm">
                Your resume helps us personalize interview questions and provide better feedback tailored to your experience and target role.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowResumeWarning(false)}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resume-Role Verification Modal - Only shown when both prerequisites are met */}
      {verificationModalOpen && verificationType && (
        <ResumeRoleVerification
          isOpen={verificationModalOpen}
          onClose={() => {
            setVerificationModalOpen(false);
            setIsStartingChatbot(false);
            setIsStartingLive(false);
            setPendingInterviewMode(null);
          }}
          verificationType={verificationType}
          targetRole={role}
          suggestedRole={detectedRole}
          improvementSuggestions={improvementSuggestions}
          onChangeRole={handleChangeRole}
          onUploadNewResume={handleUploadNewResume}
          onProceed={handleProceedAfterSuggestions}
        />
      )}
    </>
  );
}
