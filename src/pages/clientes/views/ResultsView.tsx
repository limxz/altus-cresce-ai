import { usePortal } from "../ClientPortal";
import ResultsModule from "@/components/clientes/hub/ResultsModule";
import { Skeleton } from "@/components/admin/os/Primitives";

const ResultsView = () => {
  const { data } = usePortal();
  if (!data) return <Skeleton className="h-[320px] !rounded-2xl" />;
  return <ResultsModule data={data} />;
};

export default ResultsView;
