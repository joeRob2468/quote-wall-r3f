import { Playground } from "@/components/canvas/playground/Playground";
import { Preloader } from "@/components/preloader";
import { QUOTE_PARAM } from "@/config/site";
import { getQuote, getQuotes } from "@/data/quote";
import { FullQuote } from "@/types/quote";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Metadata } from "next";

interface IndexPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const quoteIdFrom = (searchParams: IndexPageProps["searchParams"]) => {
  const id = searchParams[QUOTE_PARAM];
  return typeof id === "string" ? id : undefined;
};

// A shared link previews the quote it points at
export async function generateMetadata({
  searchParams,
}: IndexPageProps): Promise<Metadata> {
  const id = quoteIdFrom(searchParams);
  const quote = id ? await getQuote(id) : null;
  if (!quote) return {};

  const title = quote.author.name;
  const description = `“${quote.body}”`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function IndexPage({ searchParams }: IndexPageProps) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["quotes"],
    queryFn: getQuotes,
  });

  const quoteId = quoteIdFrom(searchParams);
  const quotes = queryClient.getQueryData<FullQuote[]>(["quotes"]) ?? [];
  const quoteIndex = quotes.findIndex((quote) => quote.id === quoteId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Preloader
        quoteCount={quotes.length}
        seekIndex={quoteIndex >= 0 ? quoteIndex : undefined}
      />
      <Playground initialQuoteId={quoteId} />
    </HydrationBoundary>
  );
}
