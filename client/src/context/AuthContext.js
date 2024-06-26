import { createContext, useEffect, useState } from "react";
import { useAccount, usePublicClient, useNetwork } from "wagmi";
import { useEthersSigner } from "../utils/signer.ts";
import { ethers, BigNumber } from "ethers";
import { toast } from "react-hot-toast";
import {
  addDoc,
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, firestore } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  tokenAddress,
  tokenAbi,
  mainContractABI,
  mainContractAddress,
} from "../constants/contract-constant";

const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();
  const { chains, chain } = useNetwork();
  const [activeChain, setActiveChainId] = useState(chain?.id);

  useEffect(() => {
    setActiveChainId(chain?.id);
  }, [chain?.id]);
  const signer = useEthersSigner(activeChain);

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const year = date.getFullYear();
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // Add leading zero for single-digit numbers
    const formattedMonth = month.padStart(2, "0");
    const formattedDay = day.toString().padStart(2, "0");
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    const formattedDate = `${formattedMonth} ${formattedDay}, ${year}`;
    const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

    return `${formattedDate} ${formattedTime}`;
  }
  /**
   *
   * @param {any contract Address} contractAddress
   * @param {any contract Abi} contractAbi
   * @returns contract instance
   * @dev This function is used to get the contract instance
   */
  const getContractInstance = async (contractAddress, contractAbi) => {
    try {
      let contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );
      return contractInstance;
    } catch (error) {
      console.log("Error in deploying contract");
    }
  };

  const getTokenDetails = async () => {
    try {
      const degoTokenContract = await getContractInstance(
        tokenAddress,
        tokenAbi
      );
      const degoTokenBalance = await degoTokenContract.balanceOf(address);
      const decimals = await degoTokenContract.decimals();
      const name = await degoTokenContract.name();
      const symbol = await degoTokenContract.symbol();

      return {
        balance: BigNumber.from(degoTokenBalance)
          .div(BigNumber.from(10).pow(decimals))
          .toString(),
        decimals,
        name,
        symbol,
      };
    } catch (error) {
      console.log(error);
    }
  };

  const depositFunds = async (amount, postId) => {
    try {
      let approveId = toast.loading("Approving transaction...");
      const degoTokenContract = await getContractInstance(
        tokenAddress,
        tokenAbi
      );
      //make amount as per decimals
      amount = BigNumber.from(amount).mul(
        BigNumber.from(10).pow(await degoTokenContract.decimals())
      );
      const approvetx = await degoTokenContract.approve(
        mainContractAddress,
        amount,
        { from: address }
      );

      await approvetx.wait();

      toast.success("Limit Approved", { id: approveId });

      const contractInstance = await getContractInstance(
        mainContractAddress,
        mainContractABI
      );

      let txId = toast.loading("Depositing funds to this Content...");
      const tx = await contractInstance.depositFunds(amount, postId, {
        from: address,
      });
      await tx.wait();
      toast.success("Funds Deposited", { id: txId });

      return tx;
    } catch (error) {
      console.log(error);
      toast.error("Error in depositing funds");
    }
  };

  async function sellYourFunds(
    _postId,
    _depositID,
    _amount,
    _likes,
    _views,
    _shares,
    _followers
  ) {
    try {
      const contractInstance = await getContractInstance(
        mainContractAddress,
        mainContractABI
      );
      let txId = toast.loading("Selling your funds...");
      const tx = await contractInstance.sellFunds(
        _postId,
        _depositID,
        _amount,
        _likes,
        _views,
        _shares,
        _followers,
        {
          from: address,
        }
      );
      await tx.wait();
      toast.success("Funds Sold", { id: txId });
      return tx;
    } catch (error) {
      console.log(error);
      toast.error("Error in selling funds");
    }
  }

  const getYourDeposits = async () => {
    try {
      const contractInstance = await getContractInstance(
        mainContractAddress,
        mainContractABI
      );
      const deposits = await contractInstance.getUserDeposits(address);
      let investArray = [];
      let investedAmount = 0;
      let postId = +deposits[0].postId;
      for (let i = 0; i < deposits.length; i++) {
        let initial = +BigNumber.from(deposits[i]?.amount).div(
          BigNumber.from(10).pow(18)
        );

        investedAmount += initial;

        investArray.push({
          postId: +deposits[i].postId,
          amount: initial,
          startDate: formatTimestamp(+deposits[i].startDate)
            .toString()
            .slice(0, 15),
        });
      }
      return { investedAmount, postId, investArray };
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (!signer) return;
  }, [signer, address]);
  useEffect(() => {
    const getUser = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userRef = await getDoc(doc(firestore, `user/${user?.uid}`));
          setUser({
            ...user,
            displayName: userRef.data()?.fullName || null,
            photoURL: userRef.data()?.photoURL || null,
            username: userRef.data().username || null,
            isVerified: userRef.data().isVerified || false,
          });
          setLoading(false);
        }
        if (!user) {
          setUser(null);
          setLoading(false);
        }
      });
    };
    return getUser();
  }, []);
  const login = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await setDoc(
        doc(firestore, "user", `${user?.uid}`),
        {
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );
      setUser(user);
      return user;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const signUp = async (email, password, username, fullname) => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
        (user) => {
          console.log(user);
        }
      );
      await setDoc(
        doc(firestore, "user/bZdyCDBdUjgxFxhXLRBGzQh05k12"),
        {
          followedBy: arrayUnion(user.uid),
        },
        {
          merge: true,
        }
      );
      await setDoc(doc(firestore, "user", `${user?.uid}`), {
        userId: user?.uid,
        biography: "Hey there! I am new in this SocioTrade.",
        categoryName: "Admin User",
        following: ["bZdyCDBdUjgxFxhXLRBGzQh05k12"],
        fullName: fullname,
        photoURL:
          "https://parkridgevet.com.au/wp-content/uploads/2020/11/Profile-300x300.png",
        email: user?.email,
        isVerified: false,
        username: username,
        lastLogin: serverTimestamp(),
      });
      return user;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const logout = async () => {
    console.log("Logout");
    signOut(auth);
    setUser(null);
    return user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signUp,
        getTokenDetails,
        depositFunds,
        sellYourFunds,
        getYourDeposits,
      }}
    >
      {loading || children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
