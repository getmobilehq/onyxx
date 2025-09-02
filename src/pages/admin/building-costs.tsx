import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { buildingCosts, buildingTypeCosts } from '@/data/building-costs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, Save, RefreshCw, Building2, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BuildingCost {
  buildingType: string;
  category: string;
  costPerSqFt: number;
  description?: string;
}

export function BuildingCostsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [costs, setCosts] = useState<BuildingCost[]>(buildingCosts);
  const [editingCost, setEditingCost] = useState<BuildingCost | null>(null);
  const [newCostValue, setNewCostValue] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Get unique categories
  const categories = ['all', ...new Set(costs.map(c => c.category))];

  // Filter costs by category
  const filteredCosts = selectedCategory === 'all' 
    ? costs 
    : costs.filter(c => c.category === selectedCategory);

  const handleEdit = (cost: BuildingCost) => {
    setEditingCost(cost);
    setNewCostValue(cost.costPerSqFt.toString());
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingCost || !newCostValue) return;

    const newCost = parseFloat(newCostValue);
    if (isNaN(newCost) || newCost <= 0) {
      toast.error('Please enter a valid cost per square foot');
      return;
    }

    // Update the cost in the local state
    setCosts(prevCosts => 
      prevCosts.map(c => 
        c.buildingType === editingCost.buildingType 
          ? { ...c, costPerSqFt: newCost }
          : c
      )
    );

    setHasChanges(true);
    setIsDialogOpen(false);
    toast.success(`Updated cost for ${editingCost.buildingType}`);
  };

  const handleSaveAll = async () => {
    try {
      // In a real application, this would save to the backend
      // For now, we'll update the local storage
      localStorage.setItem('buildingCosts', JSON.stringify(costs));
      
      // Show success message
      toast.success('Building costs updated successfully');
      setHasChanges(false);
      
      // You could also trigger a backend update here
      // await api.updateBuildingCosts(costs);
    } catch (error) {
      toast.error('Failed to save building costs');
    }
  };

  const handleReset = () => {
    setCosts(buildingCosts);
    setHasChanges(false);
    toast.info('Building costs reset to defaults');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Office': 'bg-blue-100 text-blue-800',
      'Industrial': 'bg-gray-100 text-gray-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Hospitality': 'bg-purple-100 text-purple-800',
      'Education': 'bg-green-100 text-green-800',
      'Retail': 'bg-orange-100 text-orange-800',
      'Residential': 'bg-yellow-100 text-yellow-800',
      'Civic': 'bg-indigo-100 text-indigo-800',
      'Parking': 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Building Cost Management</h2>
          <p className="text-muted-foreground">
            Configure cost per square foot for different building types
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleSaveAll}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Building Types</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costs.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {categories.length - 1} categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(costs.reduce((sum, c) => sum + c.costPerSqFt, 0) / costs.length).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per square foot
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Range</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.min(...costs.map(c => c.costPerSqFt)).toFixed(2)} - ${Math.max(...costs.map(c => c.costPerSqFt)).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per square foot
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Table */}
      <Card>
        <CardHeader>
          <CardTitle>Building Type Costs</CardTitle>
          <CardDescription>
            Click on any row to edit the cost per square foot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 mb-4">
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All' : category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={selectedCategory}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Cost per Sq Ft</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCosts.map((cost) => (
                    <TableRow key={cost.buildingType}>
                      <TableCell className="font-medium">{cost.buildingType}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(cost.category)}>
                          {cost.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cost.description || 'No description'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${cost.costPerSqFt.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cost)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Building Cost</DialogTitle>
            <DialogDescription>
              Update the cost per square foot for {editingCost?.buildingType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost per Square Foot ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={newCostValue}
                onChange={(e) => setNewCostValue(e.target.value)}
                placeholder="Enter cost per square foot"
              />
            </div>
            {editingCost && (
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm font-medium">Current Details</p>
                <p className="text-sm text-muted-foreground">
                  Category: {editingCost.category}
                </p>
                <p className="text-sm text-muted-foreground">
                  Current Cost: ${editingCost.costPerSqFt.toFixed(2)}/sq ft
                </p>
                {editingCost.description && (
                  <p className="text-sm text-muted-foreground">
                    {editingCost.description}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}