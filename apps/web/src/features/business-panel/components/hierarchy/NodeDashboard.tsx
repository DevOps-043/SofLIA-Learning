'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNodeDashboardState } from './node-dashboard/useNodeDashboardState';
import {
    Users,
    UserPlus,
    BookOpen,
    TrendingUp,
    Map as MapIcon,
    List,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    Edit2,
    Trash2,
    MapPin,
    Plus,
    Building2,
    Layers,
    MoreVertical,
    UserCheck
} from 'lucide-react';

import { HierarchyMapWrapper } from './HierarchyMapWrapper';
import { NodeForm } from './NodeForm';
import { HierarchyChat } from './HierarchyChat'
import { CourseAssignmentForm } from './CourseAssignmentForm';
import { MemberAssignmentModal } from './MemberAssignmentModal';
import { BusinessAssignCourseModal } from '../BusinessAssignCourseModal';
import type { NodeMember } from '../../types/hierarchy.types';

interface NodeDashboardProps {
    nodeId: string;
}

export function NodeDashboard({ nodeId }: NodeDashboardProps) {
    const { t } = useTranslation('business');
    const { t: tc } = useTranslation('common');
    const {
        orgSlug,
        data,
        loading,
        error,
        activeTab, setActiveTab,
        members,
        loadingMembers,
        showEditModal, setShowEditModal,
        showAssignmentModal, setShowAssignmentModal,
        showMemberModal, setShowMemberModal,
        initialRole, setInitialRole,
        selectedCourseForIndividual, setSelectedCourseForIndividual,
        hierarchyEntityType,
        analytics,
        fetchData,
        fetchMembers,
        handleEditSave,
        handleRemoveMember,
        handleConfirmRemoveMember,
        pendingRemoveMemberId,
        setPendingRemoveMemberId,
    } = useNodeDashboardState(nodeId);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando información del nodo...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Error</h3>
                    <p className="text-red-300">{error || 'No se encontró el nodo'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const { node, children, courses, path } = data;

    // Components for tabs
    const ManagerCard = () => (
        <div className="bg-[#1E2329] border border-white/5 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => {
                        setInitialRole('leader');
                        setShowMemberModal(true);
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                    title="Cambiar responsable"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Responsable</h3>
                <p className="text-white/40 text-sm">Líder asignado a esta unidad</p>
            </div>

            {node.manager ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] mb-4">
                        <div className="w-full h-full rounded-full bg-[#1E2329] overflow-hidden relative">
                            {node.manager.profile_picture_url ? (
                                <img
                                    src={node.manager.profile_picture_url}
                                    alt={node.manager.first_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                                    {node.manager.first_name?.[0]}
                                </div>
                            )}
                        </div>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-1">
                        {node.manager.first_name} {node.manager.last_name}
                    </h4>
                    <p className="text-blue-400 text-sm font-medium mb-4">{node.manager.email}</p>
                    <div className="flex items-center gap-2 text-white/40 text-sm bg-white/5 px-3 py-1.5 rounded-full">
                        <User className="w-4 h-4" />
                        <span>Líder de {node.type}</span>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/40 mb-4">Sin responsable asignado</p>
                    <button
                        onClick={() => {
                            setInitialRole('leader');
                            setShowMemberModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        Asignar Responsable
                    </button>
                </div>
            )}
        </div>
    );

    const PerformanceCard = () => (
        <div className="bg-[#1E2329] border border-white/5 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Rendimiento</h3>
                    <p className="text-white/40 text-sm">Progreso general del {node.type}</p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#2A3038] p-4 rounded-xl border border-white/5">
                    <p className="text-white/40 text-xs mb-1">Progreso Promedio</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{analytics?.progress || 0}%</span>
                        <span className="text-emerald-400 text-xs mb-1">+2.4%</span>
                    </div>
                </div>
                <div className="bg-[#2A3038] p-4 rounded-xl border border-white/5">
                    <p className="text-white/40 text-xs mb-1">Cursos Completados</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{analytics?.completed_courses || 0}</span>
                    </div>
                </div>
                <div className="bg-[#2A3038] p-4 rounded-xl border border-white/5">
                    <p className="text-white/40 text-xs mb-1">Tiempo de Aprendizaje</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">{analytics?.learning_hours || 0}h</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-[#2A3038] rounded-xl border border-white/5 p-4 flex items-center justify-center">
                <p className="text-white/20 text-sm">Gráfico de actividad próximamente</p>
            </div>
        </div>
    );

    const StructureTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#1E2329] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold">Detalles</h3>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-white/40 text-xs mb-1">Nombre</p>
                            <p className="text-white font-medium">{node.name}</p>
                        </div>
                        <div>
                            <p className="text-white/40 text-xs mb-1">Tipo</p>
                            <div className="flex items-center gap-2">
                                <span className="capitalize text-white">{node.type}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${node.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {node.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-white/40 text-xs mb-1">Ubicación</p>
                            <div className="flex items-center gap-2 text-white">
                                <MapPin className="w-4 h-4 text-white/40" />
                                <span>{node.metadata?.location || 'No especificada'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-white/40 text-xs mb-1">Ruta Jerárquica</p>
                            <div className="flex items-center gap-1 text-sm text-white/60 overflow-x-auto pb-2">
                                {path.map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-1 flex-shrink-0">
                                        {i > 0 && <span className="text-white/20">/</span>}
                                        <Link href={`/${orgSlug}/business-panel/hierarchy/node/${p.id}`} className="hover:text-blue-400 transition-colors">
                                            {p.name}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1E2329] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold">Sub-estructuras</h3>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">{children.length}</span>
                    </div>

                    {children.length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-4">No hay elementos hijos</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {children.map(child => (
                                <Link
                                    key={child.id}
                                    href={`/${orgSlug}/business-panel/hierarchy/node/${child.id}`}
                                    className="block p-3 rounded-xl bg-[#2A3038] hover:bg-[#323842] border border-white/5 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">{child.name}</p>
                                            <p className="text-white/40 text-xs capitalize">{child.type}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-2 min-h-[500px] bg-[#1E2329] border border-white/5 rounded-2xl overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 bg-[#1E2329]/90 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-white flex items-center gap-2">
                    <MapIcon className="w-3 h-3 text-blue-400" />
                    <span>Mapa Geográfico</span>
                </div>
                <HierarchyMapWrapper nodes={[node, ...children]} />
            </div>
        </div>
    );

    const LearningTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Plan de Aprendizaje</h3>
                    <p className="text-white/40 text-sm">Cursos asignados a esta unidad organizacional</p>
                </div>
                <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Asignar Cursos
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-full py-20 bg-[#1E2329] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <BookOpen className="w-16 h-16 text-white/10 mb-4" />
                        <p className="text-white/40 font-medium">No hay cursos con actividad en esta región.</p>
                    </div>
                ) : (
                    courses.map(course => (
                        <div key={course.assignment_id} className="bg-[#1E2329] rounded-2xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors relative">
                            <div className="h-40 bg-[#2A3038] relative">
                                {course.thumbnail_url && (
                                    <img src={course.thumbnail_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                )}
                                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded">
                                    {course.category}
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="font-bold text-white mb-2 line-clamp-2">{course.title}</h4>
                                <div className="flex items-center justify-between mt-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'
                                        }`}>
                                        {course.status === 'active' ? 'Activo' : 'Inactivo'}
                                    </span>

                                    {/* Botón para asignar individualmente */}
                                    <button
                                        onClick={() => setSelectedCourseForIndividual({ id: course.course_id, title: course.title })}
                                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-blue-400 transition-colors"
                                        title="Asignar a usuarios individuales"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* "New Course" Placeholder Card */}
                <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="border border-dashed border-white/10 rounded-2xl hover:bg-white/5 transition-colors flex flex-col items-center justify-center min-h-[300px] gap-4 group"
                >
                    <div className="w-12 h-12 rounded-full bg-[#2A3038] flex items-center justify-center text-white/40 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-white/40 font-medium group-hover:text-white transition-colors">Asignar Nuevo Curso</span>
                </button>
            </div>
        </div>
    );

    const MembersTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Miembros del Nodo</h3>
                    <p className="text-white/40 text-sm">Gestiona los usuarios asignados directamente a este nivel.</p>
                </div>
                <button
                    onClick={() => {
                        setInitialRole('member');
                        setShowMemberModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Asignar Miembro
                </button>
            </div>

            {loadingMembers ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : members.length === 0 ? (
                <div className="py-20 bg-[#1E2329] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Users className="w-16 h-16 text-white/10 mb-4" />
                    <p className="text-white/40 font-medium">No hay miembros asignados directamente a este nodo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map(member => (
                        <div key={member.id} className="bg-[#1E2329] p-4 rounded-xl border border-white/5 flex items-center gap-4 group hover:border-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-[#2A3038] flex-shrink-0 overflow-hidden">
                                {member.users.profile_picture_url ? (
                                    <img src={member.users.profile_picture_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">
                                        {(member.users.first_name?.[0] || member.users.username?.[0] || '?').toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate">
                                    {member.users.first_name} {member.users.last_name}
                                </h4>
                                <p className="text-white/40 text-xs truncate">{member.users.email}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${member.role === 'leader' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {member.role === 'leader' ? 'Líder' : 'Miembro'}
                                    </span>
                                </div>
                            </div>
                            {pendingRemoveMemberId === member.user_id ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-red-400">{t('hierarchy.confirmRemoveMember')}</span>
                                    <button onClick={() => setPendingRemoveMemberId(null)} className="px-2 py-1 text-xs border border-white/10 text-white/60 rounded hover:bg-white/5 transition-colors">{tc('actions.cancel')}</button>
                                    <button onClick={handleConfirmRemoveMember} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">{tc('actions.confirm')}</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title={t('hierarchy.confirmRemoveMember')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            {/* Navigation Tabs */}
            <div className="border-b border-white/10">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Visión General
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'members'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Miembros
                    </button>
                    <button
                        onClick={() => setActiveTab('structure')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'structure'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Estructura y Mapa
                    </button>
                    <button
                        onClick={() => setActiveTab('learning')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'learning'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Cursos y Aprendizaje
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'chat'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Comunicación
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 min-h-[500px]">
                            <ManagerCard />
                        </div>
                        <div className="lg:col-span-2 min-h-[500px]">
                            <PerformanceCard />
                        </div>
                    </div>
                )}
                {activeTab === 'members' && <MembersTab />}
                {activeTab === 'structure' && <StructureTab />}
                {activeTab === 'learning' && <LearningTab />}
                {activeTab === 'chat' && (
                    <div className="max-w-4xl mx-auto">
                        <HierarchyChat
                            entityType="node"
                            entityId={nodeId}
                            chatType="vertical"
                            title={`Chat de ${data?.node.name || 'Equipo'}`}
                            className="bg-[#1E2329] border border-white/5"
                        />
                    </div>
                )}
            </motion.div>

            <NodeForm
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleEditSave}
                mode="edit"
                nodeToEdit={node}
            />

            {data && (
                <CourseAssignmentForm
                    isOpen={showAssignmentModal}
                    onClose={() => setShowAssignmentModal(false)}
                    entityType={hierarchyEntityType}
                    entityId={node.id}
                    entityName={node.name}
                    onSuccess={() => {
                        setShowAssignmentModal(false);
                        fetchData(); // Refresh data to show new assignments
                    }}
                />
            )}

            <MemberAssignmentModal
                isOpen={showMemberModal}
                onClose={() => setShowMemberModal(false)}
                nodeId={nodeId}
                nodeName={data?.node.name || ''}
                initialRole={initialRole}
                onSuccess={() => {
                    fetchMembers();
                    fetchData();
                }}
            />

            {/* Add BusinessAssignCourseModal (Individual Assignment) */}
            {selectedCourseForIndividual && (
                <BusinessAssignCourseModal
                    isOpen={!!selectedCourseForIndividual}
                    onClose={() => setSelectedCourseForIndividual(null)}
                    courseId={selectedCourseForIndividual.id}
                    courseTitle={selectedCourseForIndividual.title}
                    orgSlug={orgSlug}
                    onAssignComplete={() => {
                        // Optional: Refresh data or show success message
                    }}
                />
            )}

        </div>
    );
}
