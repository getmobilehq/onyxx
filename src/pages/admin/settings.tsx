import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Building2,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Save,
  Users,
  Shield,
  Database,
  Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

// Mock data for building types
const buildingTypes = [
  { id: '1', name: 'Office Building', description: 'Commercial office space', active: true },
  { id: '2', name: 'Warehouse', description: 'Industrial storage facility', active: true },
  { id: '3', name: 'Retail Store', description: 'Commercial retail space', active: true },
  { id: '4', name: 'Hospital', description: 'Healthcare facility', active: true },
  { id: '5', name: 'School', description: 'Educational institution', active: false },
];

// Mock data for construction types
const constructionTypes = [
  { id: '1', name: 'Steel Frame', description: 'Steel structural framework', active: true },
  { id: '2', name: 'Concrete Block', description: 'Concrete masonry construction', active: true },
  { id: '3', name: 'Wood Frame', description: 'Wooden structural framework', active: true },
  { id: '4', name: 'Reinforced Concrete', description: 'Steel-reinforced concrete', active: true },
  { id: '5', name: 'Masonry', description: 'Brick or stone construction', active: true },
];

// Mock data for building elements (Uniformat II)
const buildingElements = [
  { id: '1', code: 'A10', name: 'Foundations', category: 'Substructure', active: true },
  { id: '2', code: 'A20', name: 'Basement Construction', category: 'Substructure', active: true },
  { id: '3', code: 'B10', name: 'Superstructure', category: 'Shell', active: true },
  { id: '4', code: 'B20', name: 'Exterior Enclosure', category: 'Shell', active: true },
  { id: '5', code: 'B30', name: 'Roofing', category: 'Shell', active: true },
  { id: '6', code: 'C10', name: 'Interior Construction', category: 'Interiors', active: true },
  { id: '7', code: 'C20', name: 'Stairs', category: 'Interiors', active: true },
  { id: '8', code: 'C30', name: 'Interior Finishes', category: 'Interiors', active: true },
  { id: '9', code: 'D10', name: 'Conveying Systems', category: 'Services', active: true },
  { id: '10', code: 'D20', name: 'Plumbing', category: 'Services', active: true },
];

const buildingTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
});

const constructionTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
});

const buildingElementSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
});

type BuildingTypeForm = z.infer<typeof buildingTypeSchema>;
type ConstructionTypeForm = z.infer<typeof constructionTypeSchema>;
type BuildingElementForm = z.infer<typeof buildingElementSchema>;

const elementCategories = [
  'Substructure',
  'Shell',
  'Interiors',
  'Services',
  'Equipment & Furnishings',
  'Special Construction',
  'Building Sitework'
];

