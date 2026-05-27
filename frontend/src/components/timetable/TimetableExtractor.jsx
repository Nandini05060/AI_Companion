import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Image as ImageIcon, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import api from '../../api';

export default function TimetableExtractor({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setError(null);
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxFiles: 1,
    multiple: false
  });

  const handleExtract = async () => {
    if (!file) return;
    
    setIsExtracting(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('timetableImage', file);

    try {
      const response = await api.post('/ai/extract-timetable', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onSuccess(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to extract timetable. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
      {/* Animated glow effect */}
      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-primary/10 to-transparent rotate-45 transform group-hover:translate-x-full transition-transform duration-1000"></div>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Upload Timetable
      </h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden min-h-[250px]
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary/50 hover:bg-white/5'}
          ${file ? 'p-2 border-none bg-black/40' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center pointer-events-none"
            >
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="font-semibold mb-1">Click to upload or drag & drop</p>
              <p className="text-xs text-textDim mb-4">PNG, JPG or WEBP (Max 5MB)</p>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full relative rounded-lg overflow-hidden group/preview"
            >
              <img 
                src={preview} 
                alt="Timetable preview" 
                className={`w-full h-[200px] object-cover rounded-lg ${isExtracting ? 'opacity-50 blur-sm' : ''} transition-all`} 
              />
              
              {!isExtracting && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={clearSelection}
                    className="px-4 py-2 bg-red-500/80 text-white rounded-lg font-medium hover:bg-red-500 backdrop-blur-sm"
                  >
                    Change Image
                  </button>
                </div>
              )}
              
              {isExtracting && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white bg-black/40 backdrop-blur-sm">
                   <Loader2 className="w-12 h-12 animate-spin text-primary mb-3" />
                   <p className="font-bold text-lg animate-pulse tracking-wide">AI is analyzing...</p>
                   <p className="text-xs text-white/70 mt-1">Extracting schedules and rooms</p>
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-start gap-2 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      <button
        onClick={handleExtract}
        disabled={!file || isExtracting}
        className={`w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
          ${!file || isExtracting 
            ? 'bg-white/10 text-white/50 cursor-not-allowed' 
            : 'bg-gradient-to-r from-primary to-primaryHover text-white hover:shadow-primary/25'}
        `}
      >
        {isExtracting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing via GPT-4o...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Extract Timetable
          </>
        )}
      </button>
    </div>
  );
}
