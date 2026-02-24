import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import useThemeContext from "../../context/ThemeContext";
import { CheckCircle, Download } from "lucide-react";
import api from "../../services/api";
import Select from "react-select";
import { champDatas } from "../../data/data_champ";

export interface Cathegory {
  id_code_dossier: number;
  id_dossier: number;
  code_dossier: string;
}

interface Dossier {
  id_dossier: number;
  nom_dossier: string;
  cathegories: Cathegory[];
}

interface Champ {
  idq: string;
  defaut: string | null;
}

interface Consigne {
  id: number;
  libelle: string;
  code: string;
  statut: string;
}

const Parametrage = () => {
  const { theme } = useThemeContext();

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [codeDossiers, setCodeDossiers] = useState<Cathegory[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<number | "">("");
  const [selectedCodeDossier, setSelectedCodeDossier] = useState<number | "">("");
  const [loadingCodes, setLoadingCodes] = useState(false);

  const [champs, setChamps] = useState<Champ[]>([]);
  const [consignes, setConsignes] = useState<Consigne[]>([]);
  const [selectedConsignes, setSelectedConsignes] = useState<Consigne[]>({});
  const [exportFormat, setExportFormat] = useState<"excel" | "txt">("excel");

  /* Charger dossiers */
  useEffect(() => {
    async function fetchDossiers() {
      try {
        const res = await api.get("/list-codifications");
        setDossiers(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchDossiers();
  }, []);

  /* Charger code dossier */
  useEffect(() => {
    if (!selectedDossier) {
      setCodeDossiers([]);
      setSelectedCodeDossier("");
      return;
    }
    const dossier = dossiers.find((d) => d.id_dossier === selectedDossier);
    setCodeDossiers(dossier?.cathegories ?? []);
  }, [selectedDossier]);

  /* Charger champs dynamiques */
  useEffect(() => {
    async function fetchChamps() {
      if (!selectedDossier || !selectedCodeDossier) return;
      try {
        /* const res = await api.get(`/list-champs`, {
          params: {
            dossier: selectedDossier,
            code_dossier: selectedCodeDossier,
          },
        });
        setChamps(res.data); */
        setChamps(champDatas);
      } catch (err) {
        console.error(err);
      }
    }
    fetchChamps();
  }, [selectedDossier, selectedCodeDossier]);

  /* Charger consignes */
  useEffect(() => {
    async function fetchConsignes() {
      try {
        const res = await api.get("/consignes/list");

        const { data } = res.data;

        setConsignes(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchConsignes();
  }, []);

  const handleConsigneChange = (champ: string, selected: Consigne[] | null) => {
    setSelectedConsignes((prev) => ({
      ...prev,
      [champ]: selected || [],
    }));
  };

  const handleSaveChamps = async () => {
    // Ex: envoyer les consignes associées aux champs à l'API
    /* try {
      const payload = champs.map((c) => ({
        champ: c.champ,
        consignes: selectedConsignes[c.champ]?.map((x) => x.id) ?? [],
      }));
      await api.post("/consignes/parametrage/save", payload);
      alert("Enregistré avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement");
    } */
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/consignes/parametrage/add", {
        params: { format: exportFormat },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `export_${new Date().toISOString()}.${exportFormat === "excel" ? "xlsx" : "txt"}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'export");
    }
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: theme === "dark" ? "#1f2a5a" : "#ffffff",
      borderColor: theme === "dark" ? "#4b5563" : "#d1d5db",
      color: theme === "dark" ? "#f9fafb" : "#111827",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: theme === "dark" ? "#1f2a5a" : "#ffffff",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused
        ? theme === "dark"
          ? "#374151"
          : "#f3f4f6"
        : theme === "dark"
          ? "#1f2a5a"
          : "#ffffff",
      color: theme === "dark" ? "#f9fafb" : "#111827",
      cursor: "pointer",
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: theme === "dark" ? "#374151" : "#e5e7eb",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: theme === "dark" ? "#f9fafb" : "#111827",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: theme === "dark" ? "#f9fafb" : "#111827",
      ":hover": {
        backgroundColor: "#ef4444",
        color: "#ffffff",
      },
    }),
  };

  return (
    <div className="p-6 bg-[#ffffff] dark:bg-[#080d24] min-h-[calc(100vh-72px-100px)]">
      <PageHeader />

      {/* Dossier & Code Dossier */}
      <form className="mt-6 max-w-6xl mx-auto bg-white dark:bg-[#0f173a] p-6 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
        {/* Dossier */}
        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            Dossier
          </label>
          <select
            value={selectedDossier}
            onChange={(e) => setSelectedDossier(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2a5a] text-gray-900 dark:text-gray-100 px-4 py-2.5 focus:ring-2 focus:ring-[#FC8404] outline-none"
          >
            <option value="">— Sélectionner un dossier —</option>
            {dossiers.map((d) => (
              <option key={d.id_dossier} value={d.id_dossier}>
                {d.nom_dossier}
              </option>
            ))}
          </select>
        </div>

        {/* Code Dossier */}
        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            Code dossier
          </label>
          <select
            value={selectedCodeDossier}
            onChange={(e) => setSelectedCodeDossier(Number(e.target.value))}
            disabled={!selectedDossier || loadingCodes}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2a5a] text-gray-900 dark:text-gray-100 px-4 py-2.5 focus:ring-2 focus:ring-[#FC8404] outline-none disabled:opacity-60"
          >
            <option value="">
              {loadingCodes ? "Chargement..." : "— Sélectionner un code —"}
            </option>
            {codeDossiers.map((c) => (
              <option key={c.id_code_dossier} value={c.id_code_dossier}>
                {c.code_dossier}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton Valider */}
        <div className="md:col-span-1">
          <button
            type="submit"
            disabled={!selectedDossier || !selectedCodeDossier}
            className="w-full px-6 py-2.5 rounded-lg bg-[#FC8404] text-white font-semibold hover:bg-[#e67603] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Valider
          </button>
        </div>
      </form>

      {/* Champs & Consignes + Colonne droite */}
      <div className="mt-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="md:col-span-2 bg-white dark:bg-[#0f173a] p-6 rounded-2xl shadow-lg space-y-4">
          {champs.map((c) => (
            <div key={c.idq} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Champ */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Champ
                </label>
                <input
                  type="text"
                  value={c.idq}
                  disabled
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-gray-100"
                />
              </div>
              {/* Consigne */}
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Consigne
                </label>
                <Select
                  isMulti
                  options={consignes.map((x) => ({
                    value: x.id,
                    label: x.libelle,
                  }))}
                  styles={selectStyles}
                  onChange={(selected: any) =>
                    handleConsigneChange(
                      c.idq,
                      selected?.map((s: any) => ({
                        id: s.value,
                        libelle: s.label,
                      })) || []
                    )
                  }
                />
              </div>
            </div>
          ))}

          {/* Bouton Enregistrer */}
          {champs.length > 0 && (
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleSaveChamps}
                className="px-6 py-2.5 rounded-lg bg-[#FC8404] text-white font-semibold hover:bg-[#e67603] flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="md:col-span-1 flex flex-col gap-4 items-center justify-start bg-white dark:bg-[#0f173a] p-6 rounded-2xl shadow-lg">
          <button
            onClick={handleExport}
            className="w-full py-6 rounded-lg bg-[#10b981] hover:bg-[#0f9d75] text-white font-semibold flex items-center justify-center gap-2"
          >
            <Download size={20} /> Lancer
          </button>

          <div className="w-full mt-4">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              Format export
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as "excel" | "txt")}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2a5a] text-gray-900 dark:text-gray-100 px-4 py-2.5 focus:ring-2 focus:ring-[#FC8404] outline-none"
            >
              <option value="excel">Excel</option>
              <option value="txt">.txt</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametrage;