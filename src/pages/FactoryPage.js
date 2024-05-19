import React, { useState } from 'react';
import { ethers,  BrowserProvider } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";
import './FactoryPage.css';
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.js';

import { firestore } from '../components/firebaseConfig.js';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, updateDoc } from 'firebase/firestore';

const projectId = '9513bcef54af049b9471faff11d5a16a';



const sepoliaMainnet = {
    chainId: 11155111,
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io/',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/M87svOeOrOhMsnQWJXB8iQECjn8MJNW0'
};

const metadata = {
  name: 'Vortex',
  description: 'A dapp to create ERC20 tokens on any EVM chain, and get intiial LP without costs. ',
  url: 'https://your-dapp-url.com',
  icons: ['https://your-dapp-url.com/favicon.ico']
};

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  rpcUrl: '...',
  defaultChainId: 1
});

const web3Modal = createWeb3Modal({ ethersConfig, chains: [sepoliaMainnet], projectId, enableAnalytics: true });

const IMGUR_API_URL = "https://api.imgur.com/3/image";
const CLIENT_ID = '7bd162baabe49a2'; // Your Imgur Client ID

const uploadImageToImgur = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
  
    try {
      const response = await fetch(IMGUR_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${CLIENT_ID}`,
          Accept: 'application/json',
        },
        body: formData,
      });
  
      const data = await response.json();
      if (data.success) {
        console.log('Image uploaded to Imgur:', data.data.link);
        return data.data.link; // Returns the URL of the uploaded image
      } else {
        throw new Error('Failed to upload image to Imgur');
      }
    } catch (error) {
      console.error('Error uploading image to Imgur:', error);
      return null;
    }
  };

function FactoryPage() {
    const [contractAddress, setContractAddress] = useState(null);
    const [tokenName, setTokenName] = useState("");
    const [tokenSymbol, setTokenSymbol] = useState("");
    const [tokenSupply, setTokenSupply] = useState("");
    const [tokenImage, setTokenImage] = useState(null);
    const [tokenImageUrl, setTokenImageUrl] = useState(null);
    const { address: connectedWallet, chainId, isConnected } = useWeb3ModalAccount(); // Retrieve client's information
    const { open, close } = useWeb3Modal();
    const [deployedContractAddress, setDeployedContractAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(""); 


   
    async function connectWallet() {
        try {
            open(); // Open the Web3Modal modal
            setError("");
        } catch (error) {
            console.error("Error connecting wallet:", error);
            
        }
    }
    
    async function deployToken(e) {
        e.preventDefault();
    
        if (!isConnected) {
            console.error("Wallet is not connected");
            setError("Please connect wallet before trying to deploy a token.");
            return; // Exits early if the wallet is not connected
        }
    
        setIsLoading(true);
    
        let imageUrl = null;
        if (tokenImage) {
            imageUrl = await uploadImageToImgur(tokenImage); // Try uploading the image
            if (!imageUrl) {
                console.error("Failed to upload image to Imgur");
                setError("Failed to upload image, proceeding without it.");
                // Do not return here; just log the error and continue with deployment
            } else {
                setTokenImageUrl(imageUrl); // Store the image URL in state if upload was successful
            }
        }
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            console.log("Account:", await signer.getAddress()); 
    
            const factoryAddress = "0xEc920653009D228D044cEAF59563b2d41c07eA6F";
            const factoryAbi = MyFactoryJson.abi;
            const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, signer);
        
            // Create transaction data for deploying the contract
            const txResponse = await factoryContract.deployToken(tokenName, tokenSymbol, tokenSupply);
            console.log("Transaction sent: ", txResponse.hash);
        
            // Wait for the transaction to be mined
            const receipt = await txResponse.wait();
            console.log("Block number: ", receipt.blockNumber);
        
            // Accessing logs for emitted events
            const logs = receipt.logs;
            console.log("Logs found: ", logs.length);
        
            if (logs.length > 0) {
                const contractAddress = logs[0].address;
                console.log("Deployed Token Contract Address:", contractAddress);
                setDeployedContractAddress(contractAddress);
    
                const tokensCollection = collection(firestore, 'tokens');
                await setDoc(doc(tokensCollection, contractAddress), {
                    name: tokenName,
                    symbol: tokenSymbol,
                    supply: tokenSupply,
                    address: contractAddress,
                    imageUrl: imageUrl,  // This may be null if the image failed to upload
                    deployer: connectedWallet
                });
                
                console.log("Token data saved to Firestore");
            } else {
                console.error("No logs found in the transaction receipt.");
            }
        } catch (error) {
            console.error("Error during transaction:", error);
            setError("Deployment failed: " + error.message);
        } finally {
            setIsLoading(false); // Ensure loading is turned off whether there's an error or not
        }
    }

    
    return (
        <div>
            <Header connectWallet={connectWallet} />
           <div>
            <h1>Launch your new token without costs. We lend you the liquidity.</h1>
            <h3>Vortex provides liquidity lending to launch tokens, directly on Uniswap.</h3>
           </div>
        <div className="center-container">
             
            <div className="factory-container">
                <h2>Create Your ERC20 Token</h2>
               
                {isConnected && <p className="connected-wallet">Connected Wallet: {connectedWallet}</p>} {/* Display connected wallet address */}
                <form onSubmit={deployToken} className="token-form">

                                     <div className="custom-file-input">
    <span>Add your token image</span>
    <input
        type="file"
        id="tokenImage"
        accept="image/*"
          onChange={(e) => setTokenImage(e.target.files[0])}
        className="input"
    />
    {tokenImage && (
    <div>
  
        <img src={URL.createObjectURL(tokenImage)} alt="Token Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
    </div>
)}
</div>

                    <input
                        type="text"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        placeholder="Token Name"
                        className="input"
                    />
                    <br />
                    <input
                        type="text"
                        value={tokenSymbol}
                        onChange={(e) => setTokenSymbol(e.target.value)}
                        placeholder="Token Symbol"
                        className="input"
                    />
                    <br />
                    <input
                        type="number"
                        value={tokenSupply}
                        onChange={(e) => setTokenSupply(e.target.value)}
                        placeholder="Total Supply"
                        className="input"
                    />
                    
<br />

{!deployedContractAddress && (
            <button type="submit" className="deploy-button">
                {isLoading ? "Loading..." : "Deploy Token"}
            </button>
        )}
                   
                </form>
                {error && <p className="error-message">{error}</p>}
                {deployedContractAddress && (
                <>
                    <p className="token_address_message">Your new token address is: <a href={`https://sepolia.etherscan.io/address/${deployedContractAddress}`} target="_blank">{deployedContractAddress}</a></p>
                    <Link className="start-button" to={`/dashboard/${deployedContractAddress}`}>Go to Dashboard</Link>

                </>
            )}
                           </div>
                            </div></div>
    );
}

export default FactoryPage;