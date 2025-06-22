import { Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <Building2 className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">404 - Page Not Found</h1>
      <p className="mt-4 text-muted-foreground max-w-md mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link to="/dashboard" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Link>
      </Button>
    </div>
  );
}