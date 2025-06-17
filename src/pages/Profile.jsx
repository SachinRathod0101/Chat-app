import React, { useState } from "react";
import AddPost from "./AddPost";
import BottomNavbar from "./BottomNavbar";
// import PostList from "./PostList"; // Make sure you have this
import Data from "./Data"; // Import Dada component

const App = () => {
  const [posts, setPosts] = useState([]);

  const addPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="App" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#fce4ec" }}>
      {/* Left Side - Dada */}
      <div style={{ width: "25%", borderRight: "1px solid #ccc", backgroundColor: "#fff0f6" }}>
        <Data />
      </div>

      {/* Right Side - Main Content */}
      <div style={{ width: "75%", padding: "20px" }}>
        <AddPost addPost={addPost} />
        {/* <PostList posts={posts} /> */}
        <BottomNavbar posts={posts} />
      </div>
    </div>
  );
};

export default App;
