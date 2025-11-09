import { render } from "preact";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { App } from "./app.tsx";
import { queryClient } from "./lib/queryClient";

render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById("app")!
);
