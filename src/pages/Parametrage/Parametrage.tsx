import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import useThemeContext from "../../context/ThemeContext";
import { CheckCircle } from "lucide-react";
import api from "../../services/api";

interface Dossier {
  id: number;
  libelle: string;
}

interface CodeDossier {
  id: number;
  code: string;
}

const Parametrage = () => {
  const { theme } = useThemeContext();

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [codeDossiers, setCodeDossiers] = useState<CodeDossier[]>([]);

  const [selectedDossier, setSelectedDossier] = useState<number | "">("");
  const [selectedCodeDossier, setSelectedCodeDossier] = useState<number | "">("");

  const [loadingCodes, setLoadingCodes] = useState(false);

  /* Charger la liste des dossiers */
  useEffect(() => {
    async function fetchDossiers() {
      try {
        const res = await api.get("/dossiers");
        
        setDossiers(res.data);
      } catch (error) {
        console.error("Erreur chargement dossiers", error);
      }
    }
    fetchDossiers();
  }, []);

  /* Charger les codes selon le dossier */
  useEffect(() => {
    if (!selectedDossier) {
      setCodeDossiers([]);
      setSelectedCodeDossier("");
      return;
    }

    async function fetchCodes() {
      try {
        setLoadingCodes(true);
        const res = await fetch(`/api/dossiers/${selectedDossier}/codes`);
        const data = await res.json();
        setCodeDossiers(data);
      } catch (error) {
        console.error("Erreur chargement codes", error);
      } finally {
        setLoadingCodes(false);
      }
    }

    fetchCodes();
  }, [selectedDossier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log({
      dossier: selectedDossier,
      code: selectedCodeDossier,
    });

    // 👉 ici tu pourras appeler ton API de validation
  };

  return (
    <div className="p-6 bg-[#ffffff] dark:bg-[#080d24] min-h-[calc(100vh-72px-100px)]">
      <PageHeader />

      <form
        onSubmit={handleSubmit}
        className="
    mt-6
    bg-white dark:bg-[#0f173a]
    rounded-2xl
    shadow-lg
    p-6
    max-w-6xl
+   mx-auto
  "
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
          {/* Dossier */}
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Dossier
            </label>
            <select
              value={selectedDossier}
              onChange={(e) => setSelectedDossier(Number(e.target.value))}
              className="
    w-full
    rounded-lg
    border
    border-gray-300
    dark:border-gray-600
    bg-white
    dark:bg-[#1f2a5a]
+   text-gray-900
+   dark:text-gray-100
    px-4
    py-2.5
    focus:ring-2
    focus:ring-[#FC8404]
    outline-none
  "
            >
              <option value="">— Sélectionner un dossier —</option>
              {dossiers.map((dossier) => (
                <option key={dossier.id} value={dossier.id}>
                  {dossier.libelle}
                </option>
              ))}
            </select>
          </div>

          {/* Code dossier */}
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Code dossier
            </label>

            <select
              value={selectedCodeDossier}
              onChange={(e) => setSelectedCodeDossier(Number(e.target.value))}
              disabled={!selectedDossier || loadingCodes}
              className="
      w-full
      rounded-lg
      border
      border-gray-300
      dark:border-gray-600
      bg-white
      dark:bg-[#1f2a5a]
      text-gray-900
      dark:text-gray-100
      px-4
      py-2.5
      focus:ring-2
      focus:ring-[#FC8404]
      outline-none
      disabled:opacity-60
    "
            >
              <option value="">
                {loadingCodes
                  ? "Chargement..."
                  : "— Sélectionner un code —"}
              </option>

              {codeDossiers.map((code) => (
                <option key={code.id} value={code.id}>
                  {code.code}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton */}
          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={!selectedDossier || !selectedCodeDossier}
              className="
    w-full
    px-6
    py-2.5
    rounded-lg
    bg-[#FC8404]
    text-white
    font-semibold
    hover:bg-[#e67603]
    transition
    disabled:opacity-50
    disabled:cursor-not-allowed
    flex
    items-center
    justify-center
    gap-2
  "
            >
              <CheckCircle size={18} />
              Valider
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Parametrage;
