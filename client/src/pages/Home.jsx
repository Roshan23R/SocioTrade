import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
// import { motion } from "framer-motion";
import React, { useContext, useEffect, useState } from "react";
import { firestore } from "../firebase/config";

import Header from "../components/Header";

import HomePostCard from "../components/HomePostCard";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Stories from "../components/Stories";
import Footer from "../components/Footer";
import { FakeUsers } from "../constants/fakeData";
import { Toaster,toast } from "react-hot-toast";
const Home = () => {
  const { user } = useContext(AuthContext);
  const [suggestUsers, setSuggestUsers] = useState();
  const [posts, setposts] = useState([]);
  const [limitNum, setLimitNum] = useState(9);
  const [userProfile, setUserProfile] = useState(null);
  useEffect(() => {
    const getData = async () => {
      const q = query(
        collection(firestore, "posts"),
        orderBy("createdAt", "desc"),
        limit(limitNum)
      );
      onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs?.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setposts(posts);
        // console.log(posts);
      });
    };
    return getData();
  }, [limitNum]);
  useEffect(() => {
    const suggestUsers = async () => {
      const q = query(
        collection(firestore, "user"),
        orderBy("lastLogin", "desc")
      );
      onSnapshot(q, (snapshot) => {
        const users = snapshot.docs?.map((doc) => ({
          ...doc.data(),
          id: doc?.id,
        }));
        setSuggestUsers(users.filter((i) => i.id !== user.uid)?.slice(0, 8));
      });
    };
    return suggestUsers();
  }, []);
  useEffect(() => {
    const getData = async () => {
      const userData = await getDoc(doc(firestore, `/user/${user?.uid}`));
      setUserProfile(userData.data());
    };
    getData();
  }, []);
  return (
    <>
      <Header />
      <div className="flex md:mt-14  max-w-5xl gap-x-15 mx-auto mb-8">
      <Toaster position="bottom-right" />
        <div id="feed" className="w-full md:w-[70%] overflow-auto justify-center">
          <Stories />
        
          <div className=" border-gray-200 rounded-md shadow-white"> 
            {posts?.map((post) => (
              <HomePostCard post={post} key={post?.id} />
            ))}
          </div>
          {posts?.length === 0 && (
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">No posts yet</div>
            </div>
          )}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setLimitNum(limitNum + 9)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Load More
            </button>
          </div>
        </div>
        <div
          id="sidebar"
          className="hidden w-[30%] md:mt-7 md:block md:w-[20%] pr-20 fixed right-0 top-14"
        >
          <div className="flex items-center justify-between w-full gap-2">
            <div>
              <img
                src={userProfile?.photoURL}
                className="h-14 w-15 aspect-square object-cover rounded-full"
                alt={userProfile?.fullName}
              />
            </div>
            <div className="flex-grow">
              <Link
                to={`/${userProfile?.username}`}
                className="text-sm font-semibold text-white hover:text-lg"
              >
                {userProfile?.username}
              </Link>
              <p className="text-gray-500 text-base">{userProfile?.fullName}</p>
            </div>
            <div className="text-sm font-bold text-blue-500">Switch</div>
          </div>
          <div>
            <div className="flex text-sm items-center my-2 justify-between">
              <div className="text-white font-semibold">
                Suggestions For You
              </div>
              <button className="text-white font-bold">See All</button>
            </div>
          </div>
          <div>
            {suggestUsers?.slice(1, 10).map((item, index) => (
              <div
                className="flex items-center justify-between my-2"
                key={index}
              >
                <div className="flex gap-4 items-center">
                  <Link to={`/${item?.username}`}>
                    <img
                      src={item?.photoURL}
                      className="h-7 w-7 aspect-square object-cover rounded-full"
                      alt={item?.username}
                    />
                  </Link>
                  <div>
                    <Link
                      to={`/${item?.username}`}
                      className="text-sm font-semibold text-white"
                    >
                      {item?.username}
                    </Link>
                    <p className="text-[10px] text-gray-400">{item.fullName}</p>
                  </div>
                </div>
                <Link
                  to={`/${item?.username}`}
                  className="text-xs font-bold text-blue-500"
                >
                  Follow
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
