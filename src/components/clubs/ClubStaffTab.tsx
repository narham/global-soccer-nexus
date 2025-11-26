import { StaffTable } from "./StaffTable";

interface ClubStaffTabProps {
  clubId: string;
  staff: any[];
  onRefresh: () => void;
}

export const ClubStaffTab = ({ clubId, staff, onRefresh }: ClubStaffTabProps) => {
  return <StaffTable clubId={clubId} staff={staff} onRefresh={onRefresh} />;
};
