import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, FileText, Send } from 'lucide-react';
import api from '../../utils/api';
import { showToast as toast } from '../../utils/toast';

const SubmitEvidenceModal = ({ task, onClose, onSuccess }) => {
    const [description, setDescription] = useState('');
    const [evidenceType, setEvidenceType] = useState('mixed');
    const [notes, setNotes] = useState('');
    const [urls, setUrls] = useState(['']);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleAddUrl = () => {
        setUrls([...urls, '']);
    };

    const handleUrlChange = (index, value) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const handleRemoveUrl = (index) => {
        setUrls(urls.filter((_, i) => i !== index));
    };

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            toast.error('Please provide a description of your work');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('taskId', task._id);
            formData.append('newStatus', 'review'); // Changed from 'completed' to 'review'
            formData.append('description', description);
            formData.append('evidenceType', evidenceType);
            formData.append('notes', notes);

            // Add files
            files.forEach(file => {
                formData.append('files', file);
            });

            // Add URLs
            urls.forEach((url, index) => {
                if (url.trim()) {
                    formData.append(`urls[${index}]`, url.trim());
                }
            });

            const response = await api.post('/tasks/update-with-evidence', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('Evidence submitted! Task sent for manager review.');
                onSuccess();
            }
        } catch (error) {
            console.error('Error submitting evidence:', error);
            toast.error(error.response?.data?.message || 'Failed to submit task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl mx-4 my-8">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-400" />
                            Submit Task Evidence
                        </h3>
                        <p className="text-sm text-zinc-400 mt-0.5">Provide proof of your completed work</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Task Info */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-1">{task?.title}</h4>
                        {task?.description && (
                            <p className="text-sm text-zinc-300 line-clamp-2">{task.description}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Work Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what you accomplished, how you completed the task, any challenges faced..."
                            rows={4}
                            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-zinc-500 resize-none"
                        />
                    </div>

                    {/* Evidence Type */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Evidence Type
                        </label>
                        <select
                            value={evidenceType}
                            onChange={(e) => setEvidenceType(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                        >
                            <option value="mixed">Mixed (Files + Links)</option>
                            <option value="files">Files Only</option>
                            <option value="links">Links Only</option>
                            <option value="text">Text Description Only</option>
                        </select>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Upload Files (Screenshots, Documents, etc.)
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg hover:border-green-500 transition-colors cursor-pointer"
                            >
                                <Upload className="h-5 w-5 text-zinc-400" />
                                <span className="text-sm text-zinc-300">
                                    {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload files'}
                                </span>
                            </label>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {files.map((file, index) => (
                                    <div key={index} className="text-xs text-zinc-400 flex items-center gap-2">
                                        <FileText className="h-3 w-3" />
                                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* URLs */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Evidence Links (GitHub, Demo, Documentation, etc.)
                        </label>
                        <div className="space-y-2">
                            {urls.map((url, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => handleUrlChange(index, e.target.value)}
                                            placeholder="https://..."
                                            className="w-full pl-10 pr-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-zinc-500"
                                        />
                                    </div>
                                    {urls.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveUrl(index)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleAddUrl}
                            className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            + Add another link
                        </button>
                    </div>

                    {/* Additional Notes */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional context, notes, or comments..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-zinc-500 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-white/10 bg-zinc-900/50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!description.trim() || loading}
                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        )}
                        <Send className="h-4 w-4" />
                        Submit Evidence
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitEvidenceModal;
