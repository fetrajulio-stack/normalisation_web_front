import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { X, Upload, Search, ChevronDown, Check } from 'lucide-react';

interface MergeExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    dossierName: string;   // Ajout du nom du dossier (ex: ALZHEIMER)
    codeDossier: string;   // Ajout du code (ex: TYPE1)
}

const MergeExcelModal = ({ isOpen, onClose, dossierName, codeDossier }: MergeExcelModalProps) => {
    const [files, setFiles] = useState<File[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [selectedKey, setSelectedKey] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFiles([]);
            setColumns([]);
            setSelectedKey("");
            setSearchTerm("");
            setIsDropdownOpen(false);
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredColumns = useMemo(() => {
        return columns.filter(col => 
            col.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [columns, searchTerm]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length >= 2) {
            const fileList = Array.from(e.target.files);
            setFiles(fileList);

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = evt.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                    
                    if (json.length > 0) {
                        const headers = json[0].filter(h => h != null && h !== "").map(String);
                        setColumns(headers);
                        if (headers.includes("N_LOT")) setSelectedKey("N_LOT");
                    }
                } catch (err) { console.error(err); }
            };
            reader.readAsBinaryString(fileList[0]);
        }
    };

    const handleUpload = async () => {
        setLoading(true);
        const formData = new FormData();
        files.forEach(f => formData.append('files[]', f));
        formData.append('joinKey', selectedKey);
        
        // Envoi des infos de dossier pour le backend
        formData.append('dossier', dossierName);
        formData.append('codeDossier', codeDossier);

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await axios.post(`${apiUrl}merge-excel`, formData, {
                responseType: 'blob',
                timeout: 0 
            });

            // Création du nom de fichier dynamique côté client
            const fileName = `Fusion_${dossierName}_${codeDossier}.xlsx`;
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); 
            document.body.appendChild(link);
            link.click();
            link.remove();
            onClose();
        } catch (error) { 
            alert("Erreur lors de la fusion des fichiers"); 
        } finally { 
            setLoading(false); 
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0f173a] rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border dark:border-gray-700">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

                <h2 className="text-xl font-bold dark:text-white mb-6 flex gap-2 items-center">
                    <Upload className="text-[#FC8404]" /> Assemblage : {dossierName} ({codeDossier})
                </h2>
                
                <div className="space-y-6">
                    <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                        <label className="block text-sm font-semibold dark:text-gray-300 mb-2">Fichiers Excel sources</label>
                        <input type="file" ref={fileInputRef} multiple accept=".xlsx" onChange={handleFileChange} className="w-full text-sm text-gray-500" />
                    </div>

                    {columns.length > 0 && (
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-semibold dark:text-gray-300 mb-2">Colonne Pivot (ex: N_LOT)</label>
                            
                            <div 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f2a5a] dark:text-white flex justify-between items-center cursor-pointer hover:border-[#FC8404] transition-colors"
                            >
                                <span className={selectedKey ? "text-white" : "text-gray-400"}>
                                    {selectedKey || "Chercher une colonne..."}
                                </span>
                                <ChevronDown size={18} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isDropdownOpen && (
                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1f2a5a] border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl overflow-hidden">
                                    <div className="p-2 border-b dark:border-gray-600 flex items-center gap-2 bg-gray-50 dark:bg-[#161e46]">
                                        <Search size={16} className="text-gray-400" />
                                        <input 
                                            autoFocus
                                            type="text"
                                            placeholder="Rechercher..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-transparent outline-none text-sm dark:text-white"
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredColumns.length > 0 ? (
                                            filteredColumns.map((col, i) => (
                                                <div 
                                                    key={i}
                                                    onClick={() => {
                                                        setSelectedKey(col);
                                                        setIsDropdownOpen(false);
                                                        setSearchTerm("");
                                                    }}
                                                    className="px-4 py-2 text-sm dark:text-gray-200 hover:bg-[#FC8404] hover:text-white cursor-pointer flex justify-between items-center"
                                                >
                                                    {col}
                                                    {selectedKey === col && <Check size={14} />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 italic">Aucun résultat</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl font-bold">Annuler</button>
                        <button
                            onClick={handleUpload}
                            disabled={loading || files.length < 2 || !selectedKey}
                            className="flex-[2] py-3 bg-[#FC8404] text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
                        >
                            {loading ? "Calcul en cours..." : "Lancer l'assemblage"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MergeExcelModal;