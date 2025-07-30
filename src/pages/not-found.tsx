import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Force rebuild to show custom 404 page

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-background to-muted/20">
      {/* Custom SVG Illustration */}
      <div className="mb-8 relative">
        <svg
          className="w-64 h-64 sm:w-80 sm:h-80"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle */}
          <circle cx="200" cy="200" r="180" className="fill-muted/30" />
          
          {/* Lost Person Illustration */}
          <g transform="translate(200, 200)">
            {/* Map/Document */}
            <rect
              x="-60"
              y="-20"
              width="80"
              height="100"
              rx="4"
              className="fill-card stroke-border"
              strokeWidth="2"
              transform="rotate(-15)"
            />
            <path
              d="M -50 -10 L -30 -10 M -50 0 L -30 0 M -50 10 L -30 10 M -50 20 L -20 20 M -50 30 L -25 30"
              className="stroke-muted-foreground"
              strokeWidth="2"
              transform="rotate(-15)"
            />
            
            {/* Question Marks */}
            <text
              x="40"
              y="-40"
              className="fill-primary text-4xl font-bold animate-bounce"
              style={{ animationDelay: '0s' }}
            >
              ?
            </text>
            <text
              x="-70"
              y="-50"
              className="fill-primary/70 text-3xl font-bold animate-bounce"
              style={{ animationDelay: '0.2s' }}
            >
              ?
            </text>
            <text
              x="60"
              y="30"
              className="fill-primary/50 text-2xl font-bold animate-bounce"
              style={{ animationDelay: '0.4s' }}
            >
              ?
            </text>
            
            {/* Person Figure */}
            <g transform="translate(0, -20)">
              {/* Head */}
              <circle cx="0" cy="-20" r="20" className="fill-foreground/80" />
              {/* Body */}
              <ellipse cx="0" cy="20" rx="30" ry="40" className="fill-foreground/80" />
              {/* Eyes (confused expression) */}
              <circle cx="-8" cy="-25" r="2" className="fill-background" />
              <circle cx="8" cy="-25" r="2" className="fill-background" />
              {/* Confused mouth */}
              <path
                d="M -8 -15 Q 0 -10 8 -15"
                className="stroke-background"
                strokeWidth="2"
                fill="none"
              />
              {/* Arms (holding map) */}
              <ellipse
                cx="-25"
                cy="10"
                rx="8"
                ry="25"
                className="fill-foreground/80"
                transform="rotate(-30 -25 10)"
              />
              <ellipse
                cx="25"
                cy="10"
                rx="8"
                ry="25"
                className="fill-foreground/80"
                transform="rotate(30 25 10)"
              />
            </g>
            
            {/* Compass/Direction indicator */}
            <g transform="translate(-100, 60)">
              <circle cx="0" cy="0" r="25" className="fill-card stroke-border" strokeWidth="2" />
              <path
                d="M 0 -20 L 5 -5 L 0 0 L -5 -5 Z"
                className="fill-destructive animate-spin"
                style={{ transformOrigin: '0 0', animationDuration: '3s' }}
              />
              <circle cx="0" cy="0" r="3" className="fill-foreground" />
            </g>
          </g>
          
          {/* 404 Text */}
          <text
            x="200"
            y="350"
            textAnchor="middle"
            className="fill-primary/20 text-8xl font-bold"
          >
            404
          </text>
        </svg>
      </div>

      {/* Error Message */}
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-4">
        Oops! You seem to be lost
      </h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
        The page you're looking for doesn't exist or has been moved. 
        Don't worry, even the best explorers get lost sometimes!
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => navigate(-1)} 
          variant="outline"
          className="group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Go Back
        </Button>
        
        <Button asChild>
          <Link to={user ? "/dashboard" : "/"} className="flex items-center">
            <Home className="mr-2 h-4 w-4" />
            {user ? "Return to Dashboard" : "Go to Homepage"}
          </Link>
        </Button>
      </div>

      {/* Helpful Links */}
      <div className="mt-12 text-sm text-muted-foreground">
        <p className="mb-3">Here are some helpful links:</p>
        <div className="flex flex-wrap justify-center gap-4">
          {user ? (
            <>
              <Link to="/buildings" className="hover:text-primary transition-colors">
                Buildings
              </Link>
              <span>•</span>
              <Link to="/assessments" className="hover:text-primary transition-colors">
                Assessments
              </Link>
              <span>•</span>
              <Link to="/reports" className="hover:text-primary transition-colors">
                Reports
              </Link>
              <span>•</span>
              <Link to="/team" className="hover:text-primary transition-colors">
                Team
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-primary transition-colors">
                Login
              </Link>
              <span>•</span>
              <Link to="/register" className="hover:text-primary transition-colors">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}