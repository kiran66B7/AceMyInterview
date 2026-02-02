import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import ThemeToggle from './ThemeToggle';
import type { UserProfile } from '../backend';

export default function ProfileSetup() {
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentRole: '',
    experienceLevel: '',
    preferredInterviewType: '',
    preferredDifficulty: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error('Please log in first');
      return;
    }

    if (!formData.fullName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const profile: UserProfile = {
      id: identity.getPrincipal(),
      fullName: formData.fullName,
      email: formData.email,
      currentRole: formData.currentRole || 'Not specified',
      experienceLevel: formData.experienceLevel || 'Beginner',
      preferredInterviewType: formData.preferredInterviewType || 'Technical',
      preferredDifficulty: formData.preferredDifficulty || 'Beginner',
      profilePicture: undefined,
      createdAt: BigInt(Date.now() * 1000000),
    };

    try {
      await saveProfile.mutateAsync(profile);
      toast.success('Profile created successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-chart-1/5 to-chart-2/5 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/generated/pathwiz-logo-large-transparent.dim_300x150.png" 
              alt="PathWiz Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-3xl md:text-4xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Welcome to PathWiz</CardTitle>
          <CardDescription className="text-base">
            Let's set up your profile to personalize your interview preparation experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                placeholder="e.g., Software Engineer, Product Manager"
                value={formData.currentRole}
                onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                >
                  <SelectTrigger id="experienceLevel">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner (0-2 years)</SelectItem>
                    <SelectItem value="Intermediate">Intermediate (2-5 years)</SelectItem>
                    <SelectItem value="Advanced">Advanced (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredInterviewType">Preferred Interview Type</Label>
                <Select
                  value={formData.preferredInterviewType}
                  onValueChange={(value) => setFormData({ ...formData, preferredInterviewType: value })}
                >
                  <SelectTrigger id="preferredInterviewType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="System Design">System Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredDifficulty">Preferred Difficulty</Label>
              <Select
                value={formData.preferredDifficulty}
                onValueChange={(value) => setFormData({ ...formData, preferredDifficulty: value })}
              >
                <SelectTrigger id="preferredDifficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-chart-1 hover:opacity-90 transition-opacity" size="lg" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
