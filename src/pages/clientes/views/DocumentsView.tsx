import { usePortal } from "../ClientPortal";
import DocumentsModule from "@/components/clientes/hub/DocumentsModule";
import { Skeleton } from "@/components/admin/os/Primitives";

const DocumentsView = () => {
  const { data, session } = usePortal();
  if (!data) return <Skeleton className="h-[320px] !rounded-2xl" />;
  return <DocumentsModule data={data} session={session} />;
};

export default DocumentsView;
