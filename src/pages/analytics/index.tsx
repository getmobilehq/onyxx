import { useState } from 'react';
import { Building2, TrendingUp, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// Mock analytics data
const fciTrendData = [
  { month: 'Jan', fci: 0.12, buildings: 24 },
  { month: 'Feb', fci: 0.14, buildings: 26 },
  { month: 'Mar', fci: 0.13, buildings: 28 },
  { month: 'Apr', fci: 0.15, buildings: 30 },
  { month: 'May', fci: 0.16, buildings: 32 },
  { month: 'Jun', fci: 0.18, buildings: 35 },
];

const buildingConditionData = [
  { condition: 'Good', count: 12, color: '#10b981' },
  { condition: 'Fair', count: 18, color: '#f59e0b' },
  { condition: 'Poor', count: 8, color: '#ef4444' },
  { condition: 'Critical', count: 2, color: '#dc2626' },
];

const systemBreakdownData = [
  { system: 'HVAC', issues: 45, cost: 125000 },
  { system: 'Electrical', issues: 32, cost: 89000 },
  { system: 'Plumbing', issues: 28, cost: 67000 },
  { system: 'Structural', issues: 15, cost: 156000 },
  { system: 'Exterior', issues: 38, cost: 98000 },
  { system: 'Interior', issues: 22, cost: 45000 },
];

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('6months');
  const [selectedBuilding, setSelectedBuilding] = useState('all');

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into building conditions and maintenance trends.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              <SelectItem value="1">Oak Tower Office Complex</SelectItem>
              <SelectItem value="2">Maple Street Warehouse</SelectItem>
              <SelectItem value="3">Pine Ridge Medical Center</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="2years">2 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average FCI Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.156</div>
            <p className="text-xs text-muted-foreground">
              +0.02 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">40</div>
            <p className="text-xs text-muted-foreground">
              +5 from last quarter
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              -3 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">
              +12 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="conditions">Building Conditions</TabsTrigger>
          <TabsTrigger value="systems">System Analysis</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>FCI Trend Analysis</CardTitle>
              <CardDescription>
                Facility Condition Index trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={fciTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="fci" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Building Condition Distribution</CardTitle>
                <CardDescription>
                  Current state of all buildings in portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={buildingConditionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ condition, count }) => `${condition}: ${count}`}
                    >
                      {buildingConditionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Condition Summary</CardTitle>
                <CardDescription>
                  Detailed breakdown of building conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {buildingConditionData.map((item) => (
                    <div key={item.condition} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.condition}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.count} buildings
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="systems" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System-Specific Issues</CardTitle>
              <CardDescription>
                Issues identified by building system category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={systemBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="system" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="issues" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Repair Cost Analysis</CardTitle>
              <CardDescription>
                Estimated repair costs by system category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={systemBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="system" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Estimated Cost']}
                  />
                  <Bar dataKey="cost" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}