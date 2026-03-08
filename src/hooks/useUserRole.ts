import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserRoleData {
  role: string | null;
  roles: string[];
  clubId: string | null;
  clubIds: string[];
  isAdminFederasi: boolean;
  isAdminKlub: boolean;
  isPanitia: boolean;
  isWasit: boolean;
  loading: boolean;
}

export function useUserRole(): UserRoleData {
  const [roleData, setRoleData] = useState<UserRoleData>({
    role: null,
    roles: [],
    clubId: null,
    clubIds: [],
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
          roles: [],
          clubId: null,
          clubIds: [],
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
          .eq("user_id", userId);

        if (error) {
          console.error("Error fetching user role:", error);
          setRoleData({
            role: null,
            roles: [],
            clubId: null,
            clubIds: [],
            isAdminFederasi: false,
            isAdminKlub: false,
            isPanitia: false,
            isWasit: false,
            loading: false,
          });
          return;
        }

        const roles = data?.map((r) => r.role) || [];
        const clubIds = data?.filter((r) => r.club_id).map((r) => r.club_id as string) || [];

        // Primary role = first role (for backward compatibility)
        const primaryRole = roles.length > 0 ? roles[0] : null;
        const primaryClubId = clubIds.length > 0 ? clubIds[0] : null;

        setRoleData({
          role: primaryRole,
          roles,
          clubId: primaryClubId,
          clubIds,
          isAdminFederasi: roles.includes("admin_federasi"),
          isAdminKlub: roles.includes("admin_klub"),
          isPanitia: roles.includes("panitia"),
          isWasit: roles.includes("wasit"),
          loading: false,
        });
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        setRoleData({
          role: null,
          roles: [],
          clubId: null,
          clubIds: [],
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
