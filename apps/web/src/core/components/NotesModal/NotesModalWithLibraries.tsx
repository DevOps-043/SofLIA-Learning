'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  FileDown, 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  List, 
  ListOrdered, 
  Undo,
  Redo,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: { title: string; content: string; tags: string[] }) => void;
  initialNote?: {
    id: string;
    title: string;
    content: string;
    tags: string[];
  } | null;
  isEditing?: boolean;
}

export const NotesModalWithLibraries: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  isEditing = false
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  // Inicializar contenido cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (initialNote) {
        setTitle(initialNote.title);
        setContent(initialNote.content);
        setTags(initialNote.tags || []);
      } else {
        setTitle('');
        setContent('');
        setTags([]);
      }
      setTagInput('');
      setIsSaving(false);
      
      // Inicializar historial
      const initialContent = initialNote?.content || '';
      historyRef.current = [initialContent];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [isOpen, initialNote]);

  // Actualizar el editor cuando cambie el contenido
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
    }
  }, [isOpen]);

  // Inyectar estilos CSS para el editor
  useEffect(() => {
    const styleId = 'notes-editor-styles';
    // Verificar si los estilos ya existen
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .notes-editor h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0.5rem 0;
        color: inherit;
      }
      .notes-editor h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0.875rem 0 0.5rem 0;
        color: inherit;
      }
      .notes-editor h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0.75rem 0 0.5rem 0;
        color: inherit;
      }
      .notes-editor p {
        margin: 0.5rem 0;
      }
      .notes-editor ul,
      .notes-editor ol {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      .notes-editor strong {
        font-weight: 700;
      }
      .notes-editor em {
        font-style: italic;
      }
      .notes-editor u {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);

    // Limpiar al desmontar
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Actualizar contenido y guardar en historial
  const updateContent = () => {
    const newContent = editorRef.current?.innerHTML || '';
    setContent(newContent);
    
    // Guardar en historial
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;
    
    // Si el contenido es diferente al último guardado
    if (newContent !== currentHistory[currentIndex]) {
      // Eliminar historial futuro si estamos en el medio
      const newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(newContent);
      
      // Limitar historial a 50 entradas
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        historyIndexRef.current++;
      }
      
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
    }
  };

  // Aplicar formato al texto
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  // Aplicar estilos de encabezado
  const applyHeading = (level: string) => {
    if (level === 'Normal') {
      execCommand('formatBlock', 'div');
    } else {
      execCommand('formatBlock', level.toLowerCase());
    }
  };

  // Aplicar estilos de lista mejorados
  const applyList = (type: 'ul' | 'ol') => {
    if (type === 'ul') {
      execCommand('insertUnorderedList');
    } else {
      execCommand('insertOrderedList');
    }
  };

  // Deshacer
  const undo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousContent = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = previousContent;
        setContent(previousContent);
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  };

  // Rehacer
  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextContent = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = nextContent;
        setContent(nextContent);
      }
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  // Agregar etiqueta
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Eliminar etiqueta
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        tags
      });
      onClose();
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  // Función auxiliar para extraer texto y links del HTML
  const parseHTMLToText = (html: string): Array<{ type: 'text' | 'link' | 'break'; content?: string; url?: string; style?: string; isListItem?: boolean; listType?: 'ul' | 'ol'; listIndex?: number }> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const result: Array<{ type: 'text' | 'link' | 'break'; content?: string; url?: string; style?: string; isListItem?: boolean; listType?: 'ul' | 'ol'; listIndex?: number }> = [];

    const processNode = (node: Node, inheritedStyle?: string, parentListType?: 'ul' | 'ol', listIndex?: number) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          result.push({ type: 'text', content: text, style: inheritedStyle });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // Determinar el estilo heredado
        let currentStyle = inheritedStyle;
        if (tagName === 'strong' || tagName === 'b') {
          currentStyle = inheritedStyle ? `${inheritedStyle},bold` : 'bold';
        } else if (tagName === 'em' || tagName === 'i') {
          currentStyle = inheritedStyle ? `${inheritedStyle},italic` : 'italic';
        } else if (tagName === 'u') {
          currentStyle = inheritedStyle ? `${inheritedStyle},underline` : 'underline';
        } else if (tagName === 'h1') {
          currentStyle = 'h1';
        } else if (tagName === 'h2') {
          currentStyle = 'h2';
        } else if (tagName === 'h3') {
          currentStyle = 'h3';
        }

        if (tagName === 'a') {
          const url = element.getAttribute('href') || '';
          const linkText = element.textContent?.trim() || url;
          result.push({ type: 'link', content: linkText, url, style: inheritedStyle });
        } else if (tagName === 'br') {
          result.push({ type: 'break' });
        } else if (tagName === 'p' || tagName === 'div') {
          // Si estamos dentro de un li, no agregar breaks adicionales
          const isInsideLi = parentListType !== undefined;
          
          if (!isInsideLi && result.length > 0 && result[result.length - 1].type !== 'break') {
            result.push({ type: 'break' });
          }
          
          Array.from(element.childNodes).forEach(child => processNode(child, currentStyle, parentListType));
          
          if (!isInsideLi && (tagName === 'p' || tagName === 'div')) {
            result.push({ type: 'break' });
          }
        } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
          result.push({ type: 'break' });
          const text = element.textContent?.trim() || '';
          if (text) {
            result.push({ type: 'text', content: text, style: tagName });
          }
          result.push({ type: 'break' });
        } else if (tagName === 'ul') {
          if (result.length > 0 && result[result.length - 1].type !== 'break') {
            result.push({ type: 'break' });
          }
          const listItems = Array.from(element.querySelectorAll(':scope > li'));
          listItems.forEach((li, index) => {
            processNode(li, currentStyle, 'ul', index + 1);
          });
          result.push({ type: 'break' });
        } else if (tagName === 'ol') {
          if (result.length > 0 && result[result.length - 1].type !== 'break') {
            result.push({ type: 'break' });
          }
          const listItems = Array.from(element.querySelectorAll(':scope > li'));
          listItems.forEach((li, index) => {
            processNode(li, currentStyle, 'ol', index + 1);
          });
          result.push({ type: 'break' });
        } else if (tagName === 'li') {
          // Determinar el prefijo según el tipo de lista padre
          let prefix = '';
          if (parentListType === 'ol' && listIndex !== undefined) {
            prefix = `${listIndex}. `;
          } else if (parentListType === 'ul') {
            prefix = '• ';
          }
          
          // Separar el contenido del li en texto directo y listas anidadas
          const directTextNodes: Node[] = [];
          const nestedLists: Node[] = [];
          
          Array.from(element.childNodes).forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
              const childElement = child as HTMLElement;
              const childTagName = childElement.tagName.toLowerCase();
              if (childTagName === 'ul' || childTagName === 'ol') {
                nestedLists.push(child);
              } else {
                directTextNodes.push(child);
              }
            } else {
              directTextNodes.push(child);
            }
          });
          
          // Verificar si hay contenido de texto real (no solo espacios en blanco)
          const hasRealContent = directTextNodes.some(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              return node.textContent?.trim().length > 0;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              // Verificar si el elemento tiene texto
              const elem = node as HTMLElement;
              return elem.textContent?.trim().length > 0;
            }
            return false;
          });
          
          // Si hay contenido real, agregar el prefijo y procesar
          if (hasRealContent) {
            if (prefix) {
              result.push({ type: 'text', content: prefix, style: currentStyle });
            }
            // Procesar el contenido directo
            directTextNodes.forEach(child => processNode(child, currentStyle, parentListType));
          } else if (directTextNodes.length === 0 && nestedLists.length === 0) {
            // Si el li está vacío, agregar solo el prefijo
            if (prefix) {
              result.push({ type: 'text', content: prefix, style: currentStyle });
            }
          }
          
          // Procesar las listas anidadas
          nestedLists.forEach(nestedList => {
            const nestedListElement = nestedList as HTMLElement;
            const nestedTagName = nestedListElement.tagName.toLowerCase();
            if (nestedTagName === 'ul') {
              const nestedItems = Array.from(nestedListElement.querySelectorAll(':scope > li'));
              nestedItems.forEach((li, index) => {
                processNode(li, currentStyle, 'ul', index + 1);
              });
            } else if (nestedTagName === 'ol') {
              const nestedItems = Array.from(nestedListElement.querySelectorAll(':scope > li'));
              nestedItems.forEach((li, index) => {
                processNode(li, currentStyle, 'ol', index + 1);
              });
            }
          });
          
          result.push({ type: 'break' });
        } else {
          Array.from(element.childNodes).forEach(child => processNode(child, currentStyle, parentListType));
        }
      }
    };

    Array.from(doc.body.childNodes).forEach(node => processNode(node));
    return result;
  };

  // Exportar a PDF usando librerías
  const handleExportPDF = async () => {
    if (!content.trim()) {
      alert('La nota debe tener contenido para exportar');
      return;
    }

    try {
      // Importación dinámica de jsPDF
      const jsPDF = (await import('jspdf')).default;

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let y = margin;
      const lineHeight = 7;
      const titleLineHeight = 10;

      // Función para agregar nueva página si es necesario
      const checkPageBreak = (requiredHeight: number) => {
        if (y + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Título
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(title, maxWidth);
      titleLines.forEach((line: string) => {
        checkPageBreak(titleLineHeight);
        pdf.text(line, margin, y);
        y += titleLineHeight;
      });

      // Línea debajo del título
      y += 2;
      pdf.setDrawColor(59, 130, 246); // #3b82f6
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Contenido
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const parsedContent = parseHTMLToText(content);
      
      // Procesar y combinar elementos de texto consecutivos (prefijos de lista + texto)
      const processedContent: typeof parsedContent = [];
      for (let i = 0; i < parsedContent.length; i++) {
        const item = parsedContent[i];
        const nextItem = parsedContent[i + 1];
        
        // Si el elemento actual es un prefijo de lista y el siguiente es texto, combinarlos
        if (item.type === 'text' && item.content && 
            (item.content.endsWith('. ') || item.content.endsWith('• ')) &&
            nextItem && nextItem.type === 'text' && nextItem.content) {
          // Combinar prefijo con texto
          processedContent.push({
            type: 'text',
            content: item.content + nextItem.content,
            style: item.style || nextItem.style
          });
          i++; // Saltar el siguiente elemento ya que lo combinamos
        } else {
          processedContent.push(item);
        }
      }
      
      processedContent.forEach((item) => {
        if (item.type === 'break') {
          y += lineHeight / 2;
          checkPageBreak(lineHeight);
        } else if (item.type === 'link' && item.url && item.content) {
          checkPageBreak(lineHeight);
          
          // Determinar estilo del link
          let linkFontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal';
          if (item.style) {
            const styles = item.style.split(',');
            const hasBold = styles.includes('bold');
            const hasItalic = styles.includes('italic');
            
            if (hasBold && hasItalic) {
              linkFontStyle = 'bolditalic';
            } else if (hasBold) {
              linkFontStyle = 'bold';
            } else if (hasItalic) {
              linkFontStyle = 'italic';
            }
          }
          
          // Escribir el texto del enlace
          pdf.setTextColor(59, 130, 246); // Azul para links
          pdf.setFont('helvetica', linkFontStyle);
          const linkLines = pdf.splitTextToSize(item.content, maxWidth);
          linkLines.forEach((line: string, index: number) => {
            if (index > 0) {
              y += lineHeight;
              checkPageBreak(lineHeight);
            }
            const lineWidth = pdf.getTextWidth(line);
            pdf.text(line, margin, y);
            
            // Agregar link funcional (clickeable en el PDF)
            pdf.link(margin, y - 5, lineWidth, lineHeight, { url: item.url });
          });
          
          pdf.setTextColor(0, 0, 0); // Volver a negro
          pdf.setFont('helvetica', 'normal');
          y += lineHeight;
        } else if (item.type === 'text' && item.content) {
          let fontSize = 12;
          let fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal';
          let isUnderline = false;
          
          // Procesar estilos (pueden estar combinados como "bold,italic")
          if (item.style) {
            const styles = item.style.split(',');
            const hasBold = styles.includes('bold') || styles.includes('h1') || styles.includes('h2') || styles.includes('h3');
            const hasItalic = styles.includes('italic');
            const hasUnderline = styles.includes('underline');
            
            if (item.style === 'h1') {
              fontSize = 18;
              fontStyle = 'bold';
            } else if (item.style === 'h2') {
              fontSize = 16;
              fontStyle = 'bold';
            } else if (item.style === 'h3') {
              fontSize = 14;
              fontStyle = 'bold';
            } else if (hasBold && hasItalic) {
              fontStyle = 'bolditalic';
            } else if (hasBold) {
              fontStyle = 'bold';
            } else if (hasItalic) {
              fontStyle = 'italic';
            }
            
            isUnderline = hasUnderline;
          }
          
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', fontStyle);
          
          if (isUnderline) {
            // jsPDF no tiene soporte directo para underline, pero podemos simularlo
            // o simplemente usar el estilo normal
            pdf.setFont('helvetica', fontStyle);
          }
          
          // Si el contenido es solo espacios en blanco, saltarlo
          if (item.content.trim().length === 0) {
            return;
          }
          
          const textLines = pdf.splitTextToSize(item.content, maxWidth);
          textLines.forEach((line: string) => {
            checkPageBreak(lineHeight);
            pdf.text(line, margin, y);
            y += lineHeight;
          });
          
          // Resetear estilo
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
        }
      });

      // Etiquetas
      if (tags.length > 0) {
        y += 10;
        checkPageBreak(lineHeight * 2);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(107, 114, 128); // #6b7280
        pdf.text('Etiquetas:', margin, y);
        y += lineHeight;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 255, 255); // Blanco para el texto de las etiquetas
        
        let tagX = margin;
        tags.forEach((tag) => {
          const tagWidth = pdf.getTextWidth(tag) + 6;
          
          if (tagX + tagWidth > pageWidth - margin) {
            y += lineHeight;
            checkPageBreak(lineHeight);
            tagX = margin;
          }
          
          // Dibujar fondo azul para la etiqueta
          // Rectángulo movido hacia abajo para alinearse con el texto
          pdf.setFillColor(59, 130, 246); // #3b82f6
          pdf.roundedRect(tagX, y - 4, tagWidth, 6, 2, 2, 'F');
          
          // Texto de la etiqueta
          pdf.text(tag, tagX + 3, y);
          tagX += tagWidth + 4;
        });
        
        pdf.setTextColor(0, 0, 0); // Volver a negro
        y += lineHeight + 5;
      }

      // Footer
      y = pageHeight - margin - 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128); // #6b7280
      const footerText = `Generado el ${new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      pdf.text(footerText, pageWidth / 2, y, { align: 'center' });

      // Descargar
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      alert('Error al generar el PDF. Inténtalo de nuevo.');
    }
  };

  // Manejar teclas de atajo
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'z':
          e.preventDefault();
          undo();
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };

  // Cerrar modal
  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700/50 w-full max-w-3xl max-h-[calc(100vh-2rem)] md:max-h-[70vh] md:h-[70vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Type className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isEditing ? 'Editar Nota' : 'Estudio > Notas'}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-slate-400" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-gray-100 dark:scrollbar-track-slate-800">
              {/* Título */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la nota..."
                  className="w-full bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-lg font-semibold placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                />
              </div>

              {/* Barra de herramientas */}
              <div className="bg-white dark:bg-slate-700/30 border border-gray-300 dark:border-slate-600/50 rounded-xl p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Deshacer/Rehacer */}
                  <div className="flex gap-1">
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Deshacer (Ctrl+Z)"
                    >
                      <Undo className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Rehacer (Ctrl+Y)"
                    >
                      <Redo className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-gray-300 dark:bg-slate-600/50 mx-2"></div>

                  {/* Formato de texto */}
                  <div className="flex gap-1">
                    <select 
                      onChange={(e) => applyHeading(e.target.value)}
                      className="notes-select px-3 py-2 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="Normal" className="bg-white dark:bg-slate-700 text-gray-900 dark:text-white">Normal</option>
                      <option value="H1" className="bg-white dark:bg-slate-700 text-gray-900 dark:text-white">H1</option>
                      <option value="H2" className="bg-white dark:bg-slate-700 text-gray-900 dark:text-white">H2</option>
                      <option value="H3" className="bg-white dark:bg-slate-700 text-gray-900 dark:text-white">H3</option>
                    </select>
                    
                    <button
                      onClick={() => execCommand('bold')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Negrita (Ctrl+B)"
                    >
                      <Bold className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('italic')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Cursiva (Ctrl+I)"
                    >
                      <Italic className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('underline')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Subrayado (Ctrl+U)"
                    >
                      <Underline className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-gray-300 dark:bg-slate-600/50 mx-2"></div>

                  {/* Listas */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => applyList('ul')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Lista sin ordenar"
                    >
                      <List className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={() => applyList('ol')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Lista ordenada"
                    >
                      <ListOrdered className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('justifyLeft')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Alinear izquierda"
                    >
                      <AlignLeft className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('justifyCenter')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Alinear centro"
                    >
                      <AlignCenter className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={() => execCommand('justifyRight')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Alinear derecha"
                    >
                      <AlignRight className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                  </div>

                  <div className="w-px h-8 bg-gray-300 dark:bg-slate-600/50 mx-2"></div>

                  {/* Enlaces */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const url = prompt('Ingresa la URL:');
                        if (url) execCommand('createLink', url);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Insertar enlace"
                    >
                      <Link className="w-4 h-4 text-gray-900 dark:text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor de contenido */}
              <div className="flex-1 bg-white dark:bg-slate-700/30 border border-gray-300 dark:border-slate-600/50 rounded-xl p-3">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={updateContent}
                  className="notes-editor w-full h-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none resize-none overflow-y-auto"
                  style={{ 
                    minHeight: '150px',
                    lineHeight: '1.6'
                  }}
                  data-placeholder="Comienza a escribir tu nota aquí..."
                />
              </div>

              {/* Etiquetas */}
              <div className="mt-4">
                <label className="block text-sm text-gray-700 dark:text-slate-300 mb-2">Etiquetas</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Agregar etiqueta..."
                    className="flex-1 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600/50 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-blue-500/20 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 p-3 md:p-4 pb-4 md:pb-4 border-t border-gray-200 dark:border-slate-700/50 flex-shrink-0 bg-white dark:bg-slate-800/50">
              <div className="hidden md:block text-sm text-gray-600 dark:text-slate-400">
                <p>Ctrl+S para guardar • Ctrl+Z para deshacer • Ctrl+Y para rehacer</p>
              </div>
              <div className="flex gap-2 md:gap-3 flex-1 md:flex-initial">
                <button
                  onClick={handleClose}
                  className="flex-1 md:flex-initial px-3 md:px-6 py-2 md:py-3 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-lg md:rounded-xl text-xs md:text-base font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !content.trim()}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg md:rounded-xl text-xs md:text-base font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                >
                  <Save className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  <span className="truncate">{isSaving ? 'Guardando...' : 'Guardar Nota'}</span>
                </button>
                
                <button
                  onClick={handleExportPDF}
                  className="hidden md:flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-base font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  <FileDown className="w-4 h-4" />
                  Convertir en PDF
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
