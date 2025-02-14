import { Playground } from "@/components/canvas/playground/Playground";
import { getQuotes } from "@/data/quote";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function IndexPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["quotes"],
    queryFn: getQuotes,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Playground />
    </HydrationBoundary>
  );
}
