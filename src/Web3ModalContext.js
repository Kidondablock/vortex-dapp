import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { createWeb3Modal, useWeb3ModalAccount } from "@web3modal/ethers/react";

const Web3ModalContext = createContext();

export const Web3ModalProvider = ({ children }) => {
  const [web3Modal, setWeb3Modal] = useState(null);
  const { address, chainId, isConnected, connect, disconnect } =
    useWeb3ModalAccount(web3Modal);

  useEffect(() => {
    const config = {
      metadata: {
        name: "Vortex Dapp",
        description: "An EVM liquidity lender and token launcher",
        url: "https://vortexdapp.com",
        icons: ["https://vortexdapp.com/favicon.ico"],
      },
      enableEIP6963: true, //metamask
      enableInjected: true, //metamask
      enableCoinbase: false, //coinbase
      rpcUrl:
        "https://eth-sepolia.g.alchemy.com/v2/M87svOeOrOhMsnQWJXB8iQECjn8MJNW0", // Ensure this matches your FactoryPage configuration
      defaultChainId: 1,
    };

    const sepoliaMainnet = {
      chainId: 11155111,
      name: "Sepolia",
      currency: "ETH",
      explorerUrl: "https://sepolia.etherscan.io/",
    };

    const projectId = process.env.WALLETCONNECT_PROJECT_ID;

    const initWeb3Modal = createWeb3Modal({
      config,
      chains: [sepoliaMainnet],
      projectId,
      enableAnalytics: true,
      explorerExcludedWalletIds: [
        "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa",
      ],
    });

    setWeb3Modal(initWeb3Modal);
  }, []);

  return (
    <Web3ModalContext.Provider
      value={{ address, chainId, isConnected, connect, disconnect }}
    >
      {children}
    </Web3ModalContext.Provider>
  );
};

export const useCustomWeb3Modal = () => useContext(Web3ModalContext);
