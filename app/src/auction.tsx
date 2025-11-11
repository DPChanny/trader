import { render } from "preact";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuctionPage } from "@/pages/auction/auctionPage";
import "@/styles/app.css";
import "@/styles/global.css";

render(
  <QueryClientProvider client={queryClient}>
    <AuctionPage />
  </QueryClientProvider>,
  document.getElementById("app")!
);
