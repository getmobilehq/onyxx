import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OrganizationOnboardingProps {
  userName: string;
  wasInvited?: boolean;
}

export function OrganizationOnboarding({ userName, wasInvited = false }: OrganizationOnboardingProps) {
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
            {wasInvited ? (
              <>You've been invited to join an organization. Accept the invitation to get started.</>
            ) : (
              <>Your organization has been successfully created! You can now start managing buildings and assessments.</>
            )}
          </p>
        </div>

        {/* Options Cards - Only show join option if user was invited */}
        {wasInvited ? (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle className="text-lg">Join Organization</CardTitle>
              <CardDescription>
                Accept your invitation to join the organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to="/organization/join">
                <Button className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Accept Invitation
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                Use the invitation link or code provided by your admin.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Your Organization is Ready!</CardTitle>
              <CardDescription>
                Your organization has been created. You can now start adding buildings and inviting team members.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to="/dashboard">
                <Button className="w-full">
                  <Building2 className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                As the admin, you can invite managers and assessors to join your organization.
              </p>
            </CardContent>
          </Card>
        )}

        {/* What happens next */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {wasInvited ? (
                <>
                  <li>• Accept your invitation to join the organization</li>
                  <li>• Access buildings and assessments shared with your team</li>
                  <li>• Begin conducting assessments based on your role</li>
                </>
              ) : (
                <>
                  <li>• Add your first buildings to the platform</li>
                  <li>• Invite team members (managers and assessors)</li>
                  <li>• Begin conducting assessments and tracking facility conditions</li>
                  <li>• Generate reports and manage your facility portfolio</li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Skip for now option - only for invited users */}
        {wasInvited && (
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Want to explore first?{' '}
              <Link to="/profile" className="text-primary hover:underline">
                Update your profile
              </Link>{' '}
              You can accept the invitation anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}