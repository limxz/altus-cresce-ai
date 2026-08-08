import { usePortal } from "../ClientPortal";
import MeetingsModule from "@/components/clientes/hub/MeetingsModule";
import { Skeleton } from "@/components/admin/os/Primitives";

const MeetingsView = () => {
  const { data } = usePortal();
  if (!data) return <Skeleton className="h-[320px] !rounded-2xl" />;
  return <MeetingsModule data={data} />;
};

export default MeetingsView;
