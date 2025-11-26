import { DocumentsTable } from "./DocumentsTable";

interface ClubDocumentsTabProps {
  clubId: string;
  documents: any[];
  onRefresh: () => void;
}

export const ClubDocumentsTab = ({ clubId, documents, onRefresh }: ClubDocumentsTabProps) => {
  return <DocumentsTable clubId={clubId} documents={documents} onRefresh={onRefresh} />;
};
