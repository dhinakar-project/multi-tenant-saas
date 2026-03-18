
import { useAuth } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import api, { setClerkTokenGetter } from '../api/api';
import ErrorCard from '../components/ErrorCard';

function Projects() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { tenantSlug, isAdmin } = useTenant();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (isLoaded && isSignedIn) setClerkTokenGetter(getToken);
    }, [isLoaded, isSignedIn, getToken]);

    useEffect(() => {
        if (isLoaded && isSignedIn && tenantSlug) {
            fetchProjects();
        }
    }, [isLoaded, isSignedIn, tenantSlug]);

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/projects');
            setProjects(res.data.content || res.data || []);
        } catch (e) {
            setError(e.response?.data?.message || e.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setFormError(null);
        setFormLoading(true);
        try {
            await api.post('/projects', formData);
            setIsCreating(false);
            setFormData({ name: '', description: '' });
            fetchProjects();
        } catch (e) {
            setFormError(e.response?.data?.message || 'Failed to create project');
        } finally {
            setFormLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <ErrorCard title="Access Denied" message="Only Tenant Admins can manage projects." />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Projects</h1>
                    <p className="text-slate-400">Manage portfolios and organize tickets by project category.</p>
                </div>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center gap-2">
                        <span>+</span> New Project
                    </button>
                )}
            </div>

            {/* Create Project Form */}
            {isCreating && (
                <div className="glass-card-dark p-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">🏗️</span> Create Project
                        </h2>
                        <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white transition-colors p-2">✕</button>
                    </div>

                    {formError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleCreateProject} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Project Name <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Q3 Marketing Launch"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                            <textarea
                                placeholder="Brief overview of the project goals..."
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all h-24 resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="btn-primary px-8"
                            >
                                {formLoading ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Project List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <ErrorCard title="Failed to load projects" message={error} onRetry={fetchProjects} />
            ) : projects.length === 0 && !isCreating ? (
                <div className="glass-card-dark flex flex-col items-center justify-center p-16 text-center border border-slate-800/60">
                    <div className="text-4xl mb-4 opacity-50">🏗️</div>
                    <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
                    <p className="text-slate-400 mb-6 max-w-sm">Projects help you organize tickets and manage workflows across multiple initiatives.</p>
                    <button onClick={() => setIsCreating(true)} className="btn-primary">Create Your First Project</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {projects.map((p, idx) => (
                        <div key={p.id}
                            className="glass-card-dark p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                            style={{ animation: `fadeInUp 300ms ease ${idx * 60}ms both` }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-bold tracking-wider text-xs">
                                    PRJ
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                                    Active
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 relative z-10" title={p.name}>{p.name}</h3>
                            <p className="text-slate-400 text-sm mb-6 line-clamp-3 flex-grow relative z-10">{p.description || 'No description provided.'}</p>

                            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-auto relative z-10">
                                <span className="text-xs font-medium text-slate-500 border border-slate-800 px-2 py-1 rounded-md">ID: {p.id.substring(0, 8)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Projects;
