import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import { AuthProvider } from "./context/AuthContext";
import { AnimatePresence } from "framer-motion";
import "./index.css";
import { WagmiConfig } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig, chains } from "./utils/wallet-utils";


ReactDOM.render(
  <AuthProvider>
    <AnimatePresence>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
      <App />
      </RainbowKitProvider>
      </WagmiConfig>
    </AnimatePresence>
  </AuthProvider>,
  document.getElementById("root")
);
