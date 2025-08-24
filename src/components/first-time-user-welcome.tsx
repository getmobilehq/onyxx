import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  ClipboardList, 
  ArrowRight, 
  CheckCircle,
  Plus,
  UserPlus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfetti } from '@/components/confetti';

interface FirstTimeUserWelcomeProps {
  userName: string;
  onComplete: () => void;
}

export function FirstTimeUserWelcome({ userName, onComplete }: FirstTimeUserWelcomeProps) {
  const navigate = useNavigate();
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const { triggerConfetti, ConfettiComponent } = useConfetti();

  const handleActionComplete = (actionId: string) => {
    setCompletedActions(prev => new Set([...prev, actionId]));
  };

  const quickActions = [
    {
      id: 'add-building',
      title: 'Add Your First Building',
      description: 'Start by adding a building to your portfolio',
      icon: Building2,
      href: '/buildings/new',
      color: 'bg-blue-500/10 text-blue-600',
      buttonText: 'Add Building',
      buttonVariant: 'default' as const
    },
    {
      id: 'invite-team',
      title: 'Invite Team Members',
      description: 'Invite managers and assessors to your organization',
      icon: Users,
      href: '/team',
      color: 'bg-green-500/10 text-green-600',
      buttonText: 'Invite Team',
      buttonVariant: 'outline' as const
    }
  ];

  const nextSteps = [
    'Add your first buildings to the platform',
    'Invite team members (managers and assessors)',
    'Begin conducting assessments and tracking facility conditions',
    'Generate reports and manage your facility portfolio'
  ];

  // Trigger confetti on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerConfetti();
    }, 500);
    return () => clearTimeout(timer);
  }, [triggerConfetti]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Confetti Animation */}
        <ConfettiComponent onComplete={() => {}} />
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to Onyx, {userName}! 🎉
            </h1>
            <p className="text-muted-foreground text-lg mt-2 max-w-2xl mx-auto">
              Your organization has been successfully created! You can now start managing buildings and assessments.
            </p>
          </div>
        </div>

        {/* Main Welcome Card */}
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Your Organization is Ready!</CardTitle>
            <CardDescription className="text-base">
              Your organization has been created. You can now start adding buildings and inviting team members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Card key={action.id} className="relative hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </div>
                      {completedActions.has(action.id) && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      asChild 
                      variant={action.buttonVariant} 
                      className="w-full"
                      onClick={() => handleActionComplete(action.id)}
                    >
                      <Link to={action.href} className="flex items-center justify-center">
                        {action.id === 'add-building' ? (
                          <Plus className="mr-2 h-4 w-4" />
                        ) : (
                          <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        {action.buttonText}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Continue to Dashboard */}
            <div className="text-center pt-4">
              <Button 
                onClick={onComplete} 
                size="lg" 
                className="px-8"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                As the admin, you can invite managers and assessors to join your organization.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              What happens next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">{index + 1}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}