export function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [isBuildingTypeDialogOpen, setIsBuildingTypeDialogOpen] = useState(false);
  const [isConstructionTypeDialogOpen, setIsConstructionTypeDialogOpen] = useState(false);
  const [isBuildingElementDialogOpen, setIsBuildingElementDialogOpen] = useState(false);
  
  // Edit states
  const [editingBuildingType, setEditingBuildingType] = useState<any>(null);
  const [editingConstructionType, setEditingConstructionType] = useState<any>(null);
  const [editingBuildingElement, setEditingBuildingElement] = useState<any>(null);

  // Forms
  const buildingTypeForm = useForm<BuildingTypeForm>({
    resolver: zodResolver(buildingTypeSchema),
    defaultValues: { name: '', description: '' },
  });

  const constructionTypeForm = useForm<ConstructionTypeForm>({
    resolver: zodResolver(constructionTypeSchema),
    defaultValues: { name: '', description: '' },
  });

  const buildingElementForm = useForm<BuildingElementForm>({
    resolver: zodResolver(buildingElementSchema),
    defaultValues: { code: '', name: '', category: '' },
  });

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleBuildingTypeSubmit = (data: BuildingTypeForm) => {
    console.log('Building type data:', data);
    toast.success(`Building type ${editingBuildingType ? 'updated' : 'created'} successfully`);
    setIsBuildingTypeDialogOpen(false);
    setEditingBuildingType(null);
    buildingTypeForm.reset();
  };

  const handleConstructionTypeSubmit = (data: ConstructionTypeForm) => {
    console.log('Construction type data:', data);
    toast.success(`Construction type ${editingConstructionType ? 'updated' : 'created'} successfully`);
    setIsConstructionTypeDialogOpen(false);
    setEditingConstructionType(null);
    constructionTypeForm.reset();
  };

  const handleBuildingElementSubmit = (data: BuildingElementForm) => {
    console.log('Building element data:', data);
    toast.success(`Building element ${editingBuildingElement ? 'updated' : 'created'} successfully`);
    setIsBuildingElementDialogOpen(false);
    setEditingBuildingElement(null);
    buildingElementForm.reset();
  };

  const handleEdit = (item: any, type: 'building' | 'construction' | 'element') => {
    if (type === 'building') {
      setEditingBuildingType(item);
      buildingTypeForm.reset({ name: item.name, description: item.description });
      setIsBuildingTypeDialogOpen(true);
    } else if (type === 'construction') {
      setEditingConstructionType(item);
      constructionTypeForm.reset({ name: item.name, description: item.description });
      setIsConstructionTypeDialogOpen(true);
    } else if (type === 'element') {
      setEditingBuildingElement(item);
      buildingElementForm.reset({ code: item.code, name: item.name, category: item.category });
      setIsBuildingElementDialogOpen(true);
    }
  };

  const handleDelete = (id: string, name: string, type: string) => {
    console.log(`Deleting ${type}:`, id);
    toast.success(`${name} deleted successfully`);
  };

  const handleToggleActive = (id: string, name: string, currentStatus: boolean) => {
    console.log(`Toggling active status for:`, id);
    toast.success(`${name} ${currentStatus ? 'deactivated' : 'activated'} successfully`);
  };

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Settings</h2>
          <p className="text-muted-foreground">
            Manage building types, construction types, elements, and system settings.
          </p>
        </div>
        <Badge variant="destructive" className="w-fit">
          <Shield className="mr-1 h-3 w-3" />
          Admin Only
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Building Types</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildingTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              {buildingTypes.filter(t => t.active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Construction Types</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{constructionTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              {constructionTypes.filter(t => t.active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Building Elements</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildingElements.length}</div>
            <p className="text-xs text-muted-foreground">
              {buildingElements.filter(e => e.active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Good</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="building-types" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="building-types">Building Types</TabsTrigger>
          <TabsTrigger value="construction-types">Construction Types</TabsTrigger>
          <TabsTrigger value="building-elements">Building Elements</TabsTrigger>
          <TabsTrigger value="system-settings">System Settings</TabsTrigger>
        </TabsList>

        {/* Building Types Tab */}
        <TabsContent value="building-types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Building Types</CardTitle>
                  <CardDescription>
                    Manage the types of buildings that can be assessed in the system.
                  </CardDescription>
                </div>
                <Dialog open={isBuildingTypeDialogOpen} onOpenChange={setIsBuildingTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Building Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingBuildingType ? 'Edit Building Type' : 'Add Building Type'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingBuildingType ? 'Update the building type details.' : 'Create a new building type for the system.'}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...buildingTypeForm}>
                      <form onSubmit={buildingTypeForm.handleSubmit(handleBuildingTypeSubmit)} className="space-y-4">
                        <FormField
                          control={buildingTypeForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Office Building" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={buildingTypeForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Describe this building type..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => {
                            setIsBuildingTypeDialogOpen(false);
                            setEditingBuildingType(null);
                            buildingTypeForm.reset();
                          }}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            {editingBuildingType ? 'Update' : 'Create'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildingTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
                      <TableCell>
                        <Badge variant={type.active ? 'default' : 'secondary'}>
                          {type.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type, 'building')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(type.id, type.name, type.active)}
                          >
                            {type.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Building Type</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{type.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(type.id, type.name, 'building type')}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Construction Types Tab */}
        <TabsContent value="construction-types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Construction Types</CardTitle>
                  <CardDescription>
                    Manage construction methods and materials used in buildings.
                  </CardDescription>
                </div>
                <Dialog open={isConstructionTypeDialogOpen} onOpenChange={setIsConstructionTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Construction Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingConstructionType ? 'Edit Construction Type' : 'Add Construction Type'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingConstructionType ? 'Update the construction type details.' : 'Create a new construction type for the system.'}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...constructionTypeForm}>
                      <form onSubmit={constructionTypeForm.handleSubmit(handleConstructionTypeSubmit)} className="space-y-4">
                        <FormField
                          control={constructionTypeForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Steel Frame" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={constructionTypeForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Describe this construction type..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => {
                            setIsConstructionTypeDialogOpen(false);
                            setEditingConstructionType(null);
                            constructionTypeForm.reset();
                          }}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            {editingConstructionType ? 'Update' : 'Create'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {constructionTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
                      <TableCell>
                        <Badge variant={type.active ? 'default' : 'secondary'}>
                          {type.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type, 'construction')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(type.id, type.name, type.active)}
                          >
                            {type.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Construction Type</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{type.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(type.id, type.name, 'construction type')}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Building Elements Tab */}
        <TabsContent value="building-elements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Building Elements</CardTitle>
                  <CardDescription>
                    Manage Uniformat II building elements used in assessments.
                  </CardDescription>
                </div>
                <Dialog open={isBuildingElementDialogOpen} onOpenChange={setIsBuildingElementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Building Element
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingBuildingElement ? 'Edit Building Element' : 'Add Building Element'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingBuildingElement ? 'Update the building element details.' : 'Create a new building element for assessments.'}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...buildingElementForm}>
                      <form onSubmit={buildingElementForm.handleSubmit(handleBuildingElementSubmit)} className="space-y-4">
                        <FormField
                          control={buildingElementForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Uniformat Code</FormLabel>
                              <FormControl>
                                <Input placeholder="A10" {...field} />
                              </FormControl>
                              <FormDescription>
                                Uniformat II classification code
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={buildingElementForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Element Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Foundations" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={buildingElementForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {elementCategories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => {
                            setIsBuildingElementDialogOpen(false);
                            setEditingBuildingElement(null);
                            buildingElementForm.reset();
                          }}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            {editingBuildingElement ? 'Update' : 'Create'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildingElements.map((element) => (
                    <TableRow key={element.id}>
                      <TableCell className="font-mono font-medium">{element.code}</TableCell>
                      <TableCell className="font-medium">{element.name}</TableCell>
                      <TableCell>{element.category}</TableCell>
                      <TableCell>
                        <Badge variant={element.active ? 'default' : 'secondary'}>
                          {element.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(element, 'element')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(element.id, element.name, element.active)}
                          >
                            {element.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Building Element</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{element.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(element.id, element.name, 'building element')}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system-settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Assessment Settings</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm">Default Assessment Duration (days)</label>
                      <Input type="number" defaultValue="30" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Require Photo Upload</label>
                      <Select defaultValue="required">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="required">Required</SelectItem>
                          <SelectItem value="optional">Optional</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">FCI Calculation Settings</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm">Excellent Threshold</label>
                      <Input type="number" step="0.01" defaultValue="0.10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Good Threshold</label>
                      <Input type="number" step="0.01" defaultValue="0.40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Fair Threshold</label>
                      <Input type="number" step="0.01" defaultValue="0.70" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Critical Threshold</label>
                      <Input type="number" step="0.01" defaultValue="1.00" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">User Management</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm">Default User Role</label>
                      <Select defaultValue="assessor">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="assessor">Assessor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Session Timeout (minutes)</label>
                      <Input type="number" defaultValue="480" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
                <Button variant="outline">Reset to Defaults</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}