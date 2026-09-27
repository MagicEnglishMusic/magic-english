import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const DEFAULT_STUDENT = {
  id: 'std-1',
  name: 'João Silva',
  email: 'joao.silva@magicenglish.com',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  level: 'Nível 2 • Music Learner',
  levelNumber: 2,
  xp: 2450,
  streak: 12,
  plan: 'VIP Pro',
  objective: '🗣 Conversação',
  currentSkillLevel: '🌱 Iniciante',
  dailyStudyTime: '20 minutos',
  achievementsCount: 6,
  progressPercent: 42,
  // Kiwify integration readiness
  kiwifyData: {
    orderId: 'KW-984217',
    product: 'Magic English Complete Pass',
    accessStatus: 'active',
    checkoutProvider: 'Kiwify Webhook Engine'
  }
};

export const DEFAULT_ADMIN = {
  id: 'adm-1',
  name: 'Admin Geral',
  username: 'admin',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  permissions: ['all']
};

export function AuthProvider({ children }) {
  // authState: { isAuthenticated: boolean, user: Object | null, role: 'student' | 'admin' | null, accessStatus: 'active' | 'pending_payment' | 'blocked' | 'refunded' | 'trial', isOnboarded: boolean, loading: boolean }
  const [authState, setAuthState] = useState(() => {
    if (isSupabaseConfigured) {
      return {
        isAuthenticated: false,
        user: null,
        role: null,
        accessStatus: 'pending_payment',
        isOnboarded: false,
        loading: true
      };
    }
    return {
      isAuthenticated: true, // Default active demo session only when Supabase is not configured
      user: DEFAULT_STUDENT,
      role: 'student',
      accessStatus: 'active',
      isOnboarded: true,
      loading: false
    };
  });

  // Helper to resolve user and onboarding state from multiple persistent sources
  const resolveUserState = async (sessionUser) => {
    if (!sessionUser) return null;

    const userId = sessionUser.id;
    const localOnboardedKey = `magic_english_onboarded_${userId}`;
    const isLocalOnboarded = localStorage.getItem(localOnboardedKey) === 'true';
    const isMetadataOnboarded = Boolean(sessionUser.user_metadata?.is_onboarded);

    let profile = null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        profile = data;
      }
    } catch (err) {
      console.warn('Profile lookup warning:', err.message);
    }

    const isProfileOnboarded = Boolean(profile?.is_onboarded);
    const resolvedIsOnboarded = isProfileOnboarded || isMetadataOnboarded || isLocalOnboarded;

    // Healing mechanism: if client/metadata has true, ensure profiles in database is synced to true
    if (resolvedIsOnboarded) {
      localStorage.setItem(localOnboardedKey, 'true');
      if (profile && !profile.is_onboarded) {
        supabase
          .from('profiles')
          .update({ is_onboarded: true, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .then(() => {});
      }
    }

    const rawRole = profile?.role || sessionUser.user_metadata?.role || 'student';
    const resolvedRole = String(rawRole).trim().toLowerCase();
    // Admins always have active access. Students respect profile.access_status or fallback to active.
    const resolvedAccessStatus = resolvedRole === 'admin' 
      ? 'active' 
      : String(profile?.access_status || 'active').trim().toLowerCase();

    const cleanUser = profile ? {
      id: profile.id,
      name: profile.name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
      email: profile.email || sessionUser.email,
      role: resolvedRole,
      accessStatus: resolvedAccessStatus,
      avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      level: profile.level || sessionUser.user_metadata?.level || 'Nível 1 • First Steps',
      levelNumber: profile.level_number || 1,
      xp: profile.xp ?? 0,
      streak: profile.streak ?? 0,
      plan: profile.plan || 'VIP Pro',
      objective: profile.objective || sessionUser.user_metadata?.objective || '✈️ Viajar',
      currentSkillLevel: profile.level || sessionUser.user_metadata?.level || '🌱 Iniciante',
      dailyStudyTime: profile.daily_study_time || sessionUser.user_metadata?.daily_study_time || '20 minutos',
      kiwifyData: {
        orderId: profile.kiwify_order_id || 'KW-ONLINE',
        product: 'Magic English VIP',
        accessStatus: resolvedAccessStatus
      }
    } : {
      id: sessionUser.id,
      name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
      email: sessionUser.email,
      role: resolvedRole,
      accessStatus: resolvedAccessStatus,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      level: sessionUser.user_metadata?.level || 'Nível 1 • First Steps',
      levelNumber: 1,
      xp: 0,
      streak: 0,
      plan: 'VIP Pro',
      objective: sessionUser.user_metadata?.objective || '✈️ Viajar',
      currentSkillLevel: sessionUser.user_metadata?.level || '🌱 Iniciante',
      dailyStudyTime: sessionUser.user_metadata?.daily_study_time || '20 minutos',
      kiwifyData: {
        orderId: 'KW-NEW',
        product: 'Magic English VIP',
        accessStatus: resolvedAccessStatus
      }
    };

    return {
      user: cleanUser,
      role: cleanUser.role,
      accessStatus: resolvedAccessStatus,
      isOnboarded: resolvedIsOnboarded
    };
  };

  // Listen to Supabase Auth State changes if configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        const isRecoveryUrl = typeof window !== 'undefined' && (
          window.location.hash?.includes('type=recovery') || 
          window.location.search?.includes('type=recovery') ||
          window.location.pathname?.toLowerCase().startsWith('/reset-password')
        );

        if (session?.user) {
          const resolved = await resolveUserState(session.user);
          if (isMounted && resolved) {
            setAuthState((prev) => {
              const effectiveRole = (prev.role === 'admin' && prev.user?.id === session.user.id && resolved.role !== 'admin')
                ? 'admin'
                : resolved.role;

              return {
                isAuthenticated: true,
                user: resolved.user,
                role: effectiveRole,
                accessStatus: effectiveRole === 'admin' ? 'active' : resolved.accessStatus,
                isOnboarded: resolved.isOnboarded,
                isPasswordRecovery: Boolean(prev.isPasswordRecovery || isRecoveryUrl),
                loading: false
              };
            });
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            role: null,
            accessStatus: 'pending_payment',
            isOnboarded: false,
            isPasswordRecovery: isRecoveryUrl,
            loading: false
          });
        }
      } catch (err) {
        console.warn('Supabase session load error:', err.message);
        if (isMounted) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            role: null,
            isOnboarded: false,
            isPasswordRecovery: false,
            loading: false
          });
        }
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        if (session?.user) {
          const resolved = await resolveUserState(session.user);
          setAuthState({
            isAuthenticated: true,
            user: resolved?.user || session.user,
            role: resolved?.role || 'student',
            accessStatus: resolved?.accessStatus || 'active',
            isOnboarded: resolved?.isOnboarded || false,
            isPasswordRecovery: true,
            loading: false
          });
        } else {
          setAuthState((prev) => ({
            ...prev,
            isPasswordRecovery: true,
            loading: false
          }));
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          role: null,
          isOnboarded: false,
          isPasswordRecovery: false,
          loading: false
        });
      } else if (session?.user) {
        // Handles SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION
        checkSession();
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 1. Student Login
  const loginStudent = async (email, password) => {
    // If Supabase is configured, authenticate via Supabase Auth
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) throw error;

        if (data?.user) {
          const resolved = await resolveUserState(data.user);
          if (resolved) {
            setAuthState({
              isAuthenticated: true,
              user: resolved.user,
              role: resolved.role,
              isOnboarded: resolved.isOnboarded,
              loading: false
            });
            return { success: true, user: resolved.user };
          }
        }
      } catch (err) {
        console.warn('Supabase login error:', err.message);
        throw err;
      }
    }

    // Fallback simulation
    if (email === DEFAULT_STUDENT.email || !email) {
      setAuthState({
        isAuthenticated: true,
        user: DEFAULT_STUDENT,
        role: 'student',
        isOnboarded: true,
        loading: false
      });
      return { success: true, user: DEFAULT_STUDENT };
    }

    const customUser = {
      ...DEFAULT_STUDENT,
      email: email,
      name: email.split('@')[0].replace('.', ' ').toUpperCase()
    };
    setAuthState({
      isAuthenticated: true,
      user: customUser,
      role: 'student',
      isOnboarded: true,
      loading: false
    });
    return { success: true, user: customUser };
  };

  // 2. Student Registration
  const registerStudent = async ({ name, email, password }) => {
    let userId = `std-${Date.now()}`;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              name: name.trim(),
              role: 'student',
              is_onboarded: false
            }
          }
        });

        if (error) throw error;
        if (data?.user?.id) {
          userId = data.user.id;
        }
      } catch (err) {
        console.warn('Supabase registration error:', err.message);
        throw err;
      }
    }

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      level: 'Nível 1 • First Steps',
      levelNumber: 1,
      xp: 0,
      streak: 0,
      plan: 'Magic Free Trial',
      objective: '✈️ Viajar',
      currentSkillLevel: '🌱 Iniciante',
      dailyStudyTime: '15 minutos',
      achievementsCount: 0,
      progressPercent: 0,
      kiwifyData: {
        orderId: `KW-${Math.floor(100000 + Math.random() * 900000)}`,
        product: 'Magic English VIP',
        accessStatus: 'active',
        checkoutProvider: 'Kiwify Engine'
      }
    };

    setAuthState({
      isAuthenticated: true,
      user: newUser,
      role: 'student',
      isOnboarded: false,
      loading: false
    });

    return { success: true, user: newUser };
  };

  // 3. Complete Onboarding (Multi-Layer Persistent)
  const completeOnboarding = async ({ objective, currentSkillLevel, dailyStudyTime }) => {
    const selectedObjective = objective || '✈️ Viajar';
    const selectedLevel = currentSkillLevel || '🌱 Iniciante';
    const selectedTime = dailyStudyTime || '20 minutos';
    const userId = authState.user?.id;

    if (userId) {
      // 1. Save to LocalStorage immediately
      localStorage.setItem(`magic_english_onboarded_${userId}`, 'true');
      localStorage.setItem(`magic_english_pref_${userId}`, JSON.stringify({
        objective: selectedObjective,
        level: selectedLevel,
        dailyStudyTime: selectedTime
      }));
    }

    if (isSupabaseConfigured && userId) {
      try {
        // 2. Update Supabase Auth user_metadata
        await supabase.auth.updateUser({
          data: {
            is_onboarded: true,
            objective: selectedObjective,
            level: selectedLevel,
            daily_study_time: selectedTime
          }
        });

        // 3. Update Supabase Public Profiles Table
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            objective: selectedObjective,
            level: selectedLevel,
            daily_study_time: selectedTime,
            is_onboarded: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateErr) {
          console.warn('Profiles update warning, attempting upsert:', updateErr);
          await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name: authState.user.name || authState.user.email?.split('@')[0] || 'Aluno',
              email: authState.user.email,
              objective: selectedObjective,
              level: selectedLevel,
              daily_study_time: selectedTime,
              is_onboarded: true,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('Supabase onboarding update exception:', err.message);
      }
    }

    // 4. Update React global authState synchronously
    setAuthState((prev) => {
      if (!prev.user) return { ...prev, isOnboarded: true };
      return {
        ...prev,
        user: {
          ...prev.user,
          objective: selectedObjective,
          level: selectedLevel,
          currentSkillLevel: selectedLevel,
          dailyStudyTime: selectedTime
        },
        isOnboarded: true
      };
    });

    return { success: true };
  };

  // 4. Password Recovery
  const resetPassword = async (email) => {
    if (isSupabaseConfigured) {
      try {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });
        if (error) throw error;
        return { success: true, data, message: `Instruções enviadas para ${email}` };
      } catch (err) {
        console.warn('Supabase reset password:', err.message);
        throw err;
      }
    }
    return { success: true, message: `Instruções enviadas para ${email}` };
  };

  // 4.1. Set / Update Password (First Access & Password Reset)
  const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('A senha deve conter no mínimo 6 caracteres.');
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.warn('Supabase updateUser password error:', error.message);
        throw error;
      }

      if (data?.user) {
        const resolved = await resolveUserState(data.user);
        if (resolved) {
          setAuthState({
            isAuthenticated: true,
            user: resolved.user,
            role: resolved.role,
            accessStatus: resolved.accessStatus,
            isOnboarded: resolved.isOnboarded,
            isPasswordRecovery: false,
            loading: false,
          });
        }
      }

      return { success: true, user: data?.user };
    }

    return { success: true };
  };

  // 5. Admin Authentication (Real Supabase Auth + profiles.role === 'admin' check)
  const loginAdmin = async (email, password) => {
    if (!email || !password) {
      throw new Error('Por favor, preencha o e-mail e a senha de administrador.');
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password
        });

        if (error) throw error;

        if (data?.user) {
          const resolved = await resolveUserState(data.user);
          const normalizedRole = String(resolved?.role || '').trim().toLowerCase();

          if (!resolved || normalizedRole !== 'admin') {
            // Sign out immediately if the user is a student
            await supabase.auth.signOut();
            throw new Error('Acesso negado. Esta conta não possui privilégios de administrador.');
          }

          setAuthState({
            isAuthenticated: true,
            user: resolved.user,
            role: 'admin',
            accessStatus: 'active',
            isOnboarded: true,
            loading: false
          });

          return { success: true, user: resolved.user };
        }
      } catch (err) {
        console.warn('Supabase admin login error:', err.message);
        throw err;
      }
    }

    // Fallback offline only when Supabase is not configured
    if (email === 'admin@magicenglish.com' || email === 'admin') {
      const adminUser = {
        ...DEFAULT_ADMIN,
        email: 'admin@magicenglish.com'
      };
      setAuthState({
        isAuthenticated: true,
        user: adminUser,
        role: 'admin',
        accessStatus: 'active',
        isOnboarded: true,
        loading: false
      });
      return { success: true, user: adminUser };
    }

    throw new Error('Credenciais de administrador inválidas.');
  };

  // 6. Logout
  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err.message);
      }
    }

    setAuthState({
      isAuthenticated: false,
      user: null,
      role: null,
      accessStatus: 'pending_payment',
      isOnboarded: false,
      loading: false
    });
  };

  // 7. Refresh Current Session & Profile State
  const refreshSession = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const resolved = await resolveUserState(session.user);
        if (resolved) {
          setAuthState({
            isAuthenticated: true,
            user: resolved.user,
            role: resolved.role,
            accessStatus: resolved.accessStatus,
            isOnboarded: resolved.isOnboarded,
            loading: false
          });
        }
      }
    } catch (err) {
      console.warn('Session refresh error:', err.message);
    }
  };

  const value = {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    role: authState.role,
    accessStatus: authState.accessStatus || authState.user?.accessStatus || 'active',
    isOnboarded: authState.isOnboarded,
    isPasswordRecovery: authState.isPasswordRecovery || false,
    loading: authState.loading,
    loginStudent,
    registerStudent,
    completeOnboarding,
    resetPassword,
    updatePassword,
    loginAdmin,
    refreshSession,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
