
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yilqlufqhjwszclncjdk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbHFsdWZxaGp3c3pjbG5jamRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTUwOTksImV4cCI6MjA1NjkzMTA5OX0.msrgbjLs0wm_TimAXba31fd8mnaN7sAiFw8dAGSMSms';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export type Profile = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

export type User = {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

export async function getUserProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return profile;
}

export async function updateUserProfile(updates: Partial<Profile>): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}
