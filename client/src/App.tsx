import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Player from "./pages/Player";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/player" component={Player} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() { return <ErrorBoundary><TooltipProvider><Toaster /><Router /></TooltipProvider></ErrorBoundary>; }
