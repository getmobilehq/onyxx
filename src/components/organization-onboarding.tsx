import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OrganizationOnboardingProps {
  userName: string;
}

export function OrganizationOnboarding({ userName }: OrganizationOnboardingProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Onyx, {userName}! 🎉</h1>
          <p className="text-gray-600">
            You've successfully created your account. To start managing buildings and assessments, 
            you'll need to either create or join an organization.
          </p>
        </div>

        {/* Options Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Create Organization */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Create Organization</CardTitle>
              <CardDescription>
                Start fresh by creating a new organization for your team or company.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to="/organization/create">
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Organization
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                You'll be the admin and can invite team members later.
              </p>
            </CardContent>
          </Card>

          {/* Join Organization */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle className="text-lg">Join Organization</CardTitle>
              <CardDescription>
                Join an existing organization if you've been invited by a team member.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to="/organization/join">
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Join Organization
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                You'll need an invitation code or admin approval.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What happens next */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Create or join an organization to get started</li>
              <li>• Add your first buildings to the platform</li>
              <li>• Begin conducting assessments and tracking facility conditions</li>
              <li>• Generate reports and manage your facility portfolio</li>
            </ul>
          </CardContent>
        </Card>

        {/* Skip for now option */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Want to explore first?{' '}
            <Link to="/profile" className="text-primary hover:underline">
              Update your profile
            </Link>{' '}
            or browse the platform. You can set up an organization anytime.
          </p>
        </div>
      </div>
    </div>
  );
}