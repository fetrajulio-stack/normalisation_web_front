import { useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import api from "../../services/api";

export interface Champ {
  idq: string;
  defaut: string | null;
}

export interface DatamapField extends Champ {
  position: number;
  longueur: number;
}

interface DatamapProps {
  champs: Champ[];
  codificationId: number | null;
  isEtudes: boolean;
  disabled?: boolean;
}

const Datamap = ({ champs, codificationId, isEtudes, disabled = false }: DatamapProps) => {
  const [showModal, setShowModal] = useState(false);
  const [datamap, setDatamap] = useState<DatamapField[]>([]);

  const loadDatamap = useCallback(async () => {
    try {
      const res = await api.get(`/parametre/datamap`, {
        params: { codification_id: codificationId }
      });
      const savedDatamap = res.data.datamap || [];
      setDatamap(
        champs.map((champ) => {
          const saved = savedDatamap.find((s: DatamapField) => s.idq === champ.idq);
          return {
            ...champ,
            position: saved?.position || 0,
            longueur: saved?.longueur || 10,
          };
        })
      );
    } catch (err) {
      // No saved datamap, use defaults
      console.warn("No existing datamap, using defaults", err);
      setDatamap(
        champs.map((champ) => ({
          ...champ,
          position: 0,
          longueur: 10,
        }))
      );
    }
  }, [champs, codificationId]);


  const updateDatamapField = useCallback((idq: string, field: 'position' | 'longueur', value: number) => {
    console.log("🔥 updateDatamapField called:", { idq, field, value });
    
    setDatamap((prev) => {
      // D'abord, mettre à jour le champ modifié
      const updated = prev.map((f) =>
        f.idq === idq ? { ...f, [field]: value } : f
      );

      console.log("📝 datamap updated:", { idq, field, value, updatedDatamap: updated });

      // Ensuite, vérifier si on doit auto-calculer la Position du champ suivant
      const currentIndex = updated.findIndex((f) => f.idq === idq);
      const currentField = updated[currentIndex];
      
      console.log("🔍 Checking auto-calc conditions:", {
        currentIndex,
        currentField,
        isValid: currentField.position > 0 && currentField.longueur > 0,
        hasNext: currentIndex < updated.length - 1
      });

      // Auto-calcul si :
      // 1. Ce n'est pas le dernier champ
      // 2. Position ET Longueur du champ actuel sont valides (> 0)
      if (currentIndex < updated.length - 1 && currentField.position > 0 && currentField.longueur > 0) {
        const nextPosition = currentField.position + currentField.longueur;
        console.log(`✅ Auto-calc triggered: Next position = ${currentField.position} + ${currentField.longueur} = ${nextPosition}`);
        
        // Toujours mettre à jour la Position du champ suivant
        return updated.map((f, idx) =>
          idx === currentIndex + 1 ? { ...f, position: nextPosition } : f
        );
      }

      console.log("⏭️ No auto-calc needed");
      return updated;
    });
  }, []);

  const handleSaveDatamap = async () => {
    if (!codificationId) {
      alert("Aucune codification sélectionnée");
      return;
    }
    if (datamap.some((f) => f.position === 0 || f.longueur === 0)) {
      if (!confirm("Certains champs ont position/longueur = 0. Enregistrer quand même ?")) {
        return;
      }
    }
    try {
      await api.post("/parametre/datamap", {
        codification_id: codificationId,
        datamap: datamap.map(({ idq, position, longueur }) => ({ idq, position, longueur })),
      });
      alert("Datamap enregistré avec succès !");
      setShowModal(false);
    } catch (err: any) {
      alert(`Erreur: ${err.response?.data?.message || "Échec de l'enregistrement"}`);
    }
  };


  const handleOpenDatamap = async () => {
    if (!codificationId) {
      alert("Validez d'abord un dossier");
      return;
    }
    if (champs.length === 0) {
      alert("Chargez d'abord les champs");
      return;
    }
    await loadDatamap();
    setShowModal(true);
  };


  if (disabled) return null;

  return (
    <>
      <button
        onClick={handleOpenDatamap}
        disabled={!codificationId || isEtudes}
        className={`w-full py-6 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition ${
          (!codificationId || isEtudes)
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700"
        }`}
      >
        📊
        Datamap
      </button>

      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0f173a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-[#0f173a] z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Configuration Datamap
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  <strong>ℹ️ Automatisation activée:</strong> Quand vous changez la "Longueur", la "Position" du champ suivant se calcule automatiquement (Position actuelle + Longueur actuelle)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Codification ID: {codificationId}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {datamap.map((field, index) => (
                    <div key={field.idq} className="space-y-2 p-3 bg-gray-50 dark:bg-[#1f2a5a] rounded-lg border border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        {field.idq}
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({index + 1}/{datamap.length})</span>
                      </label>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Position</label>
                          <input
                            type="number"
                            min="0"
                            value={field.position}
                            onChange={(e) => updateDatamapField(field.idq, 'position', Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f173a] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Longueur</label>
                          <input
                            type="number"
                            min="0"
                            value={field.longueur}
                            onChange={(e) => updateDatamapField(field.idq, 'longueur', Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f173a] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1a233e] sticky bottom-0 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveDatamap}
                  className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Enregistrer
                </button>

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Datamap;

