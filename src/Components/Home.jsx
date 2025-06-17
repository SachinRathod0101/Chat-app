import React, { useEffect, useState } from 'react';

const Home = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const storedPosts = JSON.parse(localStorage.getItem('posts')) || [];
    setPosts(storedPosts);
  }, []);

  return (
    <div className="min-h-screen bg-pink-50 p-4 space-y-6 max-w-md mx-auto pb-20">
      <h2 className="text-2xl font-bold text-center text-pink-800">📸 Posts Feed</h2>

      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden">
          <img src={post.image} alt="Post" className="w-full h-60 object-cover" />
          <div className="p-4 text-gray-700">
            <p>{post.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;