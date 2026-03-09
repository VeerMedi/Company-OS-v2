import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { History, RotateCcw, Eye, X, Calendar, User } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import handbookService from '../services/handbookService';
import toast from 'react-hot-toast';

const HandbookVersionHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [versions, setVersions] = useState([]);
    const [handbook, setHandbook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedVersion, setSelectedVersion] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [handbookRes, versionsRes] = await Promise.all([
                handbookService.getById(id),
                handbookService.getVersions(id)
            ]);

            setHandbook(handbookRes.data);
            setVersions(versionsRes.data);
        } catch (error) {
            console.error('Error fetching version history:', error);
            toast.error('Failed to load version history');
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = async (versionNumber) => {
        if (!confirm(`Are you sure you want to rollback to version ${versionNumber}? This will create a new version with the old content.`)) {
            return;
        }

        try {
            await handbookService.rollback(id, versionNumber);
            toast.success(`Rolled back to version ${versionNumber}`);
            navigate(`/handbooks/edit/${id}`);
        } catch (error) {
            console.error('Error rolling back:', error);
            toast.error('Failed to rollback version');
        }
    };

    const handleViewVersion = (version) => {
        setSelectedVersion(version);
    };

    const sidebarActions = [
        {
            label: 'Back to Handbook',
            icon: X,
            onClick: () => navigate(`/handbooks/edit/${id}`),
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
            <div className="p-6 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Version History</h1>
                    <p className="text-gray-600">{handbook?.title}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Version List */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <History className="h-5 w-5" />
                            All Versions
                        </h2>

                        {versions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No version history available</p>
                        ) : (
                            <div className="space-y-3">
                                {versions.map((version) => (
                                    <div
                                        key={version._id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedVersion?._id === version._id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        onClick={() => handleViewVersion(version)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-lg">
                                                Version {version.versionNumber}
                                            </span>
                                            {version.versionNumber === handbook?.currentVersion && (
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                                                    Current
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {version.changedBy?.firstName} {version.changedBy?.lastName}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(version.createdAt).toLocaleString()}
                                            </div>
                                        </div>

                                        {version.changesSummary && (
                                            <p className="text-sm text-gray-700 mt-2 italic">
                                                "{version.changesSummary}"
                                            </p>
                                        )}

                                        {version.approvedBy && (
                                            <div className="mt-2 text-xs text-green-600">
                                                ✓ Approved by {version.approvedBy.firstName} {version.approvedBy.lastName}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewVersion(version);
                                                }}
                                                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                                            >
                                                <Eye className="h-3 w-3" />
                                                View
                                            </button>
                                            {version.versionNumber !== handbook?.currentVersion && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRollback(version.versionNumber);
                                                    }}
                                                    className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center gap-1"
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                    Rollback
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Version Preview */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Version Details</h2>

                        {!selectedVersion ? (
                            <div className="text-center py-12 text-gray-500">
                                <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p>Select a version to view details</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-b pb-4">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {selectedVersion.snapshot.title}
                                    </h3>
                                    {selectedVersion.snapshot.subtitle && (
                                        <p className="text-gray-600">{selectedVersion.snapshot.subtitle}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                        <span className="capitalize">
                                            <strong>Department:</strong> {selectedVersion.snapshot.department}
                                        </span>
                                        <span>
                                            <strong>Sections:</strong> {selectedVersion.snapshot.sections?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3">Sections:</h4>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {selectedVersion.snapshot.sections?.map((section, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                <h5 className="font-semibold text-gray-900 mb-2">{section.title}</h5>
                                                <div
                                                    className="text-sm text-gray-700 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: section.content }}
                                                />
                                                {section.tags && section.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {section.tags.map((tag, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedVersion.versionNumber !== handbook?.currentVersion && (
                                    <button
                                        onClick={() => handleRollback(selectedVersion.versionNumber)}
                                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Rollback to This Version
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HandbookVersionHistory;
