
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTenant } from '../context/TenantContext';
import { Link } from 'react-router-dom';
import api from '../api/api';

const BOARD_COLUMNS = [
    { id: 'TODO', title: 'To Do', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { id: 'In Progress', title: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { id: 'DONE', title: 'Done', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
];

function PriorityBadge({ priority }) {
    const map = {
        Urgent: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
        High: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
        Medium: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
        Low: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    };
    const s = map[priority] || map.Low;
    return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {priority}
        </span>
    );
}

function KanbanBoard({ tickets, onTicketUpdate, fetchTickets }) {
    const { isAdmin } = useTenant();
    const [columns, setColumns] = useState({});

    // Organize tickets into columns whenever tickets prop changes
    useEffect(() => {
        const initialColumns = BOARD_COLUMNS.reduce((acc, col) => {
            acc[col.id] = tickets.filter(t => t.status === col.id || (col.id === 'TODO' && t.status === 'Open'));
            return acc;
        }, {});
        setColumns(initialColumns);
    }, [tickets]);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        // Dropped outside the list
        if (!destination) return;

        // Dropped in same position
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;
        const newStatus = destCol;

        // RBAC Check in UI: Prevent MEMBER from moving to DONE
        if (!isAdmin && newStatus === 'DONE') {
            alert("Permission Denied: Only Admins can move tickets to DONE.");
            return; // Exit early, no state update
        }

        // 1. Optimistic Update
        const sourceList = Array.from(columns[sourceCol]);
        const destList = sourceCol === destCol ? sourceList : Array.from(columns[destCol]);

        const [movedTicket] = sourceList.splice(source.index, 1);
        movedTicket.status = newStatus;
        destList.splice(destination.index, 0, movedTicket);

        setColumns({
            ...columns,
            [sourceCol]: sourceList,
            [destCol]: destList
        });

        // 2. API Call
        try {
            await api.patch(`/tickets/${draggableId}/status`, { status: newStatus });
            if (onTicketUpdate) onTicketUpdate();
        } catch (error) {
            console.error("Failed to update status", error);
            alert(error.response?.data?.message || "Failed to update ticket status. Reverting changes.");
            // Revert on failure
            fetchTickets();
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-4 pt-2">
                {BOARD_COLUMNS.map(col => (
                    <div key={col.id} className="min-w-[320px] max-w-[350px] flex-1 flex flex-col bg-slate-900/40 border border-slate-800/60 rounded-xl overflow-hidden">
                        {/* Column Header */}
                        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700/50" style={{ background: col.bg }}>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color, boxShadow: `0 0 8px ${col.color}` }}></span>
                                <h3 className="text-white font-bold text-sm tracking-wide">{col.title}</h3>
                            </div>
                            <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full border border-slate-700">
                                {columns[col.id]?.length || 0}
                            </span>
                        </div>

                        {/* Drop Zone */}
                        <Droppable droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 p-3 min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`}
                                >
                                    {columns[col.id]?.map((ticket, index) => (
                                        <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`mb-3 glass-card-dark p-4 border border-slate-700/60 rounded-xl cursor-grab active:cursor-grabbing hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 transition-all ${snapshot.isDragging ? 'shadow-2xl shadow-indigo-500/20 rotate-1 border-indigo-500 scale-105 z-50' : ''
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-medium text-slate-500">#{ticket.id.substring(0, 6)}</span>
                                                        <PriorityBadge priority={ticket.priority} />
                                                    </div>

                                                    <h4 className="text-slate-200 font-semibold text-sm mb-3">
                                                        <Link to={`/tickets/${ticket.id}`} className="hover:text-indigo-400 transition-colors">
                                                            {ticket.title}
                                                        </Link>
                                                    </h4>

                                                    <div className="flex items-center justify-between mt-4">
                                                        {ticket.projectId ? (
                                                            <div className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 max-w-[120px] truncate" title="Linked Project">
                                                                🏗️ Linked
                                                            </div>
                                                        ) : <div />}

                                                        {/* Ticket Assignee Initials */}
                                                        {ticket.assigneeId ? (
                                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex justify-center items-center text-[10px] font-bold text-slate-300 border border-slate-600" title={`Assignee ID: ${ticket.assigneeId}`}>
                                                                Assn
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-slate-800/50 flex justify-center items-center text-[10px] text-slate-500 border border-slate-700 border-dashed" title="Unassigned">
                                                                --
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}

export default KanbanBoard;
