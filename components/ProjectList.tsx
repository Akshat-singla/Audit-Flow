'use client';

import { useState, useCallback, memo } from 'react';
import { useStore } from '@/lib/store';
import { announceToScreenReader } from '@/lib/accessibility';

function ProjectList() {
    const { projects, selectedProjectId, selectProject, createProject, deleteProject } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSelectProject = useCallback((projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        selectProject(projectId);
        if (project) {
            announceToScreenReader(`Project ${project.name} selected`);
        }
    }, [projects, selectProject]);

    const handleCreateClick = useCallback(() => {
        setIsCreating(true);
        setFormData({ name: '', description: '' });
        setErrors({});
    }, []);

    const handleCancelCreate = useCallback(() => {
        setIsCreating(false);
        setFormData({ name: '', description: '' });
        setErrors({});
    }, []);

    const handleInputChange = useCallback((field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    const handleSubmitCreate = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Project name is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            createProject(formData.name.trim(), formData.description.trim());
            announceToScreenReader(`Project ${formData.name} created successfully`);

            setIsCreating(false);
            setFormData({ name: '', description: '' });
            setErrors({});
        } catch (error) {
            console.error('Failed to create project:', error);
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                setErrors({ name: error.message });
                announceToScreenReader('Failed to create project: Storage quota exceeded');
            } else {
                setErrors({ name: 'Failed to create project. Please try again.' });
                announceToScreenReader('Failed to create project');
            }
        }
    }, [formData, createProject]);

    const handleDeleteProject = useCallback((projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const project = projects.find(p => p.id === projectId);
        if (confirm('Are you sure you want to delete this project? This will also delete all associated deployment history.')) {
            deleteProject(projectId);
            if (project) {
                announceToScreenReader(`Project ${project.name} deleted`);
            }
        }
    }, [projects, deleteProject]);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Projects
                    </h2>
                    {!isCreating && (
                        <button
                            onClick={handleCreateClick}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Create new project"
                            title="Create new project"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {projects.length === 0 && !isCreating ? (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No projects yet. Create one to get started.
                    </div>
                ) : (
                    <div className="p-2">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleSelectProject(project.id)}
                                className={`group relative p-3 mb-2 rounded-lg cursor-pointer transition-colors ${selectedProjectId === project.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSelectProject(project.id);
                                    }
                                }}
                                aria-label={`Select project ${project.name}`}
                                aria-pressed={selectedProjectId === project.id}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-medium truncate ${selectedProjectId === project.id
                                            ? 'text-blue-700 dark:text-blue-300'
                                            : 'text-gray-900 dark:text-gray-100'
                                            }`}>
                                            {project.name}
                                        </h3>
                                        {project.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {new Date(project.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteProject(project.id, e)}
                                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                                        aria-label={`Delete project ${project.name}`}
                                        title="Delete project"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isCreating && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Create New Project
                    </h3>
                    <form onSubmit={handleSubmitCreate} className="space-y-3">
                        <div>
                            <label
                                htmlFor="project-name"
                                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                Name *
                            </label>
                            <input
                                id="project-name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${errors.name
                                    ? 'border-red-500 dark:border-red-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                placeholder="My Smart Contract"
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? 'name-error' : undefined}
                                autoFocus
                            />
                            {errors.name && (
                                <p id="name-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="project-description"
                                className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                Description
                            </label>
                            <textarea
                                id="project-description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                                placeholder="Optional description"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancelCreate}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label="Cancel creating project"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label="Create project"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default memo(ProjectList);
