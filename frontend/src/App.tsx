import { useEffect, useRef, useState } from "react";
import { HealthTag } from "./components/HealthTag";
import AuthService from "./services/AuthService";
import { LoginModal } from "./components/LoginModal";
import { RegisterModal } from "./components/RegisterModal";
import { Navbar } from "./components/Navbar";

const isDev = import.meta.env.DEV;
const API = isDev ? '' : '/api';
const WS = location.protocol === "https:" ? `wss://${location.host}/ws` : `ws://${location.host}/ws`;

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

export default function App() {
  const [user, setUser] = useState(AuthService.getUser());

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const isLoggedIn = Boolean(user);

  const [dlq, setDlq] = useState<Message[]>([]);
  
  const [health, setHealth] = useState<Health | null>(null);

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

  function logout() {
    AuthService.logout();
    setUser(null);
  }

  useEffect(() => {
    connectWebSocket();
    fetchMessages();
    // fetchDLQ();
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const submit = async () => {
    if (!isLoggedIn) return;

    const res = await fetch(`${API}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AuthService.getToken()}`
      },
      body: JSON.stringify({
        name: user!.username,
        subject,
        message
      })
    });

    const msg = await res.json();
    setMessages(prev => [msg, ...prev]);
    
    setSubject("");
    setMessage("");
  };

  const del = async (id: string) => {
    const res = await fetch(`${API}/messages/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${AuthService.getToken()}`
      }
    });

    const msg = await res.json();
    if (msg.success) {
      setMessages(prev => prev.filter(m => m._id !== id));
    }
  };

  const reprocess = async (id: string) => {
    const res = await fetch(`${API}/dlq/${id}/reprocess`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AuthService.getToken()}`
      }
    });

    const msg = await res.json();
    if (msg.success) {
      fetchDLQ();
    }
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
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={user}
        onLogin={() => setShowLogin(true)}
        onRegister={() => setShowRegister(true)}
        onLogout={logout}
      />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-4">
          <HealthTag label="MongoDB" status={toHealthStatus(health?.mongo)} />
          <HealthTag label="Redis" status={toHealthStatus(health?.redis)} />
          <HealthTag label="RabbitMQ" status={toHealthStatus(health?.rabbitmq)} />
        </div>

        <div className="bg-white p-6 rounded shadow mb-8 space-y-4">
          <input
            disabled={!isLoggedIn}
            className="border p-2 w-full"
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
          <textarea
            disabled={!isLoggedIn}
            className="border p-2 w-full"
            placeholder="Message"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />

          <button
            disabled={!allHealthy || !isLoggedIn}
            className={`px-4 py-2 rounded ${
              (allHealthy && isLoggedIn) ? "bg-green-500 text-white" : "bg-gray-400 text-white cursor-not-allowed"
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
                    disabled={!isLoggedIn}
                    onClick={() => reprocess(m._id)}
                    className={`text-white px-2 py-1 text-xs rounded ${
                      isLoggedIn ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Reprocess
                  </button>
                )}
                
                <button
                  disabled={!isLoggedIn}
                  onClick={() => del(m._id)}
                  className={`text-white px-2 py-1 text-xs rounded ${
                    isLoggedIn ? "bg-red-600 hover:underline" : "bg-gray-400 cursor-not-allowed"
                  }`}
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

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setUser(AuthService.getUser());
            setShowLogin(false);
          }}
        />
      )}

      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}
    </div>
  );
}
