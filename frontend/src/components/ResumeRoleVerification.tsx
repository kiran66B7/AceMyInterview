import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle2, Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import type { ImprovementSuggestion } from '../backend';

interface ResumeRoleVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  verificationType: 'mismatch' | 'suggestions' | null;
  targetRole: string;
  suggestedRole?: string;
  improvementSuggestions?: ImprovementSuggestion[];
  onChangeRole: () => void;
  onUploadNewResume: () => void;
  onProceed?: () => void;
}

export default function ResumeRoleVerification({
  isOpen,
  onClose,
  verificationType,
  targetRole,
  suggestedRole,
  improvementSuggestions,
  onChangeRole,
  onUploadNewResume,
  onProceed,
}: ResumeRoleVerificationProps) {
  if (verificationType === 'mismatch') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl animate-in fade-in-0 zoom-in-95 duration-500">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-xl">You're Not Applicable</DialogTitle>
                <DialogDescription className="mt-1">
                  Please change your role or upload a matching resume
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="border-destructive/50 bg-destructive/5 animate-in slide-in-from-bottom-2 duration-300">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Selected Target Role:</p>
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {targetRole}
                    </Badge>
                  </div>
                  {suggestedRole && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Detected Role from Resume:</p>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {suggestedRole}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-muted rounded-lg space-y-2 animate-in slide-in-from-bottom-3 duration-300 delay-100">
              <p className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-chart-3" />
                Why does this matter?
              </p>
              <p className="text-sm text-muted-foreground">
                Our AI detected that your resume content and experience don't align well with the selected role. 
                This mismatch may result in less relevant interview questions and feedback that doesn't match your actual background.
              </p>
            </div>

            <div className="p-4 bg-chart-1/10 border border-chart-1/20 rounded-lg animate-in slide-in-from-bottom-4 duration-300 delay-200">
              <p className="text-sm font-medium mb-2">To proceed, please choose one of the following options:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-chart-1 flex-shrink-0" />
                  <span><strong>Change the target role</strong> to match your resume content</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-chart-1 flex-shrink-0" />
                  <span><strong>Upload a new resume</strong> that aligns with your selected role</span>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onChangeRole} className="flex-1 transition-all hover:scale-105">
              Change Target Role
            </Button>
            <Button onClick={onUploadNewResume} className="flex-1 bg-gradient-to-r from-chart-1 to-chart-1/80 transition-all hover:scale-105">
              Upload New Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (verificationType === 'suggestions' && improvementSuggestions) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] animate-in fade-in-0 zoom-in-95 duration-500">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-chart-1/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <DialogTitle className="text-xl">You Can Proceed — You're Applicable!</DialogTitle>
                <DialogDescription className="mt-1">
                  Your resume matches the {targetRole} role. Here are personalized improvement suggestions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="p-4 bg-chart-1/10 border border-chart-1/20 rounded-lg animate-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-chart-1" />
                  Role-Specific Improvement Suggestions
                </p>
                <p className="text-sm text-muted-foreground">
                  Based on your resume and the {targetRole} position, we've identified {improvementSuggestions.length} key areas 
                  where you can strengthen your candidacy.
                </p>
              </div>

              <div className="space-y-3">
                {improvementSuggestions.map((suggestion, index) => (
                  <Card 
                    key={index} 
                    className="border-2 hover:border-chart-1/50 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          {suggestion.title}
                        </CardTitle>
                        <Badge 
                          variant={
                            Number(suggestion.priority) === 1 ? 'destructive' : 
                            Number(suggestion.priority) === 2 ? 'default' : 
                            'secondary'
                          }
                          className="text-xs transition-all hover:scale-105"
                        >
                          {Number(suggestion.priority) === 1 ? 'High' : 
                           Number(suggestion.priority) === 2 ? 'Medium' : 
                           'Low'} Priority
                        </Badge>
                      </div>
                      <CardDescription className="text-sm mt-2">
                        {suggestion.description}
                      </CardDescription>
                    </CardHeader>
                    {suggestion.implementationTips.length > 0 && (
                      <CardContent>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Implementation Tips:</p>
                        <ul className="space-y-1">
                          {suggestion.implementationTips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-sm flex items-start gap-2">
                              <ArrowRight className="h-3 w-3 mt-1 text-chart-1 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <div className="p-4 bg-muted rounded-lg animate-in slide-in-from-bottom-3 duration-300">
                <p className="text-sm text-muted-foreground">
                  <strong>Next Steps:</strong> Review these suggestions and consider updating your resume or preparing 
                  responses that address these areas. You can now proceed with your interview preparation.
                </p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={onProceed} className="w-full bg-gradient-to-r from-chart-1 to-chart-1/80 transition-all hover:scale-105">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Proceed to Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
