import React, { useEffect } from 'react';

// Wrapper component that shows PersonalNotes in centered modal
const PersonalNotesModal = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            // Find and click the PersonalNotes button to open it
            const notesButton = document.querySelector('[title="Personal Notes"]');
            if (notesButton) {
                notesButton.click();
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Just show the blurred backdrop - PersonalNotes will render itself
    return (
        <div
            className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        />
    );
};

export default PersonalNotesModal;
