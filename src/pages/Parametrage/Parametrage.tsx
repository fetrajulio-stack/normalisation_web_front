import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import useThemeContext from "../../context/ThemeContext";
import { CheckCircle, Download } from "lucide-react";
import api from "../../services/api";
import useAuth from "../../context/AuthContext";
import { PROFIL_CQ, PROFIL_ETUDES } from "../../constants/Constant";

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

interface Groupe {
  ordre: number;
  champs: string[];
}

interface ConsigneGroupes {
  consigne_id: number;
  groupes: Groupe[];
  parametres: {
    valeur_defaut: string;
  };
}

interface PayloadConsignes {
  nom_dossier: string;
  nom_code_dossier: string;
  // identifiant correspondant à la table codifications côté backend
  //id_codification?: number;
  codification_id?: number;
  consignes: ConsigneGroupes[];
}



const Parametrage = () => {
  const { theme } = useThemeContext();

  const { user } = useAuth();
  const profil = user?.profil?.libelle;

const [loadingProcess, setLoadingProcess] = useState(false);
const [loadingMessage, setLoadingMessage] = useState("");




  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [codeDossiers, setCodeDossiers] = useState<Cathegory[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<number | "">("");
  const [selectedCodeDossier, setSelectedCodeDossier] = useState<number | "">("");
  const [loadingCodes, setLoadingCodes] = useState(false);

  const [champs, setChamps] = useState<Champ[]>([]);
  const [consignes, setConsignes] = useState<Consigne[]>([]);
  const [selectedConsignes, setSelectedConsignes] = useState<Consigne[]>({});
  const [exportFormat, setExportFormat] = useState<"excel" | "txt">("excel");

  // État pour les consignes avec groupes
  const [consignesGroupes, setConsignesGroupes] = useState<ConsigneGroupes[]>([]);
  const [selectedConsigneId, setSelectedConsigneId] = useState<number | "">("");
  const [selectedGroupChamps, setSelectedGroupChamps] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  // identifiant de la codification récupéré via nom/code dossier
  const [codificationId, setCodificationId] = useState<number | null>(null);

  /* Charger dossiers */
  useEffect(() => {
    async function fetchDossiers() {
      try {
        const res = await api.get("/parametrage/list-codifications");
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
  const handleValidateDossier = async () => {
    if (!selectedDossier || !selectedCodeDossier) {
      alert("Veuillez sélectionner un dossier et un code dossier");
      return;
    }

    try {
      const dossierInfo = dossiers.find((d) => d.id_dossier === selectedDossier);
      const codeDossierInfo = codeDossiers.find(
        (c) => c.id_code_dossier === selectedCodeDossier
      );

      if (!dossierInfo || !codeDossierInfo) return;

      const res = await api.get(`/parametrage/list-champs`, {
        params: {
          nom_dossier: dossierInfo.nom_dossier,
          nom_code_dossier: codeDossierInfo.code_dossier,
        },
      });
      setChamps(res.data);

      // récupérer id de codification à partir du nom et code dossier
      let codifId: number | null = null;
      try {
        console.debug("lookup codification with", {
          nom_dossier: dossierInfo.nom_dossier,
          code_dossier: codeDossierInfo.code_dossier,
        });
        const codifRes = await api.get('/parametrage/codifications', {
          params: {
            nom_dossier: dossierInfo.nom_dossier,
            code_dossier: codeDossierInfo.code_dossier,
          },
        });
        codifId = codifRes.data?.id ?? null;
      } catch (e) {
        console.error("Erreur lors de la récupération de l'id de codification", e);
      }
      if (!codifId) {
        //alert("Impossible de trouver la codification associée");
        setConsignesGroupes([]);
        setEditingId(null);
        return;
      }
      console.debug("codificationId fetched", codifId);
      setCodificationId(codifId);

      // Vérifier s'il existe déjà un parametrage pour cette codification
      try {
        const resp = await api.get(`/consigne/parametrage/${codifId}`);
        const data = resp.data;
        console.debug("parametrage response for", codifId, data);

        // L'API retourne directement un tableau de consignes
        if (Array.isArray(data) && data.length > 0) {
          setConsignesGroupes(data);
          console.debug("setting consignesGroupes", data);
          setEditingId(codifId);
        } else {
          setConsignesGroupes([]);
          setEditingId(null);
        }
      } catch (err) {
        // Pas de paramétrage existant ou erreur non bloquante
        setConsignesGroupes([]);
        setEditingId(null);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement des champs");
    }
  };

  /* Charger consignes */
  useEffect(() => {
    async function fetchConsignes() {
      try {
        const res = await api.get("/consigne/list");

        const { data } = res.data;

        setConsignes(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchConsignes();
  }, []);

  const handleAddConsigne = () => {
    if (!selectedConsigneId) {
      alert("Sélectionnez d'abord une consigne");
      return;
    }

    // Vérifier si la consigne existe déjà
    if (consignesGroupes.some((c) => c.consigne_id === selectedConsigneId)) {
      alert("Cette consigne est déjà ajoutée");
      return;
    }

    const newConsigneGroupes: ConsigneGroupes = {
      consigne_id: selectedConsigneId as number,
      groupes: [],
      parametres: {
        valeur_defaut: "",
      },
    };

    setConsignesGroupes([...consignesGroupes, newConsigneGroupes]);
    setSelectedConsigneId("");
    setSelectedGroupChamps([]);
  };

  const handleAddGroupe = (consigneId: number) => {
    if (selectedGroupChamps.length === 0) {
      alert("Ajoutez au moins un champ au groupe");
      return;
    }

    setConsignesGroupes((prev) =>
      prev.map((c) => {
        if (c.consigne_id === consigneId) {
          const nextOrdre = (c.groupes.length || 0) + 1;
          return {
            ...c,
            groupes: [
              ...c.groupes,
              {
                ordre: nextOrdre,
                champs: selectedGroupChamps,
              },
            ],
          };
        }
        return c;
      })
    );

    setSelectedGroupChamps([]);
  };

  const handleRemoveConsigne = (consigneId: number) => {
    setConsignesGroupes((prev) =>
      prev.filter((c) => c.consigne_id !== consigneId)
    );
  };

  const handleRemoveGroupe = (consigneId: number, ordre: number) => {
    setConsignesGroupes((prev) =>
      prev.map((c) => {
        if (c.consigne_id === consigneId) {
          return {
            ...c,
            groupes: c.groupes
              .filter((g) => g.ordre !== ordre)
              .map((g, idx) => ({ ...g, ordre: idx + 1 })),
          };
        }
        return c;
      })
    );
  };

  const handleSaveChamps = async () => {
    if (!selectedDossier || !selectedCodeDossier) {
      alert("Veuillez sélectionner un dossier et un code dossier");
      return;
    }

    if (consignesGroupes.length === 0) {
      alert("Ajoutez au moins une consigne");
      return;
    }

    // Récupérer les noms des dossier et code dossier
    const dossierInfo = dossiers.find((d) => d.id_dossier === selectedDossier);
    const codeDossierInfo = codeDossiers.find(
      (c) => c.id_code_dossier === selectedCodeDossier
    );

    if (!dossierInfo || !codeDossierInfo) {
      alert("Erreur: dossier ou code dossier non trouvé");
      return;
    }

    const payload: PayloadConsignes = {
      nom_dossier: dossierInfo.nom_dossier,
      nom_code_dossier: codeDossierInfo.code_dossier,
      codification_id: codificationId ?? undefined,
      //id_codification: codificationId ?? undefined,
      consignes: consignesGroupes,
    };

    console.log("Payload à envoyer:", JSON.stringify(payload, null, 2));

    try {
      if (editingId) {
        const response = await api.put(`/consigne/parametrage/update/${editingId}`, payload, {
          headers: {
            "Content-Type": "application/json"
          }
        }
        );
        console.log("Réponse du serveur (update):", response.data);
      } else {
        const response = await api.post("/consigne/parametrage/add", payload);
        console.log("Réponse du serveur (add):", response.data);
      }
      alert(editingId ? "Modifié avec succès !" : "Enregistré avec succès !");
      setConsignesGroupes([]);
      setEditingId(null);
      setCodificationId(null);
    } catch (err: any) {
      console.error("Erreur détaillée:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Erreur inconnue";
      alert(`Erreur lors de l'enregistrement:\n${errorMessage}`);
    }
  };

const handleLancer = async () => {

  if (!codificationId || !selectedDossier || !selectedCodeDossier) {
    alert("Veuillez valider un dossier avant de lancer.");
    return;
  }

  const dossierInfo = dossiers.find((d) => d.id_dossier === selectedDossier);
  const codeDossierInfo = codeDossiers.find(
    (c) => c.id_code_dossier === selectedCodeDossier
  );

  if (!dossierInfo || !codeDossierInfo) {
    alert("Erreur dossier ou code dossier");
    return;
  }

  const payload = {
    nom_dossier: dossierInfo.nom_dossier,
    nom_code_dossier: codeDossierInfo.code_dossier,
  };

  setLoadingProcess(true);

  try {

    /* =========================
       1️⃣ API normalise
    ========================= */

    setLoadingMessage("⏳ Création table source...");

    await api.get("/normalise", { params: payload });

    console.log("Table Source créée");


  } catch (error) {

    console.error("Erreur normalise", error);
    alert("Erreur lors de la création de la table Source");

    setLoadingProcess(false);
    return;

  }

  /* =========================
     2️⃣ API importmdb
  ========================= */

  try {

    setLoadingMessage("⏳ Import MDB...");

    await api.get("/importmdb", { params: payload });

    console.log("Import MDB terminé");

  } catch (error) {

    console.warn("Import MDB échoué mais on continue...", error);

  }

  /* =========================
     3️⃣ API normalisation
  ========================= */

  try {

    setLoadingMessage("⏳ Normalisation et génération Excel...");

    const response = await api.post(`/normalisation/${codificationId}`);

    const data = response.data;

    if (data.status === "OK" && data.url) {

      const link = document.createElement("a");
      link.href = data.url;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setLoadingMessage("✅ Fichier Excel généré !");
      alert("✅ Le fichier Excel a été généré et téléchargé avec succès.");

    } else {
      alert("Erreur lors de la génération du fichier");
    }

  } catch (error) {

    console.error("Erreur normalisation", error);
    alert("Erreur lors de la normalisation");

  } finally {

    setLoadingProcess(false);

  }
};


  const isEtudes = profil === PROFIL_ETUDES;
  const isCQ = profil === PROFIL_CQ;

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
            type="button"
            onClick={handleValidateDossier}
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
        {/* Colonne gauche - Gestion des consignes */}
        <div className="md:col-span-2 bg-white dark:bg-[#0f173a] p-6 rounded-2xl shadow-lg space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gestion des consignes
            </h3>

            {/* Ajouter consigne */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-[#1f2a5a] rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Sélectionner consigne
                  </label>
                  <select
                    value={selectedConsigneId}
                    onChange={(e) => setSelectedConsigneId(Number(e.target.value) || "")}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f173a] text-gray-900 dark:text-gray-100 px-4 py-2.5 focus:ring-2 focus:ring-[#FC8404] outline-none"
                  >
                    <option value="">— Choisir une consigne —</option>
                    {consignes
                      .filter(
                        (c) => !consignesGroupes.some((cg) => cg.consigne_id === c.id)
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.libelle}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    disabled={isCQ}
                    type="button"
                    onClick={handleAddConsigne}
                    className={`w-full px-4 py-2.5 rounded-lg text-white font-semibold flex items-center justify-center gap-2
    ${isCQ
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#FC8404] hover:bg-[#e67603] transition"}
  `}
                  >
                    <CheckCircle size={18} />
                    Ajouter consigne
                  </button>
                </div>
              </div>
            </div>

            {/* Consignes ajoutées */}
            <div className="space-y-6">
              {consignesGroupes.map((cg) => {
                const consigneInfo = consignes.find((c) => c.id === cg.consigne_id);
                return (
                  <div
                    key={cg.consigne_id}
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg space-y-4"
                  >
                    {/* En-tête consigne */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {consigneInfo?.libelle}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {cg.consigne_id}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveConsigne(cg.consigne_id)}
                        className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                      >
                        Supprimer
                      </button>
                    </div>

                    {/* Groupes */}
                    <div className="space-y-3 bg-gray-50 dark:bg-[#1f2a5a] p-3 rounded">
                      {cg.groupes.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
                            Groupes ({cg.groupes.length})
                          </h5>
                          <div className="space-y-2">
                            {cg.groupes.map((groupe) => (
                              <div
                                key={groupe.ordre}
                                className="flex justify-between items-start p-2 bg-white dark:bg-[#0f173a] rounded border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Ordre: {groupe.ordre}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Champs ({groupe.champs.length}): {groupe.champs.join(", ")}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveGroupe(cg.consigne_id, groupe.ordre)}
                                  className="ml-2 px-2 py-1 rounded bg-red-100 text-red-600 text-xs hover:bg-red-200"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ajouter groupe */}
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-[#374151] rounded space-y-2">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                          Sélectionner champs pour nouveau groupe
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 space-y-1 bg-white dark:bg-[#0f173a]">
                          {champs.map((champ) => (
                            <label
                              key={champ.idq}
                              className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                            >
                              <input
                                type="checkbox"
                                checked={selectedGroupChamps.includes(champ.idq)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGroupChamps([
                                      ...selectedGroupChamps,
                                      champ.idq,
                                    ]);
                                  } else {
                                    setSelectedGroupChamps(
                                      selectedGroupChamps.filter(
                                        (c) => c !== champ.idq
                                      )
                                    );
                                  }
                                }}
                                className="w-4 h-4 cursor-pointer"
                              />
                              {champ.idq}
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddGroupe(cg.consigne_id)}
                          disabled={selectedGroupChamps.length === 0}
                          className="w-full px-3 py-1.5 rounded bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                        >
                          + Ajouter groupe
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bouton Enregistrer */}
          {consignesGroupes.length > 0 && (
            <div className="flex items-center justify-end pt-4 border-t border-gray-300 dark:border-gray-600 gap-4">
              {editingId && (
                <div className="mr-auto text-sm text-gray-600 dark:text-gray-300">
                  Paramétrage chargé: ID {editingId}
                </div>
              )}

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setCodificationId(null);
                    // alert("Mode édition annulé");
                    window.location.reload();
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300"
                >
                  Annuler
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveChamps}
                className="px-6 py-2.5 rounded-lg bg-[#FC8404] text-white font-semibold hover:bg-[#e67603] flex items-center gap-2"
              >
                <CheckCircle size={18} />
                {editingId ? "Modifier" : "Enregistrer"}
              </button>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="md:col-span-1 flex flex-col gap-4 items-center justify-start bg-white dark:bg-[#0f173a] p-6 rounded-2xl shadow-lg">
          <button
            disabled={isEtudes}
            onClick={handleLancer}
            className={`w-full py-6 rounded-lg text-white font-semibold flex items-center justify-center gap-2
    ${isEtudes
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#10b981] hover:bg-[#0f9d75]"}
  `}
          >
            <Download size={20} /> Lancer
          </button>
{loadingProcess && (
  <div className="w-full mb-4 p-4 rounded-lg bg-blue-100 text-blue-800 text-center font-semibold animate-pulse">
    {loadingMessage}
  </div>
)}


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