import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from "../../context/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      toast.success("Connexion réussie");
      const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/parametrage";

      sessionStorage.removeItem("redirectAfterLogin");

      navigate(redirectPath);
    } else {
      toast.error("Email ou mot de passe incorrect");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#FC8404] to-[#fcd34d] relative px-4">
      {/* Left/Right decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-white/10 backdrop-blur-lg -skew-x-12 transform origin-top-left"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-full bg-white/10 backdrop-blur-lg skew-x-12 transform origin-bottom-right"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#0f173a] rounded-3xl shadow-2xl p-10 md:p-12">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#080d24] dark:text-white">
          Bienvenue !
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
          Connectez-vous pour accéder à votre espace de normalisation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FC8404] placeholder-gray-400
    ${email ? "bg-white dark:bg-white" : "dark:bg-[#1b254b] bg-white/5"}`}
            />
          </div>

          {/* Password input avec bouton "œil" */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className={`w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FC8404] placeholder-gray-400
    ${password ? "bg-white dark:bg-white" : "dark:bg-[#1b254b] bg-white/5"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FC8404] hover:bg-[#e67603] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition flex justify-center items-center"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Rules */}
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
          <p className="font-semibold mb-2">Règles d’authentification :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Après 5 tentatives infructueuses, le compte est désactivé.</li>
            <li>Un changement de mot de passe est requis tous les 6 mois.</li>
          </ul>
        </div>

        {/* Optional CTA */}
        <p className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Besoin d'aide ? Contactez l'administrateur.
        </p>
      </div>
    </div>
  );
}
