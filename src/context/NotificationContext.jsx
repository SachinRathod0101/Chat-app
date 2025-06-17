import React, { createContext, useState, useCallback } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, notification }}>
      {children}
    </NotificationContext.Provider>
  );
};