import { useOutletContext } from "react-router-dom";
import { ClubInfoTab } from "@/components/clubs/ClubInfoTab";

const ClubInfoPage = () => {
  const { club } = useOutletContext<{ club: any }>();

  return <ClubInfoTab club={club} />;
};

export default ClubInfoPage;
