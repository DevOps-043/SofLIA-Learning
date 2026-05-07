"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  StarIcon,
  CheckCircle2,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export interface Skill {
  skill_id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  icon_url?: string;
  icon_type?: string;
  icon_name?: string;
  color?: string;
  level?: string;
}

export interface CourseSkill extends Skill {
  id?: string;
  is_primary?: boolean;
  is_required?: boolean;
  proficiency_level?: string;
  display_order?: number;
}

interface CourseSkillsSelectorProps {
  courseId: string;
  selectedSkills: CourseSkill[];
  onSkillsChange: (skills: CourseSkill[]) => void;
  disabled?: boolean;
}

export function CourseSkillsSelector({
  courseId,
  selectedSkills,
  onSkillsChange,
  disabled = false,
}: CourseSkillsSelectorProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAvailableSkills();
  }, []);

  useEffect(() => {
    if (courseId && courseId !== 'new') {
      fetchCourseSkills();
    }
  }, [courseId]);

  const fetchAvailableSkills = async () => {
    // TODO: [PENDING] Backend implementation for Skills is pending (migration created but not run). 
    // See supabase/migrations/20260204120000_create_skills_tables.sql
    try {
      setIsLoading(true);
      const response = await fetch("/api/skills?is_active=true");
      const data = await response.json();

      if (data.success) {
        setAvailableSkills(data.skills || []);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseSkills = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/skills`);
      const data = await response.json();

      if (data.success && data.skills) {
        onSkillsChange(data.skills);
      }
    } catch (error) {
      console.error("Error fetching course skills:", error);
    }
  };

  const filteredSkills = availableSkills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || skill.category === selectedCategory;
    const notSelected = !selectedSkills.some(
      (ss) => ss.skill_id === skill.skill_id
    );
    return matchesSearch && matchesCategory && notSelected;
  });

  const categories = Array.from(
    new Set(availableSkills.map((s) => s.category))
  );

  const handleAddSkill = (skill: Skill) => {
    const newSkill: CourseSkill = {
      ...skill,
      is_primary: false,
      is_required: true,
      proficiency_level: "beginner",
      display_order: selectedSkills.length,
    };
    onSkillsChange([...selectedSkills, newSkill]);
    setSearchTerm("");
  };

  const handleRemoveSkill = (skillId: string) => {
    onSkillsChange(selectedSkills.filter((s) => s.skill_id !== skillId));
  };

  const handleTogglePrimary = (skillId: string) => {
    onSkillsChange(
      selectedSkills.map((s) =>
        s.skill_id === skillId
          ? { ...s, is_primary: !s.is_primary }
          : { ...s, is_primary: false }
      )
    );
  };

  const handleUpdateSkill = (
    skillId: string,
    updates: Partial<CourseSkill>
  ) => {
    onSkillsChange(
      selectedSkills.map((s) =>
        s.skill_id === skillId ? { ...s, ...updates } : s
      )
    );
  };

  const getSkillIcon = (skill: Skill) => {
    if (skill.icon_url) {
      return (
        <img
          src={skill.icon_url}
          alt={skill.name}
          className="w-6 h-6 rounded-lg object-cover"
        />
      );
    }
    if (skill.icon_name) {
      return (
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: skill.color || "#00D4B3" }}
        >
          {skill.icon_name.substring(0, 2).toUpperCase()}
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#00D4B3]">
        <AcademicCapIcon className="w-4 h-4 text-white" />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Skills seleccionadas */}
      {selectedSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wide">
              Skills del Curso ({selectedSkills.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill, index) => (
              <motion.div
                key={skill.skill_id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex items-center gap-2 px-3 py-2 rounded-lg border bg-white dark:bg-[#0A0D12] border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50 transition-all duration-200"
              >
                {getSkillIcon(skill)}
                <span className="text-sm font-medium text-[#0A2540] dark:text-white">
                  {skill.name}
                </span>
                {skill.is_primary && (
                  <StarIcon className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                )}
                {!disabled && (
                  <motion.button
                    onClick={() => handleRemoveSkill(skill.skill_id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="ml-1 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <XMarkIcon className="w-3 h-3 text-red-500 dark:text-red-400" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Botón para agregar skills */}
      {!disabled && (
        <motion.button
          onClick={() => setShowAddModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 hover:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30 rounded-lg border border-[#00D4B3]/20 dark:border-[#00D4B3]/30 transition-all duration-200"
        >
          <PlusIcon className="w-4 h-4" />
          Agregar Skills
        </motion.button>
      )}

      {/* Modal para agregar skills */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-dvh items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-3xl w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[85dvh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 px-6 py-4 border-b border-[#0A2540]/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                          <AcademicCapIcon className="h-5 w-5 text-[#00D4B3]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            Seleccionar Skills
                          </h3>
                          <p className="text-xs text-white/70">
                            Elige las skills que se aprenderán en este curso
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => setShowAddModal(false)}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Filtros */}
                  <div className="p-5 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 space-y-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12]">
                    <div className="relative group">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                      <input
                        type="text"
                        placeholder="Buscar skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      <motion.button
                        onClick={() => setSelectedCategory("all")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${selectedCategory === "all"
                          ? "bg-[#00D4B3] text-white shadow-md"
                          : "bg-white dark:bg-[#0A0D12] text-[#6C757D] dark:text-white/60 border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50"
                          }`}
                      >
                        Todas
                      </motion.button>
                      {categories.map((category) => (
                        <motion.button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${selectedCategory === category
                            ? "bg-[#00D4B3] text-white shadow-md"
                            : "bg-white dark:bg-[#0A0D12] text-[#6C757D] dark:text-white/60 border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50"
                            }`}
                        >
                          {category}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de skills */}
                  <div className="flex-1 overflow-y-auto p-5">
                    {isLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00D4B3] border-t-transparent mx-auto mb-3"></div>
                        <p className="text-sm text-[#6C757D] dark:text-white/60">
                          Cargando skills...
                        </p>
                      </div>
                    ) : filteredSkills.length === 0 ? (
                      <div className="text-center py-12">
                        <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-[#6C757D] dark:text-white/40" />
                        <p className="text-sm text-[#6C757D] dark:text-white/60 font-medium">
                          {searchTerm || selectedCategory !== "all"
                            ? "No se encontraron skills"
                            : "Todas las skills ya están seleccionadas"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredSkills.map((skill, index) => (
                          <motion.button
                            key={skill.skill_id}
                            onClick={() => {
                              handleAddSkill(skill);
                              setShowAddModal(false);
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3] hover:bg-[#00D4B3]/5 dark:hover:bg-[#00D4B3]/10 transition-all duration-200 text-left bg-white dark:bg-[#0A0D12]"
                          >
                            {getSkillIcon(skill)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-[#0A2540] dark:text-white truncate">
                                {skill.name}
                              </div>
                              {skill.description && (
                                <div className="text-xs text-[#6C757D] dark:text-white/60 truncate mt-0.5">
                                  {skill.description}
                                </div>
                              )}
                              <div className="text-xs text-[#6C757D] dark:text-white/50 mt-1">
                                {skill.category}{" "}
                                {skill.level && `• ${skill.level}`}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-lg bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 flex items-center justify-center">
                                <PlusIcon className="w-4 h-4 text-[#00D4B3]" />
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
