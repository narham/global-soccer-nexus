import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { generatePlayerIDCard, PlayerCardData } from "@/lib/player-card-generator";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PlayerCardButtonProps {
  player: any;
  clubName: string;
  clubLogo?: string;
}

export function PlayerCardButton({ player, clubName, clubLogo }: PlayerCardButtonProps) {
  const handleGenerateCard = async () => {
    try {
      const cardData: PlayerCardData = {
        fullName: player.full_name,
        dateOfBirth: format(new Date(player.date_of_birth), "dd MMMM yyyy", { locale: id }),
        nationality: player.nationality,
        position: player.position,
        clubName: clubName,
        clubLogo: clubLogo,
        photoUrl: player.photo_url,
        shirtNumber: player.shirt_number,
        cardNumber: `PID-${player.id.substring(0, 8).toUpperCase()}`,
        validUntil: player.contract_end 
          ? format(new Date(player.contract_end), "dd MMMM yyyy", { locale: id })
          : "Tidak Terbatas",
      };

      await generatePlayerIDCard(cardData);
      toast.success("Kartu identitas pemain berhasil digenerate");
    } catch (error: any) {
      toast.error("Gagal generate kartu: " + error.message);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleGenerateCard}>
      <CreditCard className="mr-2 h-4 w-4" />
      Cetak Kartu ID
    </Button>
  );
}
