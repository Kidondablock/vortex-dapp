// App.js

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StakingPage from "./pages/StakingPage";
import DashboardPage from "./pages/Dashboard";
import RecentlyLaunched from "./pages/RecentlyLaunched";
import FactoryPage from "./pages/FactoryPage";
import AfterLaunch from "./pages/AfterLaunch";
import TokensPage from "./pages/TokenListPage";
import TokenMobPage from "./pages/TokenMobPage";

import TokenBuyTrackerPage from "./pages/TokenBuyTrackerPage";
import Trading from "./pages/Trading";
import { Web3ModalProvider } from "./Web3ModalContext";

function App() {
  return (
    <Web3ModalProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/factory" element={<FactoryPage />} />
          <Route
            path="/dashboard/:contractAddress"
            element={<DashboardPage />}
          />
          <Route path="/recently" element={<RecentlyLaunched />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/tokenmob" element={<TokenMobPage />} />
          <Route path="/tracker" element={<TokenBuyTrackerPage />} />
          <Route path="/token/:contractAddress" element={<AfterLaunch />} />
          <Route
            path="/trading/:chain/:contractAddress"
            element={<Trading />}
          />
          <Route path="/staking" element={<StakingPage />} />
        </Routes>
      </Router>
    </Web3ModalProvider>
  );
}
export default App;
