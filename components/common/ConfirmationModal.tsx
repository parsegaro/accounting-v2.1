
import React from 'react';
import { Modal } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-[var(--text-secondary)]">{message}</p>
        <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
          <button onClick={onClose} className="btn btn-secondary">
            لغو
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            تایید و حذف
          </button>
        </div>
      </div>
    </Modal>
  );
};