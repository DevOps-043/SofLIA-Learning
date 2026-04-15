'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, X, Plus, Sparkles } from 'lucide-react';

interface StructureFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
}

export const StructureForm: React.FC<StructureFormModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onSave(name);
            onClose();
        } catch (error) {
            console.error(error);
            setSaveError('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-[#1E2329] rounded-[2rem] shadow-2xl overflow-hidden border border-neutral-200 dark:border-white/10"
                    >
                        <div className="flex min-h-[400px]">
                            {/* Left Panel - Premium Preview */}
                            <div className="hidden md:flex w-64 p-8 flex-col items-center justify-center space-y-6 border-r border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-black/10">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-gradient-to-br from-[#00D4B3] to-[#10B981] shadow-xl shadow-[#00D4B3]/20"
                                >
                                    <Layout className="w-10 h-10 text-white" />
                                </motion.div>
                                <div className="text-center space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <Sparkles className="w-3 h-3 text-[#00D4B3]" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#00D4B3]">Nueva Estructura</span>
                                    </div>
                                    <p className="text-xs font-semibold text-neutral-400 dark:text-white/20 uppercase tracking-tight">Crea un diseño organizacional personalizado para tu empresa.</p>
                                </div>
                            </div>

                            {/* Right Panel - Form */}
                            <div className="flex-1 p-8 flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-[#0A2540] dark:text-white tracking-tight italic">ESTRUCTURA</h3>
                                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-white/30 block ml-1">
                                            Nombre Comercial
                                        </label>
                                        <div className="relative group">
                                            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 dark:text-white/10 group-focus-within:text-[#00D4B3] transition-colors" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ej: Organización Logística"
                                                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 bg-white dark:bg-black/20 border-neutral-100 dark:border-white/5 text-sm font-bold text-[#0A2540] dark:text-white outline-none focus:border-[#00D4B3] transition-all placeholder:text-neutral-300 dark:placeholder:text-white/10"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1" />

                                    {saveError && (
                                        <p className="text-xs text-red-500">{saveError}</p>
                                    )}

                                    <div className="flex items-center gap-3 pt-6 border-t border-neutral-100 dark:border-white/5">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !name.trim()}
                                            className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0A2540] transition-all shadow-xl shadow-[#00D4B3]/20 disabled:opacity-50 active:scale-95"
                                            style={{ background: "#00D4B3" }}
                                        >
                                            {loading ? 'Sincronizando...' : 'Crear Estructura'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
