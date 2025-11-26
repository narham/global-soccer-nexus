import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClubDocumentsTab } from "@/components/clubs/ClubDocumentsTab";
import { toast } from "sonner";

const ClubDocumentsPage = () => {
  const { id } = useParams();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("club_documents")
        .select("*")
        .eq("club_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocuments();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <ClubDocumentsTab clubId={id!} documents={documents} onRefresh={fetchDocuments} />;
};

export default ClubDocumentsPage;
