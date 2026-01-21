import { useEffect, useRef, useState } from "react";
import { HealthTag } from "./components/HealthTag";

type Message = {
  _id: string;
  name: string;
  subject: string;
  message: string;
  status: "queued" | "retrying" | "stored" | "failed";
  retries: number;
};

type Health = {
  mongo: boolean;
  redis: boolean;
  rabbitmq: boolean;
};

const isDev = import.meta.env.DEV;

const API = isDev ? '' : '/api';
const WS = location.protocol === "https:" ? `wss://${location.host}/ws` : `ws://${location.host}/ws`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [dlq, setDlq] = useState<Message[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    message: ""
  });
  const wsRef = useRef<WebSocket | null>(null);

  const fetchMessages = async () => {
    const res = await fetch(`${API}/messages`);
    const data = await res.json();
    setMessages(data)
  }

  const fetchDLQ = async () => {
    const res = await fetch(`${API}/dlq`);
    const data = await res.json();
    setDlq(data);
  };

  const connectWebSocket = async () => {
    let ws: WebSocket;
    let retry: number;

    const connect = () => {
      ws = new WebSocket(WS);
      wsRef.current = ws;

      ws.onmessage = e => {
        const d = JSON.parse(e.data);
        setMessages(prev => {
          if (d.type === "MESSAGE_DELETED")
            return prev.filter(m => m._id !== d.id);

          if (["MESSAGE_STORED","MESSAGE_RETRY","MESSAGE_FAILED"].includes(d.type))
            return prev.map(m =>
              m._id === d.id
                ? { ...m, status: d.type === "MESSAGE_STORED" ? "stored" : d.type === "MESSAGE_FAILED" ? "failed" : "retrying" }
                : m
            );

          return prev;
        });
      };

      ws.onclose = () => {
        retry = window.setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      clearTimeout(retry);
      ws?.close();
    };
  }

  const fetchHealth = async () => {
    try {
      const res = await fetch("/health/deep");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    }
  }

  useEffect(() => {
    fetchMessages();
    // fetchDLQ();
    fetchHealth();

    connectWebSocket();
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);

    return () => clearInterval(interval);
  }, []);

  const submit = async () => {
    const res = await fetch(`${API}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const msg = await res.json();
    setMessages(prev => [msg, ...prev]);
    setForm({ name: "", subject: "", message: "" });
  };

  const del = async (id: string) => {
    await fetch(`${API}/messages/${id}`, { method: "DELETE" });
    setMessages(prev => prev.filter(m => m._id !== id));
  };

  const reprocess = async (id: string) => {
    await fetch(`${API}/dlq/${id}/reprocess`, {
      method: "POST"
    });

    fetchDLQ();
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "queued":
        return "bg-gray-200 text-gray-800";
      case "retrying":
        return "bg-yellow-200 text-yellow-800 animate-pulse";
      case "stored":
        return "bg-green-200 text-green-800";
      case "failed":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-100";
    }
  };

  const allHealthy = health?.mongo && health?.redis && health?.rabbitmq;
  const toHealthStatus = (value?: boolean): "healthy" | "unhealthy" | "unknown" => {
    if (value === true) return "healthy";
    if (value === false) return "unhealthy";
    return "unknown";
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Message Queue Demo</h1>

      <div className="flex gap-2 mb-4">
        <HealthTag label="MongoDB" status={toHealthStatus(health?.mongo)} />
        <HealthTag label="Redis" status={toHealthStatus(health?.redis)} />
        <HealthTag label="RabbitMQ" status={toHealthStatus(health?.rabbitmq)} />
      </div>

      <div className="bg-white p-6 rounded shadow mb-8 space-y-4">
        <input className="border p-2 w-full" placeholder="Name"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2 w-full" placeholder="Subject"
          value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
        <textarea className="border p-2 w-full" placeholder="Message"
          value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />

        <button
          disabled={!allHealthy}
          className={`px-4 py-2 rounded ${
            allHealthy ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={submit}
        >
          Send Message
        </button>
      </div>

      <h3>Messages</h3>
      {messages.map(m => (
        <div key={m._id} className="bg-white p-4 rounded shadow mb-3">
          <div className="flex justify-between">
            <b>{m.subject}</b>
            <div className="flex gap-2">
              <span
                className={`px-2 py-1 text-xs rounded font-semibold ${statusStyle(m.status)}`}
              >
                {m.status.toUpperCase()}
              </span>
              
              {m.status === "failed" && (
                <button
                  onClick={() => reprocess(m._id)}
                  className="bg-blue-600 text-white px-2 py-1 text-xs rounded font-semibold hover:bg-blue-700"
                >
                  Reprocess
                </button>
              )}
              
              <button
                onClick={() => del(m._id)}
                className={`text-xs text-red-600 hover:underline`}
              >
                Delete
              </button>
            </div>
          </div>
          <p>{m.message}</p>
          <small className="text-gray-500">From {m.name}</small>
        </div>
      ))}
    </div>
  );
}
