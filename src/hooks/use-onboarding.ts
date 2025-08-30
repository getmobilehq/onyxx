import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export function useOnboarding() {
  const { user, isFirstLogin, clearFirstLogin } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding (stored in localStorage)
      const onboardingKey = `onboarding_completed_${user.id}`;
      const completed = localStorage.getItem(onboardingKey) === 'true';
      setHasCompletedOnboarding(completed);
    }
    setLoading(false);
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      const onboardingKey = `onboarding_completed_${user.id}`;
      localStorage.setItem(onboardingKey, 'true');
      setHasCompletedOnboarding(true);
      clearFirstLogin(); // Clear the first login flag
    }
  };

  const resetOnboarding = () => {
    if (user) {
      const onboardingKey = `onboarding_completed_${user.id}`;
      localStorage.removeItem(onboardingKey);
      setHasCompletedOnboarding(false);
    }
  };

  // Check if user should see onboarding (new user or first login and hasn't completed onboarding)
  const shouldShowOnboarding = user && !hasCompletedOnboarding && user.organization_id && isFirstLogin;

  return {
    hasCompletedOnboarding,
    shouldShowOnboarding,
    completeOnboarding,
    resetOnboarding,
    loading
  };
}