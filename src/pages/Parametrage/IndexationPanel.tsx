import { useState } from "react";
import { X, Loader } from "lucide-react";

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

interface IndexationPanelProps {
  champs: Champ[];
  loadingChamps: boolean;
  groupes: Groupe[];
  selectedGroupChamps: string[];
  newGroupParams: { separateur?: string; position?: string };
  onAddGroupe: () => void;
  onRemoveGroupe: (index: number) => void;
  onSaveIndexation: () => void;
  onClose: () => void;
  onSelectedGroupChampsChange: (champs: string[]) => void;
  onNewGroupParamsChange: (params: { separateur?: string; position?: string }) => void;
  error: string | null;
}

const IndexationPanel: React.FC<IndexationPanelProps> = ({
  champs,
  loadingChamps,
  groupes,
  selectedGroupChamps,
  newGroupParams,
  onAddGroupe,
  onRemoveGroupe,
  onSaveIndexation,
  onClose,
  onSelectedGroupChampsChange,
  onNewGroupParamsChange,
  error,
}) => {
  const buildIndexationName = () => {
    let result = "";

    groupes.forEach((groupe) => {
      result += groupe.champs.join(groupe.parametres?.separateur || "");
      result += groupe.parametres?.separateur || "";
    });

    if (selectedGroupChamps.length > 0) {
      result += selectedGroupChamps.join(newGroupParams.separateur || "");
      result += newGroupParams.separateur || "";
    }

    if (result && newGroupParams.separateur) {
      result = result.slice(0, -newGroupParams.separateur.length);
    }

    return result;
  };

  const indexationName = buildIndexationName();

  return (
    <div className="p-4 rounded-lg bg-blue-50 dark:bg-[#2a3570]/50 border border-blue-200 dark:border-blue-800 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Configuration de l'indexation
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#1f2d55] transition"
          aria-label="Fermer la configuration de l'indexation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nom de l'indexation */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Nom de l'indexation
        </label>
        <div className="rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#1f2a5a] px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono flex items-center justify-between">
          <span>
            {indexationName || (
              <span className="text-gray-500 dark:text-gray-400 italic">
                Aucun champ sélectionné
              </span>
            )}
          </span>
          <span className="text-gray-600 dark:text-gray-400 font-semibold">
            .pdf
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Prévisualisation : sélectionnez des champs et un séparateur pour voir
          le résultat
        </p>
      </div>

      {/* Affichage des groupes créés */}
      {groupes.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
            Groupes créés ({groupes.length})
          </h5>
          <div className="space-y-2">
            {groupes.map((groupe, index) => (
              <div
                key={`groupe-${index}`}
                className="flex justify-between items-start p-2 bg-white dark:bg-[#1f2a5a] rounded border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Ordre: {groupe.ordre}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Champs: {groupe.champs.join(", ")}
                  </p>

                  {groupe.parametres && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 space-y-0">
                      {groupe.parametres.separateur && (
                        <div>
                          Séparateur:{" "}
                          <span className="font-mono">
                            {groupe.parametres.separateur}
                          </span>
                        </div>
                      )}

                      {groupe.parametres.position !== undefined && (
                        <div>
                          Position:{" "}
                          <span className="font-mono">
                            {groupe.parametres.position}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onRemoveGroupe(index)}
                  className="ml-2 px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sélectionner champs pour nouveau groupe */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Sélectionner champs pour nouveau groupe
        </label>

        <div className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f173a] p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Champs disponibles
          </div>

          {loadingChamps ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader size={16} className="animate-spin text-[#FC8404]" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Chargement des champs...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {champs.length > 0 ? (
                champs.map((champ) => (
                  <label
                    key={champ.idq}
                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-[#1c284b]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupChamps.includes(champ.idq)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectedGroupChampsChange([
                            ...selectedGroupChamps,
                            champ.idq,
                          ]);
                        } else {
                          onSelectedGroupChampsChange(
                            selectedGroupChamps.filter(
                              (c) => c !== champ.idq
                            )
                          );
                        }
                      }}
                      className="w-4 h-4 cursor-pointer accent-[#FC8404]"
                    />
                    {champ.idq}
                  </label>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Aucun champ disponible pour ce dossier.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Séparateur et Position */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
            Séparateur (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex: _"
            value={newGroupParams.separateur || ""}
            onChange={(e) =>
              onNewGroupParamsChange({
                ...newGroupParams,
                separateur: e.target.value,
              })
            }
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f173a] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
            Position (index, optionnel)
          </label>
          <input
            type="number"
            min="0"
            placeholder="Ex: 0"
            value={newGroupParams.position || ""}
            onChange={(e) =>
              onNewGroupParamsChange({
                ...newGroupParams,
                position: e.target.value,
              })
            }
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f173a] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bouton Ajouter Groupe */}
      <button
        type="button"
        onClick={onAddGroupe}
        disabled={selectedGroupChamps.length === 0}
        className="w-full px-3 py-2 rounded bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        + Ajouter groupe
      </button>

      {/* Bouton Enregistrer */}
      <button
        onClick={onSaveIndexation}
        disabled={groupes.length === 0}
        className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Enregistrer l'indexation
      </button>
    </div>
  );
};

export default IndexationPanel;