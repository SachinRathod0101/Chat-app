import React from 'react';
import BottomNavbar from '../pages/BottomNavbar'; // Import your BottomNavbar component

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">{children}</main>
      <BottomNavbar /> {/* This will always appear at the bottom */}
    </div>
  );
};

export default Layout;
