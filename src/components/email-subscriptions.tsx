import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Mail, 
  Plus, 
  Settings, 
  Trash2, 
  Send,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface EmailSubscription {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  report_type: 'summary' | 'detailed' | 'critical_only';
  filters: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function EmailSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    frequency: 'weekly' as const,
    report_type: 'summary' as const,
    filters: {}
  });
  const [submitting, setSubmitting] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    checkEmailStatus();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/reports/subscriptions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      toast.error('Failed to load email subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const checkEmailStatus = async () => {
    try {
      const response = await fetch('/api/reports/email-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        setEmailStatus(status);
      }
    } catch (error) {
      console.error('Failed to check email status:', error);
    }
  };

  const createSubscription = async () => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/reports/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSubscription)
      });
      
      if (response.ok) {
        toast.success('Email subscription created successfully');
        setCreateDialogOpen(false);
        fetchSubscriptions();
        setNewSubscription({
          frequency: 'weekly',
          report_type: 'summary',
          filters: {}
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      toast.error('Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSubscription = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/reports/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: isActive })
      });
      
      if (response.ok) {
        toast.success(`Subscription ${isActive ? 'enabled' : 'disabled'}`);
        fetchSubscriptions();
      } else {
        toast.error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/subscriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        toast.success('Subscription deleted successfully');
        fetchSubscriptions();
      } else {
        toast.error('Failed to delete subscription');
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      toast.error('Failed to delete subscription');
    }
  };

  const sendTestEmail = async () => {
    try {
      setTestingEmail(true);
      const response = await fetch('/api/reports/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ report_type: 'summary' })
      });
      
      if (response.ok) {
        toast.success('Test email sent successfully! Check your inbox.');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'destructive';
      case 'weekly': return 'default';
      case 'monthly': return 'secondary';
      default: return 'outline';
    }
  };

  const getReportTypeBadgeColor = (reportType: string) => {
    switch (reportType) {
      case 'summary': return 'default';
      case 'detailed': return 'secondary';
      case 'critical_only': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Report Subscriptions
            </CardTitle>
            <CardDescription>
              Manage your automated email report subscriptions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {emailStatus?.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {emailStatus?.message || 'Unknown status'}
              </span>
            </div>
            
            <Button
              onClick={sendTestEmail}
              disabled={testingEmail || !emailStatus?.success}
              variant="outline"
              size="sm"
            >
              {testingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Test Email
                </>
              )}
            </Button>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Email Subscription</DialogTitle>
                  <DialogDescription>
                    Set up automated email reports for assessment data
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={newSubscription.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                        setNewSubscription(prev => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="report_type">Report Type</Label>
                    <Select
                      value={newSubscription.report_type}
                      onValueChange={(value: 'summary' | 'detailed' | 'critical_only') =>
                        setNewSubscription(prev => ({ ...prev, report_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Summary Report</SelectItem>
                        <SelectItem value="detailed">Detailed Report</SelectItem>
                        <SelectItem value="critical_only">Critical Issues Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={createSubscription}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Subscription'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Email Subscriptions</h3>
            <p className="text-muted-foreground mb-4">
              Create your first email subscription to receive automated reports
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={getFrequencyBadgeColor(subscription.frequency)}>
                      {subscription.frequency}
                    </Badge>
                    <Badge variant={getReportTypeBadgeColor(subscription.report_type)}>
                      {subscription.report_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(subscription.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`subscription-${subscription.id}`} className="text-sm">
                      {subscription.is_active ? 'Active' : 'Inactive'}
                    </Label>
                    <Switch
                      id={`subscription-${subscription.id}`}
                      checked={subscription.is_active}
                      onCheckedChange={(checked) => toggleSubscription(subscription.id, checked)}
                    />
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this email subscription? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSubscription(subscription.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}