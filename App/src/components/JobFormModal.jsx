import React from 'react';
import PublishJobModal from './PublishJobModal';

export default function JobFormModal({
  isOpen,
  onClose,
  onSave,
  onJobCreated,
  initialJob: _initialJob = null,
  currentUser: _currentUser = null
}) {
  const handleCreated = (job) => {
    if (onJobCreated && typeof onJobCreated === 'function') {
      onJobCreated(job);
    }
    if (onSave && typeof onSave === 'function') {
      onSave(job);
    }
  };

  return (
    <PublishJobModal
      isOpen={isOpen}
      onClose={onClose}
      onJobCreated={handleCreated}
    />
  );
}
