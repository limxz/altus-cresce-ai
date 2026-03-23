import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { motion } from "framer-motion";

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useClientAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      navigate("/clientes/dashboard");
    } else {
      setError("Email ou password incorretos.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md text-center"
      >
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl">A</span>
        </div>

        <h1 className="font-display text-2xl text-foreground mb-1">Portal do Cliente</h1>
        <p className="text-muted-foreground text-sm mb-8">Acompanha o crescimento do teu negócio</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              placeholder="email@negocio.pt"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary !py-3 !text-sm !rounded-lg"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="text-muted-foreground text-xs mt-6">
          Esqueceu a password?{" "}
          <a href="mailto:geral@altusmedia.pt" className="text-accent hover:underline">
            Contacte a Altus Media
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default ClientLogin;
