import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface FCITrendData {
  date: string;
  fci: number;
  buildingName: string;
}

interface FCITrendChartProps {
  assessments: any[];
  buildingId?: string;
}

export function FCITrendChart({ assessments, buildingId }: FCITrendChartProps) {
  const [trendData, setTrendData] = useState<FCITrendData[]>([]);

  // Extract FCI from notes
  const extractFCIFromNotes = (notes: string): number | null => {
    if (!notes) return null;
    const fciMatch = notes.match(/FCI Score: (\d+\.?\d*)/);
    if (fciMatch && fciMatch[1]) {
      return parseFloat(fciMatch[1]);
    }
    return null;
  };

  useEffect(() => {
    // Process assessments to extract FCI trend data
    const data = assessments
      .filter(a => a.status === 'completed' && a.notes)
      .filter(a => !buildingId || a.building_id === buildingId)
      .map(assessment => {
        const fci = extractFCIFromNotes(assessment.notes || '');
        return fci !== null ? {
          date: new Date(assessment.completed_at || assessment.created_at).toLocaleDateString(),
          fci,
          buildingName: assessment.building_name || 'Unknown'
        } : null;
      })
      .filter(Boolean) as FCITrendData[];

    // Sort by date
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setTrendData(data);
  }, [assessments, buildingId]);

  const avgFCI = trendData.length > 0 
    ? trendData.reduce((sum, d) => sum + d.fci, 0) / trendData.length 
    : 0;

  const trend = trendData.length >= 2 
    ? trendData[trendData.length - 1].fci - trendData[0].fci 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>FCI Trend Analysis</CardTitle>
            <CardDescription>
              Historical facility condition index over time
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={trend > 0 ? "destructive" : "default"}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(3)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Avg: {avgFCI.toFixed(3)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {trendData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No FCI Data Available</h3>
            <p className="text-sm text-muted-foreground">
              Complete assessments to see FCI trends over time
            </p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 0.5]} tickFormatter={(value) => value.toFixed(2)} />
                <Tooltip 
                  formatter={(value: number) => value.toFixed(3)}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                
                {/* Reference lines for FCI thresholds */}
                <ReferenceLine y={0.05} stroke="#22c55e" strokeDasharray="5 5" label="Good" />
                <ReferenceLine y={0.10} stroke="#3b82f6" strokeDasharray="5 5" label="Fair" />
                <ReferenceLine y={0.30} stroke="#f59e0b" strokeDasharray="5 5" label="Poor" />
                
                <Line 
                  type="monotone" 
                  dataKey="fci" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                  activeDot={{ r: 8 }}
                  name="FCI Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {trendData.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">{trendData[0].fci.toFixed(3)}</div>
              <div className="text-muted-foreground">First Assessment</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{avgFCI.toFixed(3)}</div>
              <div className="text-muted-foreground">Average FCI</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{trendData[trendData.length - 1].fci.toFixed(3)}</div>
              <div className="text-muted-foreground">Latest Assessment</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}