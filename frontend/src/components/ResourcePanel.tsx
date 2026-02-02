import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ExternalLink, BookOpen, Video, FileText, Code, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const RESOURCES = {
  'Software Engineer': [
    {
      title: 'LeetCode',
      description: 'Practice coding problems and algorithms',
      url: 'https://leetcode.com',
      type: 'Practice',
      icon: Code,
    },
    {
      title: 'GeeksforGeeks',
      description: 'Computer science tutorials and interview prep',
      url: 'https://www.geeksforgeeks.org',
      type: 'Tutorial',
      icon: BookOpen,
    },
    {
      title: 'System Design Primer',
      description: 'Learn how to design large-scale systems',
      url: 'https://github.com/donnemartin/system-design-primer',
      type: 'Guide',
      icon: FileText,
    },
    {
      title: 'freeCodeCamp',
      description: 'Free coding tutorials and certifications',
      url: 'https://www.freecodecamp.org',
      type: 'Course',
      icon: Video,
    },
  ],
  'Product Manager': [
    {
      title: 'Product School Blog',
      description: 'Product management insights and best practices',
      url: 'https://productschool.com/blog',
      type: 'Blog',
      icon: BookOpen,
    },
    {
      title: 'Mind the Product',
      description: 'Community and resources for product managers',
      url: 'https://www.mindtheproduct.com',
      type: 'Community',
      icon: Briefcase,
    },
    {
      title: 'Product Management Exercises',
      description: 'Practice PM interview questions',
      url: 'https://www.productmanagementexercises.com',
      type: 'Practice',
      icon: Code,
    },
    {
      title: 'Coursera PM Courses',
      description: 'Free product management courses',
      url: 'https://www.coursera.org/courses?query=product%20management',
      type: 'Course',
      icon: Video,
    },
  ],
  'Data Scientist': [
    {
      title: 'Kaggle',
      description: 'Data science competitions and datasets',
      url: 'https://www.kaggle.com',
      type: 'Practice',
      icon: Code,
    },
    {
      title: 'Towards Data Science',
      description: 'Data science articles and tutorials',
      url: 'https://towardsdatascience.com',
      type: 'Blog',
      icon: BookOpen,
    },
    {
      title: 'Fast.ai',
      description: 'Free deep learning courses',
      url: 'https://www.fast.ai',
      type: 'Course',
      icon: Video,
    },
    {
      title: 'StatQuest',
      description: 'Statistics and machine learning explained',
      url: 'https://statquest.org',
      type: 'Tutorial',
      icon: FileText,
    },
  ],
  'General': [
    {
      title: 'Glassdoor Interview Questions',
      description: 'Real interview questions from companies',
      url: 'https://www.glassdoor.com/Interview/index.htm',
      type: 'Resource',
      icon: Briefcase,
    },
    {
      title: 'LinkedIn Learning',
      description: 'Professional development courses',
      url: 'https://www.linkedin.com/learning',
      type: 'Course',
      icon: Video,
    },
    {
      title: 'Indeed Career Guide',
      description: 'Interview tips and career advice',
      url: 'https://www.indeed.com/career-advice',
      type: 'Guide',
      icon: BookOpen,
    },
    {
      title: 'The Muse',
      description: 'Career advice and job search tips',
      url: 'https://www.themuse.com',
      type: 'Blog',
      icon: FileText,
    },
  ],
};

export default function ResourcePanel() {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Practice':
        return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
      case 'Tutorial':
      case 'Guide':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      case 'Course':
      case 'Video':
        return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'Blog':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Resource Library</h2>
        <p className="text-muted-foreground">Curated collection of free, reliable resources for interview preparation</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="software">Software Eng.</TabsTrigger>
          <TabsTrigger value="product">Product Mgmt.</TabsTrigger>
          <TabsTrigger value="data">Data Science</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {RESOURCES.General.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Card key={index} className="hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-2 shadow-md">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Visit Resource
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="software" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {RESOURCES['Software Engineer'].map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Card key={index} className="hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-chart-1 to-chart-1/70 flex items-center justify-center mb-2 shadow-md">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Visit Resource
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="product" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {RESOURCES['Product Manager'].map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Card key={index} className="hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-chart-2 to-chart-2/70 flex items-center justify-center mb-2 shadow-md">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Visit Resource
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {RESOURCES['Data Scientist'].map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Card key={index} className="hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-chart-3 to-chart-3/70 flex items-center justify-center mb-2 shadow-md">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Visit Resource
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
