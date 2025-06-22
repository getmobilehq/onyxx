import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    
    // Simulate API request
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-2">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-semibold text-center">
          {isSubmitted ? 'Check your email' : 'Forgot password'}
        </CardTitle>
        <CardDescription className="text-center">
          {isSubmitted
            ? "We've sent you a link to reset your password"
            : "Enter your email and we'll send you a link to reset your password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              If an account exists with the email you entered, you will receive a password recovery link soon.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Return to login</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@example.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending recovery link...
                    </>
                  ) : (
                    'Send recovery link'
                  )}
                </Button>
              </form>
            </Form>
            <div className="text-center">
              <Button variant="link" asChild>
                <Link to="/login" className="flex items-center justify-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}