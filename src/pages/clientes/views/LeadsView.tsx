import { usePortal } from "../ClientPortal";
import LeadsModule from "@/components/clientes/hub/LeadsModule";
import { Skeleton } from "@/components/admin/os/Primitives";

const LeadsView = () => {
  const { data } = usePortal();
  if (!data) return <Skeleton className="h-[320px] !rounded-2xl" />;
  return <LeadsModule data={data} />;
};

export default LeadsView;
