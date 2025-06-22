import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
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
  Plus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Mock data for the dashboard
const buildingsData = [
  { id: '1', name: 'Oak Tower Office Complex', location: 'New York, NY', type: 'Commercial', fci: 0.12, lastAssessment: '2024-04-10' },
  { id: '2', name: 'Riverside Apartments', location: 'Chicago, IL', type: 'Residential', fci: 0.34, lastAssessment: '2024-03-22' },
  { id: '3', name: 'Sunset Mall', location: 'Miami, FL', type: 'Retail', fci: 0.08, lastAssessment: '2024-05-01' },
  { id: '4', name: 'Central Hospital', location: 'Boston, MA', type: 'Healthcare', fci: 0.22, lastAssessment: '2024-02-15' },
];

const recentAssessments = [
  { id: '1', buildingName: 'Central Hospital', date: '2024-05-15', status: 'completed', assessor: 'Alex Johnson' },
  { id: '2', buildingName: 'Oak Tower Office Complex', date: '2024-05-10', status: 'in_progress', assessor: 'Maria Garcia' },
  { id: '3', buildingName: 'Riverside Apartments', date: '2024-05-05', status: 'pending', assessor: 'David Chen' },
];

const upcomingAssessments = [
  { id: '4', buildingName: 'Sunset Mall', date: '2024-05-25', assessor: 'Alex Johnson' },
  { id: '5', buildingName: 'Green Hills School', date: '2024-06-02', assessor: 'Sarah Williams' },
];

const chartData = [
  { name: 'Excellent', value: 45, fill: '#22c55e' },
  { name: 'Good', value: 30, fill: '#3b82f6' },
  { name: 'Fair', value: 15, fill: '#f59e0b' },
  { name: 'Poor', value: 10, fill: '#ef4444' },
];

const fciTrendData = [
  { month: 'Jan', fci: 0.21 },
  { month: 'Feb', fci: 0.22 },
  { month: 'Mar', fci: 0.20 },
  { month: 'Apr', fci: 0.18 },
  { month: 'May', fci: 0.15 },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Helper function to determine FCI status color
  const getFciStatusColor = (fci: number) => {
    if (fci <= 0.1) return 'text-green-500';
    if (fci <= 0.2) return 'text-blue-500';
    if (fci <= 0.3) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Helper function to determine FCI label
  const getFciLabel = (fci: number) => {
    if (fci <= 0.1) return 'Excellent';
    if (fci <= 0.2) return 'Good';
    if (fci <= 0.3) return 'Fair';
    return 'Poor';
  };

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

  return (
    <div className="space-y-8 p-8 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{greeting}, {user?.name}</h2>
          <p className="text-muted-foreground mt-2 text-base">
            Here's what's happening across your facilities today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <Link to="/buildings/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Building
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl hover:bg-muted/50 transition-all duration-200">
            <Link to="/reports">
              <FileText className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
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
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments (YTD)</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +8 from last quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average FCI</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.18</div>
            <p className="text-xs text-muted-foreground">
              -0.03 improvement from last year
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Repairs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
            <p className="text-xs text-muted-foreground">
              +$320k from last assessment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Buildings At Risk */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle>Buildings At Risk</CardTitle>
            <CardDescription>
              Buildings with highest FCI scores
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4">
              {buildingsData
                .sort((a, b) => b.fci - a.fci)
                .slice(0, 4)
                .map((building) => (
                  <div
                    key={building.id}
                    className="flex items-center justify-between border-b p-4 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium leading-none">{building.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {building.location}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={cn("font-medium", getFciStatusColor(building.fci))}>
                        {building.fci.toFixed(2)} ({getFciLabel(building.fci)})
                      </div>
                      <Progress
                        value={building.fci * 100}
                        className="h-2 w-24"
                        indicatorClassName={cn(
                          building.fci <= 0.1 ? "bg-green-500" :
                          building.fci <= 0.2 ? "bg-blue-500" :
                          building.fci <= 0.3 ? "bg-yellow-500" :
                          "bg-red-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
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
                  {recentAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{assessment.buildingName}</p>
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {new Date(assessment.date).toLocaleDateString()}
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
                              {assessment.assessor.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {assessment.assessor}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="upcoming" className="p-0">
                <div className="space-y-4 p-4">
                  {upcomingAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <CalendarRange className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{assessment.buildingName}</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {new Date(assessment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-muted-foreground">Scheduled</span>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {assessment.assessor.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {assessment.assessor}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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

      {/* Charts and Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* FCI Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>FCI Distribution</CardTitle>
            <CardDescription>Building condition by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} buildings`, 'Count']}
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fciTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 0.5]} tickFormatter={(value) => value.toFixed(1)} />
                  <Tooltip 
                    formatter={(value) => [value.toFixed(2), 'FCI Score']}
                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  />
                  <Bar dataKey="fci" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}