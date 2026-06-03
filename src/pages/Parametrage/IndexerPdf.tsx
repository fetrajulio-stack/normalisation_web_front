import { useState } from "react";
import { X, Upload, FileText } from "lucide-react";
import api from "../../services/api";

interface Props {
  nomDossier: string;
  nomCodeDossier: string;
  onClose: () => void;
}

const IndexerPdf: React.FC<Props> = ({ nomDossier, nomCodeDossier, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

    const handleUpload = async () => {
    if (files.length === 0) {
        setMessage("Veuillez sélectionner des fichiers PDF");
        return;
    }

    const formData = new FormData();

    files.forEach((file) => {
        formData.append("pdfs[]", file);
    });

    formData.append("nom_dossier", nomDossier);
    formData.append("nom_code_dossier", nomCodeDossier);
    formData.append("target_folder", "Fichier_indexe");

    setLoading(true);
    setMessage(null);

    try {
        const res = await api.post("/upload-pdf-local", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        });

        if (res.data.success) {
        setMessage("Upload réussi !");
        setFiles([]);
        }
    } catch (err) {
        console.error(err);
        setMessage("Erreur lors de l'upload");
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0f173a] w-full max-w-lg rounded-xl shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">Importer PDF à indexer</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {message && (
            <div className="text-sm text-blue-600">{message}</div>
          )}

          <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 p-3 rounded">
            <Upload size={16} />
            <span>Sélectionner PDF</span>
            <input
              type="file"
              accept="application/pdf"
              multiple
              hidden
              onChange={handleSelectFiles}
            />
          </label>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <FileText size={14} />
                {file.name}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Annuler
          </button>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {loading ? "Upload..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndexerPdf;