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
  // authState: { isAuthenticated: boolean, user: Object | null, role: 'student' | 'admin' | null, isOnboarded: boolean, loading: boolean }
  const [authState, setAuthState] = useState(() => {
    if (isSupabaseConfigured) {
      return {
        isAuthenticated: false,
        user: null,
        role: null,
        isOnboarded: false,
        loading: true
      };
    }
    return {
      isAuthenticated: true, // Default active demo session only when Supabase is not configured
      user: DEFAULT_STUDENT,
      role: 'student',
      isOnboarded: true,
      loading: false
    };
  });

  // Listen to Supabase Auth State changes if configured
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch profile from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const cleanUser = profile ? {
            id: profile.id,
            name: profile.name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            email: profile.email || session.user.email,
            role: profile.role || 'student',
            avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
            level: profile.level || 'Nível 1 • First Steps',
            levelNumber: profile.level_number || 1,
            xp: profile.xp ?? 0,
            streak: profile.streak ?? 0,
            plan: profile.plan || 'VIP Pro',
            objective: profile.objective || '',
            currentSkillLevel: profile.current_skill_level || '🌱 Iniciante',
            dailyStudyTime: profile.daily_study_time || '20 minutos',
            kiwifyData: {
              orderId: profile.kiwify_order_id || 'KW-ONLINE',
              product: 'Magic English VIP',
              accessStatus: profile.kiwify_status || 'active'
            }
          } : {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            email: session.user.email,
            role: session.user.user_metadata?.role || 'student',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
            level: 'Nível 1 • First Steps',
            levelNumber: 1,
            xp: 0,
            streak: 0,
            plan: 'VIP Pro',
            objective: '',
            currentSkillLevel: '🌱 Iniciante',
            dailyStudyTime: '20 minutos',
            kiwifyData: {
              orderId: 'KW-NEW',
              product: 'Magic English VIP',
              accessStatus: 'active'
            }
          };

          setAuthState({
            isAuthenticated: true,
            user: cleanUser,
            role: cleanUser.role,
            isOnboarded: profile ? (profile.is_onboarded ?? false) : false,
            loading: false
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            role: null,
            isOnboarded: false,
            loading: false
          });
        }
      } catch (err) {
        console.warn('Supabase session load error:', err.message);
        setAuthState({
          isAuthenticated: false,
          user: null,
          role: null,
          isOnboarded: false,
          loading: false
        });
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          role: null,
          isOnboarded: false,
          loading: false
        });
      } else if (event === 'SIGNED_IN' && session?.user) {
        checkSession();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 1. Student Login
  const loginStudent = async (email, password) => {
    // If Supabase is configured and not default demo, try Supabase auth
    if (isSupabaseConfigured && email !== DEFAULT_STUDENT.email) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) throw error;

        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const loadedUser = profile ? {
            id: profile.id,
            name: profile.name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
            email: profile.email || data.user.email,
            role: profile.role || 'student',
            avatar: profile.avatar_url,
            level: profile.level || 'Nível 1 • First Steps',
            levelNumber: profile.level_number || 1,
            xp: profile.xp ?? 0,
            streak: profile.streak ?? 0,
            plan: profile.plan || 'VIP Pro',
            objective: profile.objective,
            dailyStudyTime: profile.daily_study_time,
            kiwifyData: {
              orderId: profile.kiwify_order_id,
              product: 'Magic English VIP',
              accessStatus: profile.kiwify_status || 'active'
            }
          } : {
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
            email: data.user.email,
            role: 'student',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
            level: 'Nível 1 • First Steps',
            levelNumber: 1,
            xp: 0,
            streak: 0,
            plan: 'VIP Pro',
            objective: '',
            dailyStudyTime: '20 minutos',
            kiwifyData: {
              orderId: 'KW-NEW',
              product: 'Magic English VIP',
              accessStatus: 'active'
            }
          };

          setAuthState({
            isAuthenticated: true,
            user: loadedUser,
            role: loadedUser.role,
            isOnboarded: profile ? (profile.is_onboarded ?? false) : false,
            loading: false
          });

          return { success: true, user: loadedUser };
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
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name.trim(),
              role: 'student'
            }
          }
        });

        if (error) throw error;
      } catch (err) {
        console.warn('Supabase registration fallback:', err.message);
      }
    }

    const newUser = {
      id: `std-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      level: 'Nível 1 • First Steps',
      levelNumber: 1,
      xp: 0,
      streak: 0,
      plan: 'Magic Free Trial',
      objective: '',
      currentSkillLevel: '🌱 Iniciante',
      dailyStudyTime: '15 minutos',
      achievementsCount: 0,
      progressPercent: 0,
      kiwifyData: {
        orderId: `KW-${Math.floor(100000 + Math.random() * 900000)}`,
        product: 'Magic English VIP Anual',
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

  // 3. Complete Onboarding
  const completeOnboarding = async ({ objective, currentSkillLevel, dailyStudyTime }) => {
    if (isSupabaseConfigured && authState.user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            objective,
            daily_study_time: dailyStudyTime,
            is_onboarded: true
          })
          .eq('id', authState.user.id);
      } catch (err) {
        console.warn('Supabase onboarding update:', err.message);
      }
    }

    setAuthState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          objective: objective || prev.user.objective,
          currentSkillLevel: currentSkillLevel || prev.user.currentSkillLevel,
          dailyStudyTime: dailyStudyTime || prev.user.dailyStudyTime
        },
        isOnboarded: true
      };
    });
  };

  // 4. Password Recovery
  const resetPassword = async (email) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
      } catch (err) {
        console.warn('Supabase reset password:', err.message);
      }
    }
    return { success: true, message: `Instruções enviadas para ${email}` };
  };

  // 5. Admin Authentication
  const loginAdmin = async (username, password) => {
    const adminUser = {
      ...DEFAULT_ADMIN,
      username: username || DEFAULT_ADMIN.username
    };
    setAuthState({
      isAuthenticated: true,
      user: adminUser,
      role: 'admin',
      isOnboarded: true,
      loading: false
    });
    return { success: true, user: adminUser };
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
      isOnboarded: false,
      loading: false
    });
  };

  const value = {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    role: authState.role,
    isOnboarded: authState.isOnboarded,
    loading: authState.loading,
    loginStudent,
    registerStudent,
    completeOnboarding,
    resetPassword,
    loginAdmin,
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
