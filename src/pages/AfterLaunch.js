import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { useWeb3Modal, useWeb3ModalAccount } from "@web3modal/ethers/react";
import { ethers } from "ethers";
import LiquidityLockerJson from "../contracts/LiquidityLocker.json";
import MyFactoryJson from "../contracts/MyFactory.json";

const networkConfig = {
  // Example Chain IDs for Base and Sepolia
  8453: {
    // Mainnet (as an example; replace with the correct ID for "base")
    factoryAddress: "0x4301B64C8b4239EfBEb5818F968d1cccf4a640E0", //deprecated - deploy new one one base
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://basescan.org",
    nftAddress: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    lockerAddress: "0x31828AAC589e46549F3980912A6a8001F81a9eD5",
  },
  11155111: {
    // Sepolia Testnet Chain ID
    factoryAddress: "0x1a9EF94197D2b0a39D922dbEe0b87F8c973b85dd",
    lockerAddress: "0x31828AAC589e46549F3980912A6a8001F81a9eD5",
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://sepolia.etherscan.io",
    nftAddress: "0x1238536071E1c677A632429e3655c799b22cDA52",
  },
};

function AfterLaunch() {
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount();

  const { open } = useWeb3Modal();
  const { contractAddress } = useParams();
  const [tokenDetails, setTokenDetails] = useState({
    website: "",
    twitter: "",
    telegram: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deployer, setDeployer] = useState(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const lockerChainAddress =
    networkConfig[chainId]?.lockerAddress || "DefaultLockerAddress";
  const positionManagerChainAddress =
    networkConfig[chainId]?.nftAddress || "DefaultNFTAddress";

  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!contractAddress) return;

      const tokenDocRef = doc(firestore, "tokens", contractAddress);
      const docSnap = await getDoc(tokenDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setTokenDetails(data);
        setIsLoaded(true);
        setDeployer(data.deployer);

        // Assuming you need the tokenId for further processing
        const tokenId = data.tokenId; // Here's where you retrieve the tokenId
        console.log("Token ID:", tokenId); // Log or use the tokenId as needed
      } else {
        console.log("No such document!");
      }
    };

    fetchTokenDetails();
  }, [contractAddress]);

  const connectWallet = async () => {
    try {
      await open();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Ensure URLs do not include www. or any protocol
  const formatWebsite = (url) =>
    url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");

  const formatTwitter = (handle) => {
    // Normalize the URL by removing protocol, www, and correct for repeated domain issues
    const normalized = handle
      .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "") // Remove protocol and www
      .replace(/twitter\.com\//i, "") // Remove twitter.com/
      .replace(/\/+/g, "/") // Replace multiple slashes with a single slash
      .replace(/^x\.com\//i, ""); // Ensure x.com is not prepended more than once

    // Correct if repeated 'x.com/' is part of the input
    const parts = normalized.split("/");
    if (parts[0] === "x.com") {
      // Use the part after the first 'x.com/'
      return `x.com/${parts.slice(1).join("/")}`;
    }

    return `x.com/${normalized}`;
  };

  const formatTelegram = (handle) => {
    // Remove any existing URL parts and standardize to "t.me/user"
    return `t.me/${handle
      .replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i, "")
      .replace(/^t\.me\//i, "")}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "website") formattedValue = formatWebsite(value);
    if (name === "twitter") formattedValue = formatTwitter(value);
    if (name === "telegram") formattedValue = formatTelegram(value);
    setTokenDetails({ ...tokenDetails, [name]: formattedValue });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tokenDoc = doc(firestore, "tokens", contractAddress);
    await updateDoc(tokenDoc, tokenDetails);
    setIsLoading(false);
    window.location.href = "/";
  };

  const lockLiquidity = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const factory = new ethers.Contract(
      factoryChainAddress,
      MyFactoryJson.abi,
      signer
    );
    const locker = new ethers.Contract(
      "0x31828AAC589e46549F3980912A6a8001F81a9eD5",
      LiquidityLockerJson.abi,
      signer
    );

    try {
      // Assume tokenId and nftAddress are fetched or set elsewhere in your component
      console.log("Locker Address:", lockerChainAddress);
      console.log("Chain:", chainId);

      console.log("Approving LiquidityLocker to manage the NFT...");
      const approveTx = await factory.approveNFT(
        positionManagerChainAddress,
        tokenDetails.tokenId, // Assuming the tokenId is stored in state after fetching
        "0x31828AAC589e46549F3980912A6a8001F81a9eD5"
      );
      await approveTx.wait();
      console.log("Approval successful.");

      // Lock the liquidity
      console.log("Locking liquidity...");
      const duration = 3600 * 24 * 7; // Example duration: 1 week in seconds
      const lockLiquidityTx = await locker.lockLiquidity(
        positionManagerChainAddress,
        tokenDetails.tokenId,
        duration,
        factoryChainAddress
      );
      const receipt = await lockLiquidityTx.wait();
      console.log("Liquidity locked.");

      // Optionally, handle the liquidity locked event
      const liquidityLockedEvent = receipt.events.find(
        (event) => event.event === "LiquidityLocked"
      );
      if (liquidityLockedEvent) {
        console.log("Lock ID:", liquidityLockedEvent.args[0]);
      }
    } catch (error) {
      console.error("Failed to lock liquidity:", error);
    }
  };

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />
      <div className="center-container">
        <div className="factory-container">
          <h1>Token Management</h1>
          {isLoaded ? (
            <div>
              <button
                onClick={lockLiquidity}
                disabled={
                  isLoading || !isConnected || connectedWallet !== deployer
                }
              >
                Lock Liquidity
              </button>
            </div>
          ) : (
            <p>Loading token details...</p>
          )}

          <h1>Update your Token Details</h1>

          {isLoaded ? (
            <form onSubmit={handleUpdate} className="token-form">
              <input
                className="input"
                name="website"
                type="text"
                value={tokenDetails.website}
                onChange={handleChange}
                placeholder="Website URL"
              />
              <input
                className="input"
                name="twitter"
                type="text"
                value={tokenDetails.twitter}
                onChange={handleChange}
                placeholder="Twitter URL"
              />
              <input
                className="input"
                name="telegram"
                type="text"
                value={tokenDetails.telegram}
                onChange={handleChange}
                placeholder="Telegram URL"
              />

              <button
                className="deploy-button"
                type="submit"
                disabled={isLoading || connectedWallet !== deployer}
              >
                {isLoading ? "Updating..." : "Update Details"}
              </button>
            </form>
          ) : (
            <p>Loading token details...</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AfterLaunch;
