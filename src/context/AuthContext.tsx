import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
    isSales: boolean;
    signOut: () => Promise<void>;
    reloadProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const reloadProfile = useCallback(async (): Promise<Profile | null> => {
        if (!user) {
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            return null;
        }

        sessionStorage.removeItem('userProfile'); // Clear cache before fetching

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error reloading profile:', error.message);
                setProfile(null);
                return null;
            }
            
            if (data) {
                console.log('✅ Profile reloaded from Supabase and cached.');
                setProfile(data as Profile);
                sessionStorage.setItem('userProfile', JSON.stringify(data));
                return data as Profile;
            }

            // If no data, ensure profile is cleared
            setProfile(null);
            return null;

        } catch (e: any) {
            console.error("❌ Unexpected error in reloadProfile:", e.message);
            setProfile(null);
            return null;
        }
    }, [user]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        sessionStorage.removeItem('userProfile');
    };

    const fetchProfile = useCallback(async (user: User | null): Promise<Profile | null> => {
        if (!user) {
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            return null;
        }

        // Try to get from cache first
        try {
            const cachedProfile = sessionStorage.getItem('userProfile');
            if (cachedProfile) {
                const parsed = JSON.parse(cachedProfile);
                // Basic validation to ensure the cached profile belongs to the current user
                if (parsed.id === user.id) {
                    console.log('✅ Profile loaded from sessionStorage cache.');
                    setProfile(parsed);
                    return parsed;
                }
            }
        } catch (e) {
            console.warn("Could not read profile from sessionStorage.", e);
        }

        // If not in cache, fetch from Supabase
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error fetching profile:', error.message);
                setProfile(null);
                sessionStorage.removeItem('userProfile');
                return null;
            }
            
            if (data) {
                console.log('✅ Profile fetched from Supabase and cached.');
                setProfile(data as Profile);
                sessionStorage.setItem('userProfile', JSON.stringify(data));
                return data as Profile;
            }

            return null;

        } catch (e: any) {
            console.error("❌ Unexpected error in fetchProfile:", e.message);
            setProfile(null);
            sessionStorage.removeItem('userProfile');
            return null;
        }
    }, []);

    useEffect(() => {
        setLoading(true);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'INITIAL_SESSION') {
                    setSession(session);
                    const currentUser = session?.user ?? null;
                    setUser(currentUser);
                    await fetchProfile(currentUser);
                    setLoading(false);
                } else if (event === 'SIGNED_IN') {
                    setSession(session);
                    const currentUser = session?.user ?? null;
                    setUser(currentUser);
                    await fetchProfile(currentUser);
                } else if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    sessionStorage.removeItem('userProfile');
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchProfile]);

    useEffect(() => {
        if (user) {
            fetchProfile(user);
        }
    }, [user, fetchProfile]);

    useEffect(() => {
        if (profile && profile.role === 'user' && !profile.asesor_asignado_id) {
            const assignAgent = async () => {
                try {
                    const { data: agentId, error: rpcError } = await supabase.rpc('get_next_sales_agent');
                    if (rpcError) {
                        console.error('Error assigning sales agent:', rpcError);
                    } else if (agentId) {
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ asesor_asignado_id: agentId })
                            .eq('id', profile.id);
                        if (updateError) {
                            console.error('Error updating profile with agent ID:', updateError);
                        } else {
                            // Reload profile to get the latest data and update cache
                            await reloadProfile();
                        }
                    }
                } catch (e) {
                    console.error("Unexpected error in agent assignment effect:", e);
                }
            };
            assignAgent();
        }
    }, [profile, reloadProfile]);

    const isAdmin = profile?.role === 'admin';
    const isSales = profile?.role === 'sales';

    const value = {
        session,
        user,
        profile,
        loading,
        isAdmin,
        isSales,
        signOut,
        reloadProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
