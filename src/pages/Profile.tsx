
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { updateUserProfile } from '@/lib/supabase';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState({
    fullName: profile?.full_name || '',
    avatarUrl: profile?.avatar_url || '',
  });

  if (!user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { success, error } = await updateUserProfile({
        full_name: formState.fullName,
        avatar_url: formState.avatarUrl,
      });

      if (success) {
        await refreshProfile();
        toast.success('Profile updated successfully');
      } else {
        toast.error(`Failed to update profile: ${error?.message}`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user initials for avatar fallback
  const initials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <AppLayout>
      <AnimatedContainer animation="fade-up" className="max-w-xl mx-auto py-10 px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage
                  src={profile?.avatar_url || ''}
                  alt={profile?.full_name || user.email || 'User'}
                />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">
                {profile?.full_name || user.email || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Your full name"
                  value={formState.fullName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  name="avatarUrl"
                  placeholder="https://example.com/your-avatar.jpg"
                  value={formState.avatarUrl}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a URL to an image to use as your avatar
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </AnimatedContainer>
    </AppLayout>
  );
};

export default Profile;
