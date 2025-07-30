import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, AlertCircle, ShieldOff, ServerCrash, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

interface ErrorPageProps {
  code?: number;
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export function ErrorPage({
  code = 500,
  title,
  message,
  showBackButton = true,
  showHomeButton = true,
}: ErrorPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Default content based on error code
  const errorContent = {
    403: {
      title: "Access Denied",
      message: "You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.",
      icon: ShieldOff,
      iconColor: "text-destructive",
    },
    500: {
      title: "Server Error",
      message: "Something went wrong on our end. Our team has been notified and is working to fix the issue.",
      icon: ServerCrash,
      iconColor: "text-destructive",
    },
    503: {
      title: "Service Unavailable",
      message: "We're currently performing maintenance. Please check back in a few minutes.",
      icon: Construction,
      iconColor: "text-warning",
    },
    default: {
      title: "Something went wrong",
      message: "An unexpected error occurred. Please try again later.",
      icon: AlertCircle,
      iconColor: "text-destructive",
    },
  };

  const content = errorContent[code as keyof typeof errorContent] || errorContent.default;
  const Icon = content.icon;
  const displayTitle = title || content.title;
  const displayMessage = message || content.message;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-background to-muted/20">
      {/* Icon */}
      <div className="mb-8 relative">
        <div className="relative">
          <Icon className={`w-24 h-24 ${content.iconColor} animate-pulse`} />
          <div className="absolute inset-0 blur-3xl opacity-20">
            <Icon className={`w-24 h-24 ${content.iconColor}`} />
          </div>
        </div>
      </div>

      {/* Error Code */}
      <div className="text-8xl font-bold text-muted-foreground/20 mb-4">
        {code}
      </div>

      {/* Error Message */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-4">
        {displayTitle}
      </h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
        {displayMessage}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {showBackButton && (
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
        )}
        
        {showHomeButton && (
          <Button asChild>
            <Link to={user ? "/dashboard" : "/"} className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              {user ? "Return to Dashboard" : "Go to Homepage"}
            </Link>
          </Button>
        )}
      </div>

      {/* Error Details (if in development) */}
      {import.meta.env.DEV && (
        <div className="mt-12 p-4 bg-muted rounded-lg max-w-2xl">
          <p className="text-xs text-muted-foreground font-mono">
            Error Code: {code} | Development Mode
          </p>
        </div>
      )}
    </div>
  );
}