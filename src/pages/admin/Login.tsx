import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate("/admin");
    } else {
      setError("Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="glass-card p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <h1 className="font-display text-2xl text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Altus Media</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
              placeholder="admin@altusmedia.pt"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full !py-3 !text-sm">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
