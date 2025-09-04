import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NewAssessmentPageSimple() {
  console.log('🚀 NewAssessmentPageSimple is rendering...');
  
  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">New Assessment Page - Simple Test</h1>
        <p className="text-muted-foreground mt-2">
          This is a simplified version to test if the page can render at all.
        </p>
        <div className="mt-4 space-x-4">
          <Button asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}