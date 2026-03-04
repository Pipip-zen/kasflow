import { supabase } from './supabase';

export async function getUserStatus(): Promise<'unauthenticated' | 'unverified' | 'verified'> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 'unauthenticated';
    if (!user.email_confirmed_at) return 'unverified';
    return 'verified';
}
