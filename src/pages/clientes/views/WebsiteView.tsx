import { usePortal } from "../ClientPortal";
import WebsiteModule from "@/components/clientes/hub/WebsiteModule";
import { Skeleton } from "@/components/admin/os/Primitives";

const WebsiteView = () => {
  const { data } = usePortal();
  if (!data) return <Skeleton className="h-[320px] !rounded-2xl" />;
  return <WebsiteModule data={data} />;
};

export default WebsiteView;
