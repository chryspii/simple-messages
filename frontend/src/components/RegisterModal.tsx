import { useState } from "react";
import { Modal } from "./Modal";
import AuthService from "../services/AuthService";

export function RegisterModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    try {
      await AuthService.register(username, email, password, confirm);
      onClose();
      alert("Registered successfully. Please login.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal title="Register" onClose={onClose}>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <input className="border p-2 w-full mb-2" placeholder="Username"
        value={username} onChange={e => setUsername(e.target.value)} />

      <input className="border p-2 w-full mb-2" placeholder="Email"
        value={email} onChange={e => setEmail(e.target.value)} />

      <input type="password" className="border p-2 w-full mb-2"
        placeholder="Password"
        value={password} onChange={e => setPassword(e.target.value)} />

      <input type="password" className="border p-2 w-full mb-4"
        placeholder="Confirm Password"
        value={confirm} onChange={e => setConfirm(e.target.value)} />

      <button
        onClick={submit}
        className="bg-green-600 text-white w-full py-2 rounded"
      >
        Register
      </button>
    </Modal>
  );
}
