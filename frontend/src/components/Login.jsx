import { useState } from "react";
import { api, setToken } from "../api";

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await api.login(password);
      setToken(token);
      onSuccess();
    } catch (err) {
      setError("Неверный пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-xs flex flex-col gap-4">
        <div className="text-center mb-2">
          <div className="font-mono text-2xl font-semibold text-cream tracking-wider">FITOPS</div>
          <div className="font-mono text-xs text-muted tracking-wider mt-1">ВВЕДИ ПАРОЛЬ ДЛЯ ДОСТУПА</div>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoFocus
          className="font-mono bg-panelAlt border border-line rounded-md px-3 py-2.5 text-cream"
        />
        {error && <div className="text-warn text-sm font-mono">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-go rounded-md py-2.5 text-bg font-semibold disabled:opacity-60"
        >
          {loading ? "..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
