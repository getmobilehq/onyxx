import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type WorkflowStep = {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'error';
};

type AssessmentWorkflowProps = {
  currentStep: number;
};

export function AssessmentWorkflow({ currentStep }: AssessmentWorkflowProps) {
  const steps: WorkflowStep[] = [
    {
      id: '1',
      title: 'Pre-Assessment',
      description: 'Planning and preparation',
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'pending'
    },
    {
      id: '2',
      title: 'Field Assessment',
      description: 'On-site evaluation',
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: '3',
      title: 'Report Generation',
      description: 'FCI calculation and documentation',
      status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending'
    }
  ];

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="text-sm font-medium mb-4">Assessment Progress</h3>
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className={cn(
              'relative',
              stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
            )}>
              {stepIdx !== steps.length - 1 && (
                <div 
                  className={cn(
                    'absolute inset-0 flex items-center',
                    'w-full h-0.5 top-1/2 left-4 right-0 transform -translate-y-1/2'
                  )}
                >
                  <div className={cn(
                    'w-full h-0.5',
                    step.status === 'completed' ? 'bg-green-600' : 'bg-muted-foreground/25'
                  )} />
                </div>
              )}
              
              <div className="relative flex items-center space-x-2">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={cn(
                    'text-xs font-medium',
                    step.status === 'current' ? 'text-blue-600' :
                    step.status === 'completed' ? 'text-green-600' :
                    'text-muted-foreground'
                  )}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}