import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useAppContext } from '../../context/AppContext';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: number | string;
  currentTags: string[];
}

const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose, entityType, entityId, currentTags }) => {
  const { allTags, updateTags } = useAppContext();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedTags(currentTags);
    }
  }, [isOpen, currentTags]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag]);
      setNewTag('');
    }
  };

  const handleSave = () => {
    updateTags(entityType, entityId, selectedTags);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`مدیریت تگ‌ها`}>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2 text-[var(--text-primary)]">تگ‌های موجود</h4>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => handleToggleTag(tag)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedTags.includes(tag) ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleAddNewTag} className="flex space-x-2 space-x-reverse border-t border-[var(--border-primary)] pt-4">
          <input 
            type="text" 
            value={newTag} 
            onChange={e => setNewTag(e.target.value)}
            placeholder="ایجاد تگ جدید"
            className="form-input flex-grow"
          />
          <button type="submit" className="btn btn-secondary">افزودن</button>
        </form>
        <div className="flex justify-end pt-4 space-x-2 space-x-reverse border-t border-[var(--border-primary)]">
            <button onClick={onClose} className="btn btn-secondary">لغو</button>
            <button onClick={handleSave} className="btn btn-primary">ذخیره تگ‌ها</button>
        </div>
      </div>
    </Modal>
  );
};

export default TagManager;