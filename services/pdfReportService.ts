import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export class PDFReportService {
    /**
     * Generates a comprehensive and professional PDF report
     */
    static async generateProfessionalPDF(data: {
        projectName: string;
        userName: string;
        tasks: any[];
        sprints: any[];
        requirements: any[];
        checklist: any[];
        stats: {
            totalTasks: number;
            completedTasks: number;
            blockedTasks: number;
            efficiency: number;
        };
        chartsContainerId?: string;
    }) {
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

            // --- PAGE 1: COVER ---
            doc.setFillColor(123, 104, 238); // #7b68ee
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('REPORTE PROFESIONAL DE PROYECTO', pageWidth / 2, 25, { align: 'center' });

            doc.setTextColor(40, 40, 40);
            doc.setFontSize(16);
            doc.text((data.projectName || 'PROYECTO').toUpperCase(), pageWidth / 2, 60, { align: 'center' });

            doc.setDrawColor(123, 104, 238);
            doc.setLineWidth(1);
            doc.line(40, 65, pageWidth - 40, 65);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generado por: ${data.userName || 'Usuario'}`, pageWidth / 2, 80, { align: 'center' });
            doc.text(`Fecha de emisión: ${timestamp}`, pageWidth / 2, 88, { align: 'center' });

            // Executive Summary Card
            doc.setFillColor(245, 247, 250);
            doc.roundedRect(20, 105, pageWidth - 40, 60, 3, 3, 'F');

            doc.setTextColor(123, 104, 238);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('RESUMEN EJECUTIVO', 30, 118);

            doc.setTextColor(80, 80, 80);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const summaryText = `Este reporte proporciona un análisis detallado del estado actual del proyecto ${data.projectName || 'de gestión'}. Se han analizado un total de ${data.stats.totalTasks} tareas, con un índice de eficiencia del ${data.stats.efficiency}%. Actualmente el equipo presenta ${data.stats.blockedTasks} bloqueos críticos que requieren atención. El ecosistema se encuentra en una fase operativa estable con cumplimiento de hitos estratégicos.`;
            const splitText = doc.splitTextToSize(summaryText, pageWidth - 60);
            doc.text(splitText, 30, 128);

            // Mini Stats
            const colWidth = (pageWidth - 40) / 3;
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL TAREAS', 20 + colWidth / 2, 175, { align: 'center' });
            doc.text('COMPLETADAS', 20 + colWidth * 1.5, 175, { align: 'center' });
            doc.text('EFICIENCIA', 20 + colWidth * 2.5, 175, { align: 'center' });

            doc.setFontSize(20);
            doc.setTextColor(123, 104, 238);
            doc.text(`${data.stats.totalTasks}`, 20 + colWidth / 2, 185, { align: 'center' });
            doc.text(`${data.stats.completedTasks}`, 20 + colWidth * 1.5, 185, { align: 'center' });
            doc.text(`${data.stats.efficiency}%`, 20 + colWidth * 2.5, 185, { align: 'center' });

            // --- PAGE 2: CHARTS & VISUALS ---
            if (data.chartsContainerId) {
                const container = document.getElementById(data.chartsContainerId);
                if (container) {
                    try {
                        doc.addPage();
                        doc.setTextColor(123, 104, 238);
                        doc.setFontSize(16);
                        doc.setFont('helvetica', 'bold');
                        doc.text('ANÁLISIS GRÁFICO Y MÉTRICAS', 20, 20);

                        const canvas = await html2canvas(container, {
                            scale: 2,
                            logging: false,
                            useCORS: true,
                            backgroundColor: '#ffffff'
                        });

                        const imgData = canvas.toDataURL('image/png');
                        const imgWidth = pageWidth - 40;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;

                        // Safety check for height to prevent page overflow
                        const finalImgHeight = Math.min(imgHeight, 240);
                        doc.addImage(imgData, 'PNG', 20, 30, imgWidth, finalImgHeight);
                    } catch (e) {
                        console.error("Error capturing charts:", e);
                    }
                }
            }

            // --- PAGE 3: DETAILED TABLES ---
            doc.addPage();
            doc.setTextColor(123, 104, 238);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('DETALLE DE OPERACIONES', 20, 20);

            // Tasks Table
            doc.setFontSize(12);
            doc.text('Desglose de Tareas del Sprint', 20, 30);

            const taskRows = (data.tasks || []).map(t => [
                t.title,
                t.status,
                t.priority || 'N/A',
                t.points || '0',
                t.assigneeId || 'Sin asignar'
            ]);

            autoTable(doc, {
                startY: 35,
                head: [['Título', 'Estado', 'Prioridad', 'Pts', 'Responsable']],
                body: taskRows,
                headStyles: { fillColor: [123, 104, 238] },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                margin: { left: 20, right: 20 },
                theme: 'striped'
            });

            // Requirements Table
            let finalY = (doc as any).lastAutoTable?.finalY || 100;
            finalY += 15;

            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            doc.text('Requerimientos del Sistema (Tickets)', 20, finalY);

            const reqRows = (data.requirements || []).map(r => [
                r.title,
                r.status,
                r.priority || 'N/A'
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Requerimiento', 'Estado', 'Prioridad']],
                body: reqRows,
                headStyles: { fillColor: [80, 80, 80] },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                margin: { left: 20, right: 20 },
                theme: 'striped'
            });

            // Checklist Table
            finalY = (doc as any).lastAutoTable?.finalY || 150;
            finalY += 15;

            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            doc.text('Checklist de Operaciones Rápidas', 20, finalY);

            const checkRows = (data.checklist || []).map(c => [
                c.title,
                c.section || 'General'
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Ítem de Checklist', 'Categoría']],
                body: checkRows,
                headStyles: { fillColor: [20, 184, 166] }, // Teal color
                alternateRowStyles: { fillColor: [245, 247, 250] },
                margin: { left: 20, right: 20 },
                theme: 'striped'
            });

            // Footer on all pages
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`TaskiBot Intelligence Report - Página ${i} de ${totalPages} - ${timestamp}`, pageWidth / 2, 285, { align: 'center' });
            }

            // Save
            const fileName = `Reporte_${(data.projectName || 'Proyecto').replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
            doc.save(fileName);

            return fileName;
        } catch (error) {
            console.error("In-service PDF generation error:", error);
            throw error;
        }
    }
}
