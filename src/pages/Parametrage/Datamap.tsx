import { useState, useCallback, useRef } from "react";
import { CheckCircle, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setDatamap((prev) => {
      const updated = prev.map((f) =>
        f.idq === idq ? { ...f, [field]: value } : f
      );

      if (field !== 'longueur') return updated;

      const currentIndex = updated.findIndex((f) => f.idq === idq);
      const currentField = updated[currentIndex];

      if (currentIndex < updated.length - 1 && currentField.position >= 0 && currentField.longueur > 0) {
        const nextPosition = currentField.position + currentField.longueur;
        return updated.map((f, idx) =>
          idx === currentIndex + 1 ? { ...f, position: nextPosition } : f
        );
      }

      return updated;
    });
  }, []);

  // Fonction pour normaliser les noms de champ
  const normalizeColumnName = (name: string): string => {
    return name
      .toLowerCase()                      // Convertir en minuscules
      .replace(/[ /=-]/g, "_")            // Remplacer les espaces, /, = et - par _
      .replace(/_+/g, "_")                // Remplacer les doublons de _ par un seul _
    //  .trim("_");                         // Supprimer les _ en début et fin de chaîne
      .replace(/^_+|_+$/g, "");           // Supprimer les _ en début et fin de chaîne
  };

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

    // Appliquer la normalisation des noms de champ
    const datamapToSend = datamap.map(({ idq, position, longueur }) => ({
      idq: normalizeColumnName(idq),  // Normalisation ici
      position,
      longueur
    }));

    try {
      await api.post("/parametre/datamap", {
        codification_id: codificationId,
        datamap: datamapToSend,
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

  // --------------------------
  // ✅ Fonction import Excel robuste
  // --------------------------
  const processExcelFile = useCallback(async (file: File) => {
    if (!codificationId) {
      alert("Aucune codification sélectionnée pour sauvegarder le datamap.");
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!jsonData || jsonData.length < 2) {
        alert("Le fichier Excel est vide ou ne contient pas assez de données.");
        return;
      }

      const rows = jsonData.slice(1); // Ignorer la première ligne si header

      const importedDatamap: DatamapField[] = rows
        .filter(row => row.length >= 3)
        .map((row) => {
          const position = parseInt(String(row[0] || '0'), 10);
          const longueur = parseInt(String(row[1] || '10'), 10);
          const idq = String(row[2] || '').trim();
          return { position, longueur, idq, defaut: null };
        })
        .filter(item => item.idq !== '');

      if (importedDatamap.length === 0) {
        console.log("jsonData brute:", jsonData);
        alert("Le fichier Excel ne contient aucune ligne valide pour le datamap.");
        return;
      }

      const invalidRows = importedDatamap.filter(f => f.position < 0 || f.longueur <= 0);
      if (invalidRows.length > 0) {
        console.log("Lignes invalides:", invalidRows);
        alert(`Certaines lignes contiennent des valeurs invalides (position < 0 ou longueur ≤ 0). Vérifiez la console.`);
        return;
      }

      // Recalcul automatique des positions
      for (let i = 1; i < importedDatamap.length; i++) {
        importedDatamap[i].position = importedDatamap[i - 1].position + importedDatamap[i - 1].longueur;
      }

      // Mise à jour état React
      setDatamap(prev =>
        prev.map(field => {
          const imported = importedDatamap.find(imp => imp.idq === field.idq);
          return imported ? { ...field, position: imported.position, longueur: imported.longueur } : field;
        })
      );

      // Envoi au backend
      const datamapToSend = importedDatamap.map(({ idq, position, longueur }) => ({
        idq: normalizeColumnName(idq),  // Normalisation ici
        position,
        longueur
      }));
      await api.post("/parametre/datamap", {
        codification_id: codificationId,
        datamap: datamapToSend,
      });

      alert(`Datamap importé et sauvegardé avec succès depuis "${file.name}"`);
      setDraggedFile(null);

    } catch (error) {
      console.error("Erreur lors du traitement du fichier Excel:", error);
      alert("Erreur lors du traitement du fichier Excel. Vérifiez le format des données.");
      setDraggedFile(null);
    }
  }, [codificationId]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv"
      ];
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setDraggedFile(file);
        processExcelFile(file);
      } else {
        alert("Veuillez déposer un fichier Excel valide (.xlsx, .xls ou .csv)");
      }
    }
  }, [processExcelFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv"
      ];
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setDraggedFile(file);
        processExcelFile(file);
      } else {
        alert("Veuillez sélectionner un fichier Excel valide (.xlsx, .xls ou .csv)");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processExcelFile]);

  const handleImportClick = useCallback(() => { fileInputRef.current?.click(); }, []);

  if (disabled) return null;

  return (
    <>
      <button onClick={handleOpenDatamap} disabled={!codificationId || isEtudes}
        className={`w-full py-6 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition ${(!codificationId || isEtudes) ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}>
        📊 Datamap
      </button>

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0f173a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-[#0f173a] z-10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Configuration Datamap</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900">✕</button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  <strong>ℹ️ Automatisation activée:</strong> Quand vous changez la "Longueur", la "Position" du champ suivant se calcule automatiquement
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Codification ID: {codificationId}</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {datamap.map((field, index) => (
                    <div key={field.idq} className="space-y-2 p-3 bg-gray-50 dark:bg-[#1f2a5a] rounded-lg border border-gray-200 dark:border-gray-600">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        {field.idq} <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({index + 1}/{datamap.length})</span>
                      </label>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Position</label>
                          <input type="number" min="0" value={field.position}
                            onChange={(e) => updateDatamapField(field.idq, 'position', Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f173a] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Longueur</label>
                          <input type="number" min="0" value={field.longueur}
                            onChange={(e) => updateDatamapField(field.idq, 'longueur', Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#0f173a] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1a233e] sticky bottom-0 flex justify-between items-center gap-3">
                <button
                  onClick={handleImportClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition ${isDragOver ? "bg-blue-600 text-white border-2 border-dashed border-blue-400" : "bg-green-600 text-white hover:bg-green-700"}`}
                  title="Glissez-déposez un fichier Excel ici ou cliquez pour sélectionner"
                >
                  <Upload size={18} />
                  Importer Excel Datamap
                  {draggedFile && <span className="text-xs">({draggedFile.name})</span>}
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400">Annuler</button>
                  <button onClick={handleSaveDatamap} className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 flex items-center gap-2">
                    <CheckCircle size={18} /> Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Datamap;