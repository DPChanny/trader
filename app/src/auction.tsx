import { render } from "preact";
import { AuctionPage } from "./pages/auction/auctionPage";
import "@/styles/app.css";

render(<AuctionPage />, document.getElementById("app")!);
