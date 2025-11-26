import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClubStaffTab } from "@/components/clubs/ClubStaffTab";
import { toast } from "sonner";

const ClubStaffPage = () => {
  const { id } = useParams();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("club_staff")
        .select("*")
        .eq("club_id", id)
        .order("role", { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStaff();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <ClubStaffTab clubId={id!} staff={staff} onRefresh={fetchStaff} />;
};

export default ClubStaffPage;
