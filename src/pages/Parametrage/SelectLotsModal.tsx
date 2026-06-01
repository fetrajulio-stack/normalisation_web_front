import { useState, useEffect } from "react";
import { X, Loader, Check, Upload } from "lucide-react"; // Ajout de Upload
import api from "../../services/api";
import IndexationPanel from "./IndexationPanel";

interface SelectLotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nomDossier: string;
  nomCodeDossier: string;
  onConfirm: (selectedLots: string[], libelle: number, mappingFile: any, indexation: any) => void;
}

interface Champ {
  idq: string;
  defaut: string | null;
}

interface Groupe {
  ordre: number;
  champs: string[];
  parametres?: {
    separateur?: string;
    position?: string | number;
  };
}
const afficherBoutonIndexe = false;
const SelectLotsModal: React.FC<SelectLotsModalProps> = ({
  isOpen,
  onClose,
  nomDossier,
  nomCodeDossier,
  onConfirm,
}) => {
  const [lots, setLots] = useState<string[]>([]);
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parLibelle, setParLibelle] = useState<boolean>(false);
  const [mappingFile, setMappingFile] = useState<any>(null);
  const [showIndexation, setShowIndexation] = useState(false);
  const [champs, setChamps] = useState<Champ[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(false);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [selectedGroupChamps, setSelectedGroupChamps] = useState<string[]>([]);
  const [newGroupParams, setNewGroupParams] = useState<{ separateur?: string; position?: string }>({});

  // Charger la liste des lots
  useEffect(() => {
    if (isOpen && nomDossier && nomCodeDossier) {
      fetchLots();
      fetchChamps();
    }
  }, [isOpen, nomDossier, nomCodeDossier]);

  const fetchChamps = async () => {
    setLoadingChamps(true);
    try {
      const response = await api.get("/parametrage/list-champs", {
        params: {
          nom_dossier: nomDossier,
          nom_code_dossier: nomCodeDossier,
        },
      });
      const champsList = Array.isArray(response.data) ? response.data : response.data?.champs || [];
      setChamps(champsList);
    } catch (err: any) {
      console.error("Erreur lors du chargement des champs:", err);
    } finally {
      setLoadingChamps(false);
    }
  };

  const fetchLots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/lots", {
        params: {
          nom_dossier: nomDossier,
          nom_code_dossier: nomCodeDossier,
        },
      });
      const lotsList = response.data?.lots || [];
      setLots(lotsList);
      setSelectedLots(lotsList);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Erreur lors du chargement des lots";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleImportMapping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('mapping_file', file);
    formData.append('nom_dossier', nomDossier); // Optionnel : lier au dossier actuel

    try {
      // Utilisation de ton instance "api" plutôt que axios brut
      const response = await api.post('/import-mapping-client', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { success, debug_mapping } = response.data;

      if (success) {
        setMappingFile(debug_mapping);
        alert("Mapping client importé avec succès !");
      }
    } catch (error: any) {
      console.error("Erreur import mapping:", error);
      alert("Erreur lors de l'importation du fichier.");
    }
  };

  const toggleLot = (lot: string) => {
    setSelectedLots((prev) =>
      prev.includes(lot) ? prev.filter((l) => l !== lot) : [...prev, lot]
    );
  };

  const toggleAllLots = () => {
    if (selectedLots.length === lots.length) {
      setSelectedLots([]);
    } else {
      setSelectedLots([...lots]);
    }
  };

  const handleConfirm = () => {
    if (selectedLots.length === 0) {
      setError("Veuillez sélectionner au moins un lot");
      return;
    }
    
    // L'envoi d'indexation est désactivé.
    // On passe désormais `null` pour ne rien transmettre au backend.
    const indexationData = null;
    
    onConfirm(selectedLots, parLibelle ? 1 : 0, mappingFile, indexationData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedLots([]);
    setError(null);
    setShowIndexation(false);
    setSelectedGroupChamps([]);
    setNewGroupParams({});
    setGroupes([]);
    onClose();
  };

  const toggleLotForIndexation = (lot: string) => {
    setSelectedLots((prev) =>
      prev.includes(lot) ? prev.filter((l) => l !== lot) : [...prev, lot]
    );
  };

  const handleAddGroupe = () => {
    if (selectedGroupChamps.length === 0) {
      setError("Ajoutez au moins un champ au groupe");
      return;
    }

    const nextOrdre = (groupes.length || 0) + 1;
    setGroupes([
      ...groupes,
      {
        ordre: nextOrdre,
        champs: selectedGroupChamps,
        parametres: {
          ...(newGroupParams.separateur ? { separateur: newGroupParams.separateur } : {}),
          ...(newGroupParams.position ? { position: newGroupParams.position } : {}),
        },
      },
    ]);

    // Réinitialiser la sélection
    setSelectedGroupChamps([]);
    setNewGroupParams({});
  };

  const handleRemoveGroupe = (index: number) => {
    setGroupes(
      groupes
        .filter((_, idx) => idx !== index)
        .map((g, idx) => ({ ...g, ordre: idx + 1 }))
    );
  };

  const handleSaveIndexation = () => {
    if (groupes.length === 0) {
      setError("Ajoutez au moins un groupe");
      return;
    }
    console.log("Indexation enregistrée:", groupes);
    alert("Indexation enregistrée avec succès!");
    setShowIndexation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0f173a] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-[#0f173a]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sélectionner les lots
          </h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader size={24} className="animate-spin text-[#FC8404]" />
              <p className="text-gray-600 dark:text-gray-300">Chargement des lots...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedLots.length === lots.length && lots.length > 0}
                  onChange={toggleAllLots}
                  className="w-5 h-5 rounded cursor-pointer accent-[#FC8404]"
                />
                <label htmlFor="selectAll" className="flex-1 cursor-pointer font-semibold text-gray-800 dark:text-gray-100">
                  Sélectionner tous ({lots.length} lots)
                </label>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {lots.map((lot) => (
                  <div key={lot} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition border border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      id={`lot-${lot}`}
                      checked={selectedLots.includes(lot)}
                      onChange={() => toggleLot(lot)}
                      className="w-5 h-5 rounded cursor-pointer accent-[#FC8404]"
                    />
                    <label htmlFor={`lot-${lot}`} className="flex-1 cursor-pointer text-gray-700 dark:text-gray-200 font-medium">
                      {lot}
                    </label>
                    {selectedLots.includes(lot) && <Check size={20} className="text-green-500" />}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && lots.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a233e] sticky bottom-0 space-y-4">
            {/* Interface Indexation - Au dessus des boutons */}
            {showIndexation && (
              <IndexationPanel
                champs={champs}
                loadingChamps={loadingChamps}
                groupes={groupes}
                selectedGroupChamps={selectedGroupChamps}
                newGroupParams={newGroupParams}
                onAddGroupe={handleAddGroupe}
                onRemoveGroupe={handleRemoveGroupe}
                onSaveIndexation={handleSaveIndexation}
                onClose={() => setShowIndexation(false)}
                onSelectedGroupChampsChange={setSelectedGroupChamps}
                onNewGroupParamsChange={setNewGroupParams}
                error={error}
              />
            )}

            {/* Boutons action */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Options à gauche */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    id="parLibelle"
                    type="checkbox"
                    checked={parLibelle}
                    onChange={() => setParLibelle((p) => !p)}
                    className="w-5 h-5 rounded cursor-pointer accent-[#FC8404]"
                  />
                  <label htmlFor="parLibelle" className="text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap">
                    Par libellé
                  </label>
                </div>

                {/* Import Mapping */}
                <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-xs transition-colors shadow-sm">
                  <Upload size={14} />
                  <span>Mapping Client</span>
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportMapping} />
                </label>

                {/* Bouton Indexé */}
                {afficherBoutonIndexe && (
                  <button
                    onClick={() => setShowIndexation((prev) => !prev)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-xs transition-colors shadow-sm"
                  >
                    Indexé
                  </button>
                )}
              </div>

              {/* Actions à droite */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedLots.length === 0}
                  className="px-6 py-2 rounded-lg bg-[#FC8404] text-white font-semibold hover:bg-[#e67603] transition disabled:opacity-50 flex items-center gap-2"
                >
                  Lancer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectLotsModal;