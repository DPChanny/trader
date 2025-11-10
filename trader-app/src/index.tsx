import { render } from "preact";
import { QueryClientProvider } from "@tanstack/react-query";
import "@/styles/global.css";
import { App } from "./app.tsx";
import { queryClient } from "./lib/queryClient.ts";

render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById("app")!
);
