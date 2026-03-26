import { useState } from "react";
import { Upload, X, Loader } from "lucide-react";
import api from "../../services/api";

interface UploadExcelProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  selectedCodeDossierName?: string;
  codification_id?: number;
}

const UploadExcel: React.FC<UploadExcelProps> = ({ isOpen, onClose, tableName, selectedCodeDossierName, codification_id }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileNameError, setFileNameError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier que c'est bien un fichier Excel
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv"
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setError("Veuillez sélectionner un fichier Excel valide (.xlsx, .xls ou .csv)");
        setFileNameError(null);
        return;
      }

      // Vérifier le nom du fichier par rapport au code dossier sélectionné
      if (selectedCodeDossierName) {
        const fileName = selectedFile.name.split(".")[0]; // Récupérer le nom sans extension
        if (fileName !== selectedCodeDossierName) {
          setFileNameError(`Nom de fichier incorrect. Attendu: ${selectedCodeDossierName}`);
        } else {
          setFileNameError(null);
        }
      } else {
        setFileNameError(null);
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    // Vérifier qu'il n'y a pas d'erreur de nom de fichier
    if (fileNameError) {
      setError(fileNameError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Préparer le FormData avec le fichier
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tableName", tableName || "data_import");
      if (selectedCodeDossierName) {
        formData.append("codeDossierName", selectedCodeDossierName);
      }
      if (codification_id) {
        formData.append("codification_id", codification_id.toString());
      }

      // Envoyer le fichier au backend
      const response = await api.post("/excel/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setSuccess(true);
      setFile(null);
      
      // Afficher un message de succès
      const message = response.data?.message || "Fichier importé avec succès !";
      setTimeout(() => {
        alert(message);
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Erreur lors de l'import";
      setError(errorMsg);
      console.error("Erreur:", err);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setFileNameError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0f173a] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-[#0f173a]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Importer un fichier Excel
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
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

          {fileNameError && (
            <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300">
              ⚠️ {fileNameError}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 flex items-center gap-2">
              <span>✓</span> Fichier traité avec succès !
            </div>
          )}

          {/* File Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Sélectionner un fichier Excel
            </label>
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#FC8404] dark:hover:border-[#FC8404] transition cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-[#FC8404]" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {file ? file.name : "Cliquez ou glissez un fichier"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Formats acceptés : .xlsx, .xls, .csv
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>ℹ️ Note :</strong> Le fichier sera traité et enregistré dans la base de données par le serveur.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a233e] sticky bottom-0 flex justify-end gap-3">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading || !!fileNameError}
            className="px-6 py-2.5 rounded-lg bg-[#FC8404] text-white font-semibold hover:bg-[#e67603] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Importation...
              </>
            ) : (
              <>
                <Upload size={18} />
                Importer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadExcel;
