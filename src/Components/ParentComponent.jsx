const ParentComponent = () => {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSelect = (user) => {
    console.log("Selected user:", user);
    setSelectedUser(user);
  };

  return (
    <div>
      {/* User list to select a user */}
      <UserList onSelect={handleUserSelect} />
      {selectedUser && <ChatWindow selectedUser={selectedUser} />}
    </div>
  );
};