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
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
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

        const { data, error } = await supabase
          .from("user_roles")
          .select("role, club_id")
          .eq("user_id", user.id)
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

    fetchUserRole();
  }, []);

  return roleData;
}
