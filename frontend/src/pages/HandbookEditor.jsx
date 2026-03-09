import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Plus, Trash2, GripVertical, Eye, Send, CheckCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import handbookService from '../services/handbookService';
import toast from 'react-hot-toast';

const HandbookEditor = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [handbook, setHandbook] = useState({
        title: '',
        subtitle: '',
        department: 'development',
        sections: [],
        status: 'draft'
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id && id !== 'new') {
            fetchHandbook();
        }
    }, [id]);

    const fetchHandbook = async () => {
        try {
            setLoading(true);
            const response = await handbookService.getById(id);
            setHandbook(response.data);
        } catch (error) {
            console.error('Error fetching handbook:', error);
            toast.error('Failed to load handbook');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            if (!handbook.title || !handbook.department || handbook.sections.length === 0) {
                toast.error('Please fill in all required fields and add at least one section');
                return;
            }

            if (id && id !== 'new') {
                await handbookService.update(id, handbook);
                toast.success('Handbook updated successfully');
            } else {
                const response = await handbookService.create(handbook);
                toast.success('Handbook created successfully');
                navigate(`/handbooks/edit/${response.data._id}`);
            }
        } catch (error) {
            console.error('Error saving handbook:', error);
            toast.error('Failed to save handbook');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!id || id === 'new') {
            toast.error('Please save the handbook first');
            return;
        }

        try {
            await handbookService.submitForApproval(id);
            toast.success('Handbook submitted for approval');
            fetchHandbook();
        } catch (error) {
            toast.error('Failed to submit for approval');
        }
    };

    const handleApprove = async () => {
        const notes = prompt('Approval notes (optional):');

        try {
            await handbookService.approve(id, notes);
            toast.success('Handbook approved');
            fetchHandbook();
        } catch (error) {
            toast.error('Failed to approve handbook');
        }
    };

    const handlePublish = async () => {
        if (!confirm('Are you sure you want to publish this handbook? It will be synced to the RAG system.')) {
            return;
        }

        try {
            await handbookService.publish(id);
            toast.success('Handbook published and queued for RAG sync');
            fetchHandbook();
        } catch (error) {
            toast.error('Failed to publish handbook');
        }
    };

    const addSection = () => {
        setHandbook({
            ...handbook,
            sections: [
                ...handbook.sections,
                {
                    sectionId: `section-${Date.now()}`,
                    title: 'New Section',
                    content: '',
                    order: handbook.sections.length,
                    principles: [],
                    tags: [],
                    visibleToRoles: ['all']
                }
            ]
        });
    };

    const updateSection = (index, field, value) => {
        const newSections = [...handbook.sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setHandbook({ ...handbook, sections: newSections });
    };

    const removeSection = (index) => {
        if (!confirm('Are you sure you want to remove this section?')) return;

        const newSections = handbook.sections.filter((_, i) => i !== index);
        setHandbook({ ...handbook, sections: newSections });
    };

    const moveSection = (index, direction) => {
        const newSections = [...handbook.sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newSections.length) return;

        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        newSections.forEach((section, i) => section.order = i);

        setHandbook({ ...handbook, sections: newSections });
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link'],
            ['clean']
        ]
    };

    const sidebarActions = [
        {
            label: 'Back to List',
            icon: X,
            onClick: () => navigate('/handbooks'),
            active: false
        }
    ];

    if (loading) {
        return (
            <DashboardLayout sidebarActions={sidebarActions}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebarActions={sidebarActions}>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header with Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {id === 'new' ? 'Create Handbook' : 'Edit Handbook'}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Status: <span className="font-semibold capitalize">{handbook.status?.replace('_', ' ')}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {handbook.status === 'draft' && (
                                <button
                                    onClick={handleSubmitForApproval}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                                    disabled={!id || id === 'new'}
                                >
                                    <Send className="h-4 w-4" />
                                    Submit for Approval
                                </button>
                            )}

                            {handbook.status === 'pending_approval' && ['ceo', 'hr'].includes(user?.role) && (
                                <button
                                    onClick={handleApprove}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                </button>
                            )}

                            {handbook.status === 'approved' && (
                                <button
                                    onClick={handlePublish}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    Publish
                                </button>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={handbook.title}
                                onChange={(e) => setHandbook({ ...handbook, title: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Development Team Handbook"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={handbook.department}
                                onChange={(e) => setHandbook({ ...handbook, department: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="development">Development</option>
                                <option value="sales">Sales</option>
                                <option value="hr">HR</option>
                                <option value="operations">Operations</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtitle
                        </label>
                        <input
                            type="text"
                            value={handbook.subtitle || ''}
                            onChange={(e) => setHandbook({ ...handbook, subtitle: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Brief description or tagline"
                        />
                    </div>
                </div>

                {/* Sections */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Sections</h2>
                        <button
                            onClick={addSection}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Section
                        </button>
                    </div>

                    {handbook.sections.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No sections yet. Click "Add Section" to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {handbook.sections.map((section, index) => (
                                <div key={section.sectionId} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col gap-2 pt-2">
                                            <button
                                                onClick={() => moveSection(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                            >
                                                <GripVertical className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => moveSection(index, 'down')}
                                                disabled={index === handbook.sections.length - 1}
                                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                            >
                                                <GripVertical className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Section Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={section.title}
                                                    onChange={(e) => updateSection(index, 'title', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Section title"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Content
                                                </label>
                                                <ReactQuill
                                                    theme="snow"
                                                    value={section.content}
                                                    onChange={(content) => updateSection(index, 'content', content)}
                                                    modules={quillModules}
                                                    className="bg-white"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Tags (comma-separated)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={section.tags?.join(', ') || ''}
                                                        onChange={(e) => updateSection(index, 'tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                                        placeholder="tag1, tag2, tag3"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Visible To
                                                    </label>
                                                    <select
                                                        value={section.visibleToRoles?.[0] || 'all'}
                                                        onChange={(e) => updateSection(index, 'visibleToRoles', [e.target.value])}
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="all">All Roles</option>
                                                        <option value="developer">Developers Only</option>
                                                        <option value="hr">HR Only</option>
                                                        <option value="manager">Managers Only</option>
                                                        <option value="ceo">CEO Only</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeSection(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Save Button at Bottom */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={() => navigate('/handbooks')}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Handbook'}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HandbookEditor;
