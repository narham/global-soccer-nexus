import { useParams } from "react-router-dom";
import { ClubMatchesTab } from "@/components/clubs/ClubMatchesTab";

const ClubMatchesPage = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pertandingan</h2>
        <p className="text-muted-foreground">Daftar semua pertandingan klub</p>
      </div>
      <ClubMatchesTab clubId={id!} />
    </div>
  );
};

export default ClubMatchesPage;
