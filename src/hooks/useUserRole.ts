import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserRoleData {
  role: string | null;
  clubId: string | null;
  isAdminFederasi: boolean;
  isAdminKlub: boolean;
  isPanitia: boolean;
  isWasit: boolean;
  loading: boolean;
}

export function useUserRole(): UserRoleData {
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: null,
    clubId: null,
    isAdminFederasi: false,
    isAdminKlub: false,
    isPanitia: false,
    isWasit: false,
    loading: true,
  });

  useEffect(() => {
    const fetchUserRole = async (userId: string | null) => {
      if (!userId) {
        setRoleData({
          role: null,
          clubId: null,
          isAdminFederasi: false,
          isAdminKlub: false,
          isPanitia: false,
          isWasit: false,
          loading: false,
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role, club_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRoleData({
            role: null,
            clubId: null,
            isAdminFederasi: false,
            isAdminKlub: false,
            isPanitia: false,
            isWasit: false,
            loading: false,
          });
          return;
        }

        setRoleData({
          role: data?.role || null,
          clubId: data?.club_id || null,
          isAdminFederasi: data?.role === "admin_federasi",
          isAdminKlub: data?.role === "admin_klub",
          isPanitia: data?.role === "panitia",
          isWasit: data?.role === "wasit",
          loading: false,
        });
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        setRoleData({
          role: null,
          clubId: null,
          isAdminFederasi: false,
          isAdminKlub: false,
          isPanitia: false,
          isWasit: false,
          loading: false,
        });
      }
    };

    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserRole(user?.id || null);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      fetchUserRole(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return roleData;
}
