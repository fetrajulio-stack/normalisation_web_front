import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Datamap from "./Datamap";
import UploadExcel from "./uploadExcel";
import SelectLotsModal from "./SelectLotsModal";
import { Download, Upload, CheckCircle } from "lucide-react";
import api from "../../services/api";
import useAuth from "../../context/AuthContext";
import { PROFIL_CQ, PROFIL_ETUDES } from "../../constants/Constant";
import axios from "axios";
import MergeExcelModal from "./MergeExcelModal";

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
    valeur_defaut?: string;
    separateur?: string;
    position?: string | number;
    champ_principal?: string;
    champ_autre?: string;
    valeur_declencheuse?: string;
    mapping?: {
      source: string;
      target: string;
    };
  };
}

interface PayloadConsignes {
  nom_dossier: string;
  nom_code_dossier: string;
  // identifiant correspondant ├á la table codifications c├┤t├® backend
  //id_codification?: number;
  codification_id?: number;
  consignes: ConsigneGroupes[];
}

const disableDatamap = false;






const Parametrage = () => {
  // const { theme } = useThemeContext();

  const { user } = useAuth();

  const [loadingProcess, setLoadingProcess] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [searchDossier, setSearchDossier] = useState("");
  const [filteredDossiers, setFilteredDossiers] = useState<Dossier[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);


  const [searchCodeDossier, setSearchCodeDossier] = useState("");
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false);




  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [codeDossiers, setCodeDossiers] = useState<Cathegory[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<number | "">("");
  const [selectedCodeDossier, setSelectedCodeDossier] = useState<number | "">("");
  // const [loadingCodes, setLoadingCodes] = useState(false);

  const [champs, setChamps] = useState<Champ[]>([]);
  const [consignes, setConsignes] = useState<Consigne[]>([]);
  // const [selectedConsignes, setSelectedConsignes] = useState<Consigne[]>({});
  const [exportFormat, setExportFormat] = useState<"excel" | "txt">("excel");

  // ├ëtat pour les consignes avec groupes
  const [consignesGroupes, setConsignesGroupes] = useState<ConsigneGroupes[]>([]);
  const [selectedConsigneId, setSelectedConsigneId] = useState<number | "">("");
  const [selectedGroupChamps, setSelectedGroupChamps] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  // identifiant de la codification r├®cup├®r├® via nom/code dossier
  const [codificationId, setCodificationId] = useState<number | null>(null);

  const [showUploadExcelModal, setShowUploadExcelModal] = useState(false);
  const [fillValue, setFillValue] = useState("");
  const [showSelectLotsModal, setShowSelectLotsModal] = useState(false);
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const [mappingConsigneId, setMappingConsigneId] = useState<number | null>(null);

  const [showMergeModal, setShowMergeModal] = useState(false);

  useEffect(() => {

    if (!searchDossier) {
      setFilteredDossiers(dossiers);
      return;
    }

    const filtered = dossiers.filter((d) =>
      d.nom_dossier.toLowerCase().includes(searchDossier.toLowerCase())
    );

    setFilteredDossiers(filtered);

  }, [searchDossier, dossiers]);


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



  const handleValidateDossier = async () => {

    if (!selectedDossier || !selectedCodeDossier) {
      alert("Veuillez s├®lectionner un dossier et un code dossier");
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

      // r├®cup├®rer id de codification ├á partir du nom et code dossier
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
        console.error("Erreur lors de la r├®cup├®ration de l'id de codification", e);
      }
      if (!codifId) {
        //alert("Impossible de trouver la codification associ├®e");
        setConsignesGroupes([]);
        setEditingId(null);
        return;
      }
      console.debug("codificationId fetched", codifId);
      setCodificationId(codifId);

      // V├®rifier s'il existe d├®j├á un parametrage pour cette codification
      try {
        const resp = await api.get(`/consigne/parametrage/${codifId}`);
        const data = resp.data;

        // On vérifie si data est un tableau et s'il n'est PAS vide
        if (Array.isArray(data) && data.length > 0) {
          setConsignesGroupes(data);
          setEditingId(codifId);
        } else {
          // Si la table parametre_consignes est vide pour ce codification_id, 
          // on vide l'affichage des consignes
          setConsignesGroupes([]);
          setEditingId(null);
          // Optionnel : vous pouvez ajouter un message console pour débugger
          console.log("Aucun paramètre trouvé pour ce dossier, affichage masqué.");
        }
      } catch (err) {
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
      alert("S├®lectionnez d'abord une consigne");
      return;
    }

    // V├®rifier si la consigne existe d├®j├á
    if (consignesGroupes.some((c) => c.consigne_id === selectedConsigneId)) {
      alert("Cette consigne est d├®j├á ajout├®e");
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
      alert("Veuillez s├®lectionner un dossier et un code dossier");
      return;
    }

    if (consignesGroupes.length === 0) {
      alert("Ajoutez au moins une consigne");
      return;
    }


    const dossierInfo = dossiers.find((d) => d.id_dossier === selectedDossier);
    const codeDossierInfo = codeDossiers.find(
      (c) => c.id_code_dossier === selectedCodeDossier
    );

    if (!dossierInfo || !codeDossierInfo) {
      alert("Erreur: dossier ou code dossier non trouv├®");
      return;
    }

    const payload: PayloadConsignes = {
      nom_dossier: dossierInfo.nom_dossier,
      nom_code_dossier: codeDossierInfo.code_dossier,
      codification_id: codificationId ?? undefined,
      //id_codification: codificationId ?? undefined,
      consignes: consignesGroupes,
    };

    try {
      if (editingId) {
        const response = await api.put(`/consigne/parametrage/update/${editingId}`, payload, {
          headers: {
            "Content-Type": "application/json"
          }
        }
        );
        console.log("R├®ponse du serveur (update):", response.data);
      } else {
        const response = await api.post("/consigne/parametrage/add", payload);
        console.log("R├®ponse du serveur (add):", response.data);
      }
      alert(editingId ? "Modifié avec succés !" : "Enregistré avec succés !");
      setConsignesGroupes([]);
      setEditingId(null);
      setCodificationId(null);
    } catch (err: any) {
      console.error("Erreur d├®taill├®e:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Erreur inconnue";
      alert(`Erreur lors de l'enregistrement:\n${errorMessage}`);
    }
  };

  const handleLancer = async () => {
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_URL;
    const dossierInfo = dossiers.find((d) => d.id_dossier === selectedDossier);
    const codeDossierInfo = codeDossiers.find(
      (c) => c.id_code_dossier === selectedCodeDossier
    );

    if (!codificationId || !selectedDossier || !selectedCodeDossier) {
      alert("Veuillez valider un dossier avant de lancer.");
      return;
    }

    if (!dossierInfo || !codeDossierInfo) {
      alert("Erreur dossier ou code dossier");
      return;
    }

    const payload = {
      nom_dossier: dossierInfo.nom_dossier,
      nom_code_dossier: codeDossierInfo.code_dossier,
    };

    setLoadingProcess(true);
    // ----------------------------------------------

    // --- TON BLOC IF INTÉGRÉ ICI ---
    if (exportFormat === "txt") {

      setLoadingMessage("La conversion de l'Excel en TXT longueur fixe...");
      console.log(codificationId);

      axios.post(`${baseURL}datamaps/export`, {
        codification_id: codificationId,
        nom_code_dossier: codeDossierInfo?.code_dossier,
        format: "txt"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          const filename = res.data.filename;
          const downloadUrl = `${baseURL}downloadtxt/${filename}`;

          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', filename);
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
          }, 100);

          // --- ESSENTIEL : On arrête le chargement ici ---
          setLoadingProcess(false);
          alert("✅ Transformation réussie !");
        })
        .catch((error) => {
          console.error("Erreur:", error);
          // --- ESSENTIEL : On arrête aussi le chargement si ça plante ---
          setLoadingProcess(false);
          alert("❌ Erreur lors de la transformation.");
        });

      // Le return empêche d'exécuter la suite du code de la fonction
      return;
    }
    setLoadingProcess(false);
    // Afficher le modal de s├®lection des lots
    setShowSelectLotsModal(true);
  };

  // Nouvelle fonction pour traiter la s├®lection des lots
  const handleLotsSelected = async (lotsToProcess: string[]) => {
    setSelectedLots(lotsToProcess);

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
      selected_lots: lotsToProcess, // Ajouter la liste des lots s├®lectionn├®s
    };

    setLoadingProcess(true);

    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_URL;

    /* =========================
         1´©ÅÔâú API normalise
      ========================= */
    setLoadingMessage("⏳ Création table source...");

    axios.get(`${baseURL}normalise`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: payload
    })
      .then(() => {
        /* =========================
       2´©ÅÔâú API importmdb (avec les lots s├®lectionn├®s)
        ========================= */
        setLoadingMessage("⏳ Import MDB...");

        axios.get(`${baseURL}importmdb`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: payload
        })
          .catch((error) => {
            console.error("Erreur:", error);
          })
          .finally(() => {
            /* =========================
            3´©ÅÔâú API normalisation
            ========================= */
            if (exportFormat === "excel") {
              setLoadingMessage("⏳ Normalisation et génération Excel...");
            } else {
              setLoadingMessage("⏳ Normalisation et génération TXT...");
            }
            axios.post(`${baseURL}normalisation/${codificationId}`, {}, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
              .then((res) => {
                const filename = res.data.filename;
                const url = exportFormat === "excel"
                  ? `${baseURL}downloadexcel/${filename}`
                  : `${baseURL}downloadtxt/${filename}`;
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();

                alert("✅ Le fichier Excel a été généré et téléchargé avec succès.");
              })
              .catch((error) => {
                console.error("Erreur:", error);
              })
              .finally(() => {
                console.log("Requête termine");

                setLoadingProcess(false);
              });
          })
      })
      .catch((error) => {
        console.error("Erreur:", error);
        setLoadingProcess(false);
      })
      .finally(() => {
        console.log("Requête terminée");
      });
  };


  const filteredCodes = codeDossiers.filter((c) =>
    c.code_dossier.toLowerCase().includes(searchCodeDossier.toLowerCase())
  );

  /* =========================
     3´©ÅÔâú API normalisation
  ========================= */
  /*
 
  try {
 
    setLoadingMessage("ÔÅ│ Normalisation et g├®n├®ration Excel...");
 
    const response = await api.post(`/normalisation/${codificationId}`);
 
    const data = response.data;
    */

  /*
  if (data.status === "OK" && data.url) {

    const link = document.createElement("a");
    link.href = data.url;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    link.remove();

    setLoadingMessage("Ô£à Fichier Excel g├®n├®r├® !");
    alert("Ô£à Le fichier Excel a ├®t├® g├®n├®r├® et t├®l├®charg├® avec succ├¿s.");

  } else {
    alert("Erreur lors de la g├®n├®ration du fichier");
  }
    */
  /*
  if(data.status === "OK") {
    await api.get(`/downloadexcel/${data.filename}`);
    alert("Ô£à Le fichier Excel a ├®t├® g├®n├®r├® et t├®l├®charg├® avec succ├¿s.");
  }
  else {
    alert("Erreur lors de la g├®n├®ration du fichier");
  }
    */
  /* 

} catch (error) {

  console.error("Erreur normalisation", error);
  alert("Erreur lors de la normalisation");

} finally {

  setLoadingProcess(false);

}
  */

  const isEtudes = user?.profil?.libelle === PROFIL_ETUDES;
  const isCQ = user?.profil?.libelle === PROFIL_CQ;
  const loadingCodes = false;




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
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un dossier..."
              value={searchDossier}
              onChange={(e) => {
                setSearchDossier(e.target.value);
                setSelectedDossier("");
                setShowSuggestions(true);
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-[#1f2a5a] text-white px-4 py-2.5 focus:ring-2 focus:ring-[#FC8404] outline-none"
            />

            {showSuggestions && filteredDossiers.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto rounded-lg border border-gray-300 bg-[#1f2a5a] shadow-lg text-white">
                {filteredDossiers.map((d) => (
                  <li
                    key={d.id_dossier}
                    onClick={() => {
                      setSelectedDossier(d.id_dossier);
                      setSearchDossier(d.nom_dossier);
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2 cursor-pointer hover:bg-[#2a3570]"
                  >
                    {d.nom_dossier}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Code Dossier */}
        {/* Code Dossier avec Recherche */}
        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            Code dossier
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={loadingCodes ? "Chargement..." : "Rechercher un code..."}
              value={searchCodeDossier}
              disabled={!selectedDossier || loadingCodes}
              onChange={(e) => {
                setSearchCodeDossier(e.target.value);
                setSelectedCodeDossier(""); // Réinitialise la sélection si l'utilisateur tape à nouveau
                setShowCodeSuggestions(true);
              }}
              onFocus={() => setShowCodeSuggestions(true)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-[#1f2a5a] text-white px-4 py-2.5 focus:ring-2 focus:ring-[#FC8404] outline-none disabled:opacity-60"
            />

            {/* Liste des suggestions */}
            {showCodeSuggestions && filteredCodes.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto rounded-lg border border-gray-300 bg-[#1f2a5a] shadow-lg text-white">
                {filteredCodes.map((c) => (
                  <li
                    key={c.id_code_dossier}
                    onClick={() => {
                      setSelectedCodeDossier(c.id_code_dossier);
                      setSearchCodeDossier(c.code_dossier);
                      setShowCodeSuggestions(false);
                    }}
                    className="px-4 py-2 cursor-pointer hover:bg-[#2a3570] transition-colors"
                  >
                    {c.code_dossier}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                    <option value="">-- Choisir une consigne --</option>
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

            {/* Consignes ajout├®es */}
            <div className="space-y-6">
              {consignesGroupes.map((cg) => {
                const consigneInfo = consignes.find((c) => c.id === cg.consigne_id);
                return (
                  <div
                    key={cg.consigne_id}
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg space-y-4"
                  >
                    {/* En-t├¬te consigne */}
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

                    {/* --- NOUVEAU : CHAMP DE SAISIE POUR LA VALEUR PAR DÉFAUT --- */}
                    {(cg.consigne_id === 6 || (cg.parametres?.valeur_defaut && cg.parametres.valeur_defaut.trim() !== "")) && (
                      <div className="p-3 bg-orange-50 dark:bg-[#2a3570] rounded-lg border border-orange-200 dark:border-blue-800">
                        <label className="block mb-1 text-xs font-bold text-orange-700 dark:text-orange-300 uppercase">
                          Valeur à appliquer (ex: 9, NR, 7)
                        </label>
                        <input
                          type="text"
                          placeholder="Saisir la valeur..."
                          value={cg.parametres?.valeur_defaut || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConsignesGroupes((prev) =>
                              prev.map((item) =>
                                item.consigne_id === cg.consigne_id
                                  ? { ...item, parametres: { ...item.parametres, valeur_defaut: val } }
                                  : item
                              )
                            );
                          }}
                          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f173a] px-3 py-2 text-sm focus:ring-2 focus:ring-[#FC8404] outline-none text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                    {/* --- FIN DU NOUVEAU CHAMP --- */}

                    {/* --- NOUVEAU : CHAMP DE SAISIE POUR LA VALEUR A EXTRAIRE NOM LOT (ID 2) --- */}
                    {cg.consigne_id === 4 && (
                      <div className="space-y-4 p-3 bg-blue-50 dark:bg-[#2a3570]/50 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Séparateur</label>
                            <input
                              type="text"
                              value={cg.parametres?.separateur || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConsignesGroupes(prev => prev.map(item =>
                                  item.consigne_id === cg.consigne_id
                                    ? { ...item, parametres: { ...item.parametres, separateur: val } }
                                    : item
                                ));
                              }}
                              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f173a] px-3 py-1.5 text-sm text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Position (Index)</label>
                            <input
                              type="number"
                              min="0"
                              value={cg.parametres?.position || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConsignesGroupes(prev => prev.map(item =>
                                  item.consigne_id === cg.consigne_id
                                    ? { ...item, parametres: { ...item.parametres, position: val } }
                                    : item
                                ));
                              }}
                              className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f173a] px-3 py-1.5 text-sm text-white"
                            />
                          </div>
                        </div>
                        {/* Utilisation de la liste des champs du groupe si elle existe */}
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 italic">
                          Cible : <span className="font-mono font-bold">Extraction vers le groupe sélectionné</span>
                        </div>
                      </div>
                    )}
                    {/* --- FIN DU NOUVEAU CHAMP --- */}


                    {/* --- NOUVEAU : CONFIGURATION DYNAMIQUE FUSION CHAMP AUTRE (ID 7) --- */}
                    {cg.consigne_id === 7 && (
                      <div className="p-4 bg-slate-900 border border-orange-500 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                          {/* Champ Cible (ex: q16) */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 uppercase font-medium">Champ Cible</label>
                            <input
                              type="text"
                              placeholder="ex: q16"
                              value={cg.parametres?.champ_principal || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConsignesGroupes(prev => prev.map(item =>
                                  item.consigne_id === cg.consigne_id
                                    ? { ...item, parametres: { ...item.parametres, champ_principal: val } }
                                    : item
                                ));
                              }}
                              className="w-full rounded border border-gray-700 bg-[#0f173a] px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>

                          {/* Déclencheur (ex: 2 ou vide) */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 uppercase font-medium">Déclencheur (Optionnel)</label>
                            <input
                              type="text"
                              placeholder="Vide = systématique"
                              // Force l'affichage d'une chaîne vide même si la donnée est null/undefined
                              value={cg.parametres?.valeur_declencheuse ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConsignesGroupes(prev => prev.map(item =>
                                  item.consigne_id === cg.consigne_id
                                    ? {
                                      ...item,
                                      parametres: {
                                        ...item.parametres,
                                        // Sécurité : si l'input est vide, on enregistre ""
                                        valeur_declencheuse: val === "" ? "" : val
                                      }
                                    }
                                    : item
                                ));
                              }}
                              className="w-full rounded border border-gray-700 bg-[#0f173a] px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>

                          {/* Champ Source (ex: q16_pk) */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 uppercase font-medium">Champ Source (PK)</label>
                            <input
                              type="text"
                              placeholder="ex: q16_pk"
                              value={cg.parametres?.champ_autre || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConsignesGroupes(prev => prev.map(item =>
                                  item.consigne_id === cg.consigne_id
                                    ? { ...item, parametres: { ...item.parametres, champ_autre: val } }
                                    : item
                                ));
                              }}
                              className="w-full rounded border border-gray-700 bg-[#0f173a] px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>

                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-orange-500 text-xs">⚠</span>
                          <p className="text-[10px] text-gray-400 italic">
                            Si le <strong>Champ Source</strong> est rempli, sa valeur écrasera le <strong>Champ Cible</strong> (selon le déclencheur). La source sera ensuite supprimée de l'export Excel.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* --- NOUVEAU : CHAMP DE SAISIE POUR AJOUTER UN SÉPARATEUR (ID 2) --- */}

                    {/* --- FIN DU NOUVEAU CHAMP --- */}
                    {cg.consigne_id === 27 && (
                      <div className="space-y-4 p-4 bg-slate-900 border border-green-500 rounded-lg">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-green-400 uppercase tracking-wider">
                            Nom du champ de destination (Excel)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: nom_prenom"
                            value={cg.parametres?.separateur || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConsignesGroupes(prev => prev.map(item =>
                                item.consigne_id === cg.consigne_id
                                  ? { ...item, parametres: { ...item.parametres, separateur: val } }
                                  : item
                              ));
                            }}
                            className="w-full rounded border border-green-500/30 bg-[#0f173a] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-green-500"
                          />
                          <p className="text-[9px] text-gray-400 mt-1 italic">
                            Saisissez ici le nom de la colonne qui sera créée dans l'export.
                          </p>
                        </div>

                        <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
                          <p className="text-[10px] text-green-300">
                            <strong>Note :</strong> Les champs sélectionnés dans les groupes ci-dessous (Ordre 1, Ordre 2...) seront fusionnés avec un espace.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                            Nom du lot à extraire
                          </label>
                          <div className="w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#1f2a5a] px-3 py-1.5 text-sm text-gray-900 dark:text-white">
                            {/* cg.parametres?.mapping?.target || "Non défini" */}
                          </div>
                        </div>
                      </div>
                    )}


                    {/* --- NOUVEAU : CHAMP DE SAISIE POUR AJOUTER UN SÉPARATEUR (ID 2) --- */}
                    {/* {cg.consigne_id === 27 && (
                        <div className="p-3 bg-green-50 dark:bg-[#2a3570]/50 rounded-lg border border-green-200 dark:border-green-800">
                          <label className="block mb-1 text-xs font-bold text-green-700 dark:text-green-300 uppercase">
                            Séparateur
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: ;"
                            value={cg.parametres?.separateur || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConsignesGroupes(prev => prev.map(item => 
                                item.consigne_id === cg.consigne_id 
                                  ? { ...item, parametres: { ...item.parametres, separateur: val }} 
                                  : item
                              ));
                            }}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f173a] px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                          />
                        </div>
                      )} */}
                    {/* --- FIN DU NOUVEAU CHAMP --- */}

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
                    // alert("Mode ├®dition annul├®");
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

          {codificationId && (
            <button
              onClick={() => setShowUploadExcelModal(true)}
              className="w-full py-3 rounded-lg bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] flex items-center justify-center gap-2 transition"
            >
              <Upload size={18} /> Importer Excel
            </button>
          )}

          {loadingProcess && (
            <div className="w-full mb-4 p-4 rounded-lg bg-blue-100 text-blue-800 text-center font-semibold animate-pulse">
              {loadingMessage}
            </div>
          )}


          {!disableDatamap && (
            <Datamap
              champs={champs}
              codificationId={codificationId}
              isEtudes={isEtudes}
              disabled={!codificationId || isEtudes}
            />
          )}

          {/* --- NOUVEAU BOUTON  */}
          {editingId && (
            <button
              type="button"
              onClick={() => setShowMergeModal(true)}
              className="w-full py-3 rounded-lg bg-[#FC8404] text-white font-semibold hover:bg-[#e67603] flex items-center justify-center gap-2 transition shadow-md"
            >
              <Upload size={18} />
              Assembler 2 fichiers Excel
            </button>
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

      {(() => {
        const selectedCodeDossierInfo = codeDossiers.find((c) => c.id_code_dossier === selectedCodeDossier);
        const selectedCodeDossierNameValue = selectedCodeDossierInfo?.code_dossier || "";
        return (
          <UploadExcel
            isOpen={showUploadExcelModal}
            onClose={() => setShowUploadExcelModal(false)}
            tableName="data_import"
            selectedCodeDossierName={selectedCodeDossierNameValue}
            codification_id={codificationId ?? undefined}
          />
        );
      })()}

      {(() => {
        const selectedDossierInfo = dossiers.find((d) => d.id_dossier === selectedDossier);
        const selectedCodeDossierInfo = codeDossiers.find((c) => c.id_code_dossier === selectedCodeDossier);
        const nomDossierValue = selectedDossierInfo?.nom_dossier || "";
        const nomCodeDossierValue = selectedCodeDossierInfo?.code_dossier || "";
        return (
          <SelectLotsModal
            isOpen={showSelectLotsModal}
            onClose={() => setShowSelectLotsModal(false)}
            nomDossier={nomDossierValue}
            nomCodeDossier={nomCodeDossierValue}
            onConfirm={handleLotsSelected}
          />
        );
      })()}


      {/* --- AJOUTEZ LE CODE ICI --- */}
      <MergeExcelModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        codeDossier={searchCodeDossier}
        dossierName={searchDossier}
      />

    </div>

  );

};


export default Parametrage;

