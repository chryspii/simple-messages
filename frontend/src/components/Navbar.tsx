type Props = {
  user: { username: string } | null;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
};

export function Navbar({ user, onLogin, onRegister, onLogout }: Props) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-white">
      <h1 className="text-lg font-bold">Message App</h1>

      {!user ? (
        <div className="space-x-2">
          <button
            onClick={onLogin}
            className="px-3 py-1 border rounded"
          >
            Login
          </button>
          <button
            onClick={onRegister}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Register
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm">
            Hello, <b>{user.username}</b>
          </span>
          <button
            onClick={onLogout}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
