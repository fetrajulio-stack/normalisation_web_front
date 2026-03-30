import { useState, useEffect } from "react";
import { X, Loader, Check } from "lucide-react";
import api from "../../services/api";

interface SelectLotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nomDossier: string;
  nomCodeDossier: string;
  onConfirm: (selectedLots: string[]) => void;
}

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

  // Charger la liste des lots au moment de l'ouverture du modal
  useEffect(() => {
    if (isOpen && nomDossier && nomCodeDossier) {
      fetchLots();
    }
  }, [isOpen, nomDossier, nomCodeDossier]);

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
      // S├®lectionner tous les lots par d├®faut
      setSelectedLots(lotsList);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || "Erreur lors du chargement des lots";
      setError(errorMsg);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
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
      setError("Veuillez s├®lectionner au moins un lot");
      return;
    }
    onConfirm(selectedLots);
    handleClose();
  };

  const handleClose = () => {
    setSelectedLots([]);
    setError(null);
    onClose();
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
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader size={24} className="animate-spin text-[#FC8404]" />
              <p className="text-gray-600 dark:text-gray-300">Chargement des lots...</p>
            </div>
          ) : lots.length === 0 ? (
            <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300">
              ÔÜá´©Å Aucun lot trouv├® pour ce code dossier
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedLots.length === lots.length && lots.length > 0}
                  onChange={toggleAllLots}
                  className="w-5 h-5 rounded cursor-pointer accent-[#FC8404]"
                />
                <label
                  htmlFor="selectAll"
                  className="flex-1 cursor-pointer font-semibold text-gray-800 dark:text-gray-100"
                >
                  S├®lectionner tous ({lots.length} lots)
                </label>
              </div>

              {/* Lots List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {lots.map((lot) => (
                  <div
                    key={lot}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition border border-gray-200 dark:border-gray-700"
                  >
                    <input
                      type="checkbox"
                      id={`lot-${lot}`}
                      checked={selectedLots.includes(lot)}
                      onChange={() => toggleLot(lot)}
                      className="w-5 h-5 rounded cursor-pointer accent-[#FC8404]"
                    />
                    <label
                      htmlFor={`lot-${lot}`}
                      className="flex-1 cursor-pointer text-gray-700 dark:text-gray-200 font-medium"
                    >
                      {lot}
                    </label>
                    {selectedLots.includes(lot) && (
                      <Check size={20} className="text-green-500" />
                    )}
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Ôä╣´©Å Info :</strong> Vous avez s├®lectionn├® {selectedLots.length} lot(s)
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && lots.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a233e] sticky bottom-0 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-700 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedLots.length === 0}
              className="px-6 py-2.5 rounded-lg bg-[#FC8404] text-white font-semibold hover:bg-[#e67603] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Lancer la normalisation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectLotsModal;
