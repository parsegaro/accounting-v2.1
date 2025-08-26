import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  onFilesChange: (files: { name: string; dataUrl: string }[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange }) => {
  const [files, setFiles] = useState<{ name: string; dataUrl: string }[]>([]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFilesPromises = Array.from(selectedFiles).map(file => {
        return new Promise<{ name: string; dataUrl: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({ name: file.name, dataUrl: e.target?.result as string });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newFilesPromises).then(newFiles => {
        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
      });
    }
  }, [files, onFilesChange]);

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  return (
    <div className="border-2 border-dashed border-[var(--border-secondary)] rounded-lg p-4 text-center">
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="form-input block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/50 file:text-blue-300 hover:file:bg-blue-900"
      />
      {files.length > 0 && (
        <ul className="mt-4 text-sm text-[var(--text-primary)] text-right space-y-2">
          {files.map((file, index) => (
            <li key={index} className="flex justify-between items-center p-2 bg-[var(--bg-tertiary)] rounded-md">
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-400 hover:text-red-300 font-bold"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUpload;