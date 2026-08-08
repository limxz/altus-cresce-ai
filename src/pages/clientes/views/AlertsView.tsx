import { usePortal } from "../ClientPortal";
import NotificationsModule from "@/components/clientes/hub/NotificationsModule";
import { Skeleton } from "@/components/admin/os/Primitives";

const AlertsView = () => {
  const { data, markNotificationRead, markAllRead, go } = usePortal();
  if (!data) return <Skeleton className="h-[320px] !rounded-2xl" />;
  return (
    <NotificationsModule
      data={data}
      onRead={markNotificationRead}
      onReadAll={markAllRead}
      onNavigate={(m: string) => go(m === "inicio" ? "" : m)}
    />
  );
};

export default AlertsView;
