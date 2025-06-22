import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useOrg } from '@/context/org-context';
import { useTheme } from '@/components/theme-provider';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Building2, Lock, Moon, Sun, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const organizationSchema = z.object({
  name: z.string().min(2, { message: 'Organization name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  assessmentReminders: z.boolean(),
  reportNotifications: z.boolean(),
  marketingEmails: z.boolean(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;

export function SettingsPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const orgForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: currentOrg?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      assessmentReminders: true,
      reportNotifications: true,
      marketingEmails: false,
    },
  });

  async function onOrganizationSubmit(values: OrganizationFormValues) {
    setIsLoading(true);
    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Organization settings updated:', values);
    } catch (error) {
      console.error('Failed to update organization settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function onNotificationSubmit(values: NotificationFormValues) {
    setIsLoading(true);
    try {
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Notification settings updated:', values);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Update your organization's details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...orgForm}>
                <form onSubmit={orgForm.handleSubmit(onOrganizationSubmit)} className="space-y-4">
                  <FormField
                    control={orgForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={orgForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={orgForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={orgForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                View and manage your subscription details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {currentOrg?.subscription || 'Free'}
                    </p>
                  </div>
                  <Button variant="outline">Upgrade Plan</Button>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Buildings</span>
                    <span>10 / 25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Team Members</span>
                    <span>5 / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Storage</span>
                    <span>2.5 GB / 5 GB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications about your account activity.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="assessmentReminders"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Assessment Reminders</FormLabel>
                          <FormDescription>
                            Get reminded about upcoming and overdue assessments.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="reportNotifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Report Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications when reports are generated or shared.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Marketing Emails</FormLabel>
                          <FormDescription>
                            Receive emails about new features and special offers.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    Save Preferences
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <RadioGroup
                  defaultValue={theme}
                  onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Label
                      htmlFor="light"
                      className="flex items-center justify-between rounded-lg border p-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5" />
                        <div className="space-y-1">
                          <p>Light</p>
                          <p className="text-sm text-muted-foreground">
                            Light theme for bright environments
                          </p>
                        </div>
                      </div>
                      <RadioGroupItem value="light" id="light" />
                    </Label>
                    <Label
                      htmlFor="dark"
                      className="flex items-center justify-between rounded-lg border p-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        <div className="space-y-1">
                          <p>Dark</p>
                          <p className="text-sm text-muted-foreground">
                            Dark theme for low-light environments
                          </p>
                        </div>
                      </div>
                      <RadioGroupItem value="dark" id="dark" />
                    </Label>
                    <Label
                      htmlFor="system"
                      className="flex items-center justify-between rounded-lg border p-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <div className="space-y-1">
                          <p>System</p>
                          <p className="text-sm text-muted-foreground">
                            Match your system theme
                          </p>
                        </div>
                      </div>
                      <RadioGroupItem value="system" id="system" />
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                  <Button variant="outline">Update</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Active Sessions</Label>
                    <p className="text-sm text-muted-foreground">
                      Manage your active sessions
                    </p>
                  </div>
                  <Button variant="outline">View All</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}