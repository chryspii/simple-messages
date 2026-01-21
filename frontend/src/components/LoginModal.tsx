import { useState } from "react";
import { Modal } from "./Modal";
import AuthService from "../services/AuthService";

export function LoginModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    try {
      await AuthService.login(email, password);
      onSuccess();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal title="Login" onClose={onClose}>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <input
        className="border p-2 w-full mb-2"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="border p-2 w-full mb-4"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button
        onClick={submit}
        className="bg-blue-600 text-white w-full py-2 rounded"
      >
        Login
      </button>
    </Modal>
  );
}
