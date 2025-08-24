import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/hooks/use-dashboard';
import { useOnboarding } from '@/hooks/use-onboarding';
import { cn } from '@/lib/utils';
import { 
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarRange,
  CheckCircle2,
  Clock,
  ClipboardList,
  FileText,
  Plus,
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationOnboarding } from '@/components/organization-onboarding';
import { FirstTimeUserWelcome } from '@/components/first-time-user-welcome';

export function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const {
    metrics,
    buildingsAtRisk,
    recentAssessments,
    upcomingAssessments,
    fciDistribution,
    fciTrend,
    loading
  } = useDashboard();

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);


  // Status color for assessments
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  // Status icon for assessments
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Show organization onboarding if user has no organization
  if (user && !user.organization_id) {
    return <OrganizationOnboarding userName={user.name} />;
  }

  // Show first-time user welcome screen
  if (shouldShowOnboarding) {
    return (
      <FirstTimeUserWelcome 
        userName={user?.name || 'User'} 
        onComplete={completeOnboarding}
      />
    );
  }

  // Show empty state for users with no data
  const hasData = metrics.totalBuildings > 0 || !loading;
  
  return (
    <div className="space-y-8 p-8 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{greeting}, {user?.name}</h2>
          <p className="text-muted-foreground mt-2 text-base">
            {hasData ? "Here's what's happening across your facilities today for capital planning." : "Get started by adding your first building to begin tracking facility conditions."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <Link to="/buildings/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Building
            </Link>
          </Button>
          {hasData && (
            <Button asChild variant="outline" className="rounded-xl hover:bg-muted/50 transition-all duration-200">
              <Link to="/reports">
                <FileText className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{metrics.totalBuildings}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Active facilities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments (YTD)</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{metrics.assessmentsYTD}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Completed this year
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average FCI</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{metrics.averageFCI.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Facility condition index
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Repairs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">${(metrics.estimatedRepairs / 1000000).toFixed(1)}M</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total repair costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Show different layout based on data */}
      {!hasData && metrics.totalBuildings === 0 ? (
        // Empty state for new users
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Add Your First Building</CardTitle>
              <CardDescription>
                Start tracking facility conditions by adding a building to your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link to="/buildings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Building
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-dashed border-2 border-secondary/30 bg-secondary/5">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle className="text-lg">Invite Your Team</CardTitle>
              <CardDescription>
                Collaborate with managers and assessors to conduct facility assessments
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild variant="outline" className="w-full">
                <Link to="/team">
                  <Users className="mr-2 h-4 w-4" />
                  Invite Team
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Buildings At Risk */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle>Buildings At Risk</CardTitle>
              <CardDescription>
                Buildings with highest FCI scores requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </>
                ) : buildingsAtRisk.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
                    <p className="font-medium">All buildings in good condition</p>
                    <p className="text-sm">No buildings with FCI {'>'} 0.10</p>
                  </div>
                ) : (
                  buildingsAtRisk.map((building) => (
                    <div
                      key={building.id}
                      className="flex items-center justify-between border-b p-4 last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium leading-none">{building.name}</p>
                        <p className="text-sm text-muted-foreground">
                          FCI Score: {(building.fci * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={cn("font-medium text-xs uppercase tracking-wide", 
                          building.status === 'critical' ? 'text-red-500' :
                          building.status === 'warning' ? 'text-orange-500' :
                          'text-yellow-500'
                        )}>
                          {building.status}
                        </div>
                        <Progress
                          value={building.fci * 100}
                          className="h-2 w-24 mt-1"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button asChild variant="ghost" className="w-full">
                <Link to="/buildings" className="flex items-center justify-center">
                  View all buildings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Assessment Activity */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Assessment Activity</CardTitle>
            <CardDescription>
              Recent and upcoming building assessments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="recent">
              <div className="px-4 pt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="recent" className="flex-1">Recent</TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="recent" className="p-0">
                <div className="space-y-4 p-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </>
                  ) : recentAssessments.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No recent assessments
                    </div>
                  ) : (
                    recentAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{assessment.building?.name || 'Unknown Building'}</p>
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {new Date(assessment.scheduled_date || assessment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center">
                          {getStatusIcon(assessment.status)}
                          <span 
                            className={cn(
                              "ml-1.5 text-sm capitalize", 
                              getStatusColor(assessment.status)
                            )}
                          >
                            {assessment.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {assessment.assigned_to?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {assessment.assigned_to?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="upcoming" className="p-0">
                <div className="space-y-4 p-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </>
                  ) : upcomingAssessments.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No upcoming assessments
                    </div>
                  ) : (
                    upcomingAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <CalendarRange className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{assessment.building?.name || 'Unknown Building'}</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {new Date(assessment.scheduled_date || assessment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-muted-foreground">Scheduled</span>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {assessment.assigned_to?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {assessment.assigned_to?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="pt-0">
            <Button asChild variant="ghost" className="w-full">
              <Link to="/assessments" className="flex items-center justify-center">
                View all assessments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
          </Card>
        </div>
      )}

      {/* Charts and Analytics - Only show if user has data */}
      {hasData && metrics.totalBuildings > 0 && (
      <div className="grid gap-4 md:grid-cols-2">
        {/* FCI Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>FCI Distribution</CardTitle>
            <CardDescription>Building condition by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fciDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} buildings`, 'Count']}
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="currentColor" className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FCI Trend */}
        <Card>
          <CardHeader>
            <CardTitle>FCI Trend</CardTitle>
            <CardDescription>5-month average FCI trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fciTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 'dataMax + 5']} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'FCI Score']}
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  />
                  <Line type="monotone" dataKey="fci" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}