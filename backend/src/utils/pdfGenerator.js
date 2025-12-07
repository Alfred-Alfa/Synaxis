import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const MARGIN = 50;
const A4_WIDTH = 595.28;
const CONTENT_WIDTH = A4_WIDTH - (MARGIN * 2);
const ACCENT_COLOR = "#0f172a"; // Dark Slate
const PRIMARY_COLOR = "#1e40af"; // Blue for explicit headers
const TEXT_COLOR = "#334155";
const LIGHT_GRAY = "#f8fafc";
const BORDER_COLOR = "#e2e8f0";

/**
 * Generate a Corporate Standard Payslip PDF
 */
export const generatePayslipPDF = async (payroll, staff, settings, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            let y = 50;

            // --- 1. HEADER SECTION ---

            // Logo (Left)
            if (settings.companyLogo) {
                const logoPath = path.join(__dirname, '../../uploads', settings.companyLogo);
                if (fs.existsSync(logoPath)) {
                    try {
                        doc.image(logoPath, MARGIN, y, { height: 50 });
                    } catch (e) {
                        console.error("Logo error:", e);
                    }
                }
            }

            // Company Details (Right Aligned)
            doc.font('Helvetica-Bold').fontSize(16).fillColor(ACCENT_COLOR)
                .text(settings.companyName || 'Company Name', MARGIN, y, { align: 'right' });

            y += 20;
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR);

            const addr = settings.companyAddress || {};
            const addressLines = typeof addr === 'string' ? [addr] : [
                addr.street,
                [addr.city, addr.state, addr.zip].filter(Boolean).join(', '),
                addr.country
            ].filter(Boolean);

            addressLines.forEach(line => {
                doc.text(line, MARGIN, y, { align: 'right' });
                y += 12;
            });

            // Separator Line
            y = Math.max(y, 110) + 10;
            drawLine(doc, y);
            y += 20;

            // --- 2. TITLE & INFO GRID ---

            doc.font('Helvetica-Bold').fontSize(14).fillColor(PRIMARY_COLOR)
                .text('PAYSLIP', MARGIN, y, { align: 'center' });

            y += 25;

            // Info Box Background
            const infoBoxHeight = 85;
            doc.rect(MARGIN, y, CONTENT_WIDTH, infoBoxHeight).fill(LIGHT_GRAY).stroke(BORDER_COLOR);

            // Left Column: Employee Info
            let leftY = y + 15;
            const leftX = MARGIN + 15;

            doc.fillColor(ACCENT_COLOR).font('Helvetica-Bold').fontSize(10).text('Employee Details', leftX, leftY);
            leftY += 15;

            const drawLabelValue = (label, value, x, currentY) => {
                doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR).text(label, x, currentY);
                doc.font('Helvetica-Bold').fillColor('#000000').text(value, x + 70, currentY);
                return currentY + 12; // line height
            };

            leftY = drawLabelValue('Name:', staff.fullName, leftX, leftY);
            leftY = drawLabelValue('ID:', staff.employeeId || staff._id.toString().substring(18).toUpperCase(), leftX, leftY);
            leftY = drawLabelValue('Designation:', staff.designation || 'N/A', leftX, leftY);
            leftY = drawLabelValue('Department:', 'General', leftX, leftY);

            // Right Column: Pay Info
            let rightY = y + 15;
            const rightX = MARGIN + (CONTENT_WIDTH / 2) + 15;

            doc.fillColor(ACCENT_COLOR).font('Helvetica-Bold').fontSize(10).text('Payment Details', rightX, rightY);
            rightY += 15;

            rightY = drawLabelValue('Pay Period:', `${formatDate(payroll.periodStart)} - ${formatDate(payroll.periodEnd)}`, rightX, rightY);
            rightY = drawLabelValue('Pay Date:', formatDate(new Date()), rightX, rightY);
            rightY = drawLabelValue('Currency:', settings.currency, rightX, rightY);
            rightY = drawLabelValue('Status:', payroll.isPaid ? 'PAID' : 'PENDING', rightX, rightY);

            y += infoBoxHeight + 30;

            // --- 3. EARNINGS TABLE ---

            // Table Header
            const col1 = MARGIN; // Description
            const col2 = MARGIN + 250; // Rate/Hours
            const col3 = MARGIN + 400; // Amount (Right aligned anchor)
            const col4 = MARGIN + CONTENT_WIDTH; // Right Edge

            doc.rect(MARGIN, y, CONTENT_WIDTH, 25).fill('#eeeeee');
            doc.fillColor(ACCENT_COLOR).font('Helvetica-Bold').fontSize(10);

            // Headers
            doc.text('Description', col1 + 10, y + 8);
            doc.text('Details', col2, y + 8);
            doc.text('Amount', col3, y + 8, { width: col4 - col3 - 10, align: 'right' });

            y += 25;

            const currency = getCurrencySymbol(settings.currency);

            // Row Drawer Helper
            const drawRow = (label, details, amount, color = '#000000') => {
                doc.fillColor(color).font('Helvetica').fontSize(10);

                // Content
                doc.text(label, col1 + 10, y + 8);
                doc.text(details, col2, y + 8);
                doc.font('Helvetica-Bold').text(`${currency}${amount.toFixed(2)}`, col3, y + 8, { width: col4 - col3 - 10, align: 'right' });

                // Border Bottom
                y += 25;
                drawLine(doc, y, '#e2e8f0');
            };

            // 1. Normal Pay
            drawRow('Basic Pay', `${payroll.normalHours.toFixed(1)} hrs @ ${currency}${staff.hourlyRate}/hr`, payroll.normalPay);

            // 2. Overtime
            if (payroll.otPay > 0 || payroll.otHours > 0) {
                drawRow('Overtime', `${payroll.otHours.toFixed(1)} hrs overtime`, payroll.otPay);
            }

            // 3. Travel
            if (payroll.travelExpenses > 0) {
                drawRow('Travel Allowance', '-', payroll.travelExpenses, '#16a34a'); // Green
            }

            // 4. Deductions header if needed
            // Actually standard payslips mix them but negative values are clear. 
            // Or we make a separate section. Let's list deductions as rows.

            if (payroll.leaveDeductions > 0) {
                drawRow('Leave Deductions', 'Unpaid leave', -payroll.leaveDeductions, '#dc2626'); // Red
            }

            y += 10;

            // --- 4. TOTALS SECTION ---

            // Draw Totals Box (Right Aligned)
            const totalBoxWidth = 200;
            const totalBoxX = MARGIN + CONTENT_WIDTH - totalBoxWidth;

            // Net Pay Background
            doc.rect(totalBoxX, y + 10, totalBoxWidth, 35).fill(PRIMARY_COLOR);

            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12);
            doc.text('NET PAY', totalBoxX + 15, y + 20);
            doc.fontSize(14);
            doc.text(`${currency}${payroll.totalPay.toFixed(2)}`, totalBoxX, y + 20, { width: totalBoxWidth - 15, align: 'right' });

            y += 60;

            // --- 5. FOOTER & SIGNATURES ---
            y = Math.max(y, 650); // Push to bottom if space allows, or at least below content

            // Lines for signatures
            const sigY = y;
            drawLine(doc, sigY, '#000000', MARGIN, MARGIN + 150); // Left line
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR).text('Employer Signature', MARGIN, sigY + 5);

            drawLine(doc, sigY, '#000000', MARGIN + CONTENT_WIDTH - 150, MARGIN + CONTENT_WIDTH); // Right line
            doc.text('Employee Signature', MARGIN + CONTENT_WIDTH - 150, sigY + 5);

            y += 50;
            doc.fontSize(8).fillColor('#94a3b8').text('This is a system generated document.', MARGIN, doc.page.height - 30, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

// Utils
function drawLine(doc, y, color = '#e2e8f0', x1 = MARGIN, x2 = MARGIN + CONTENT_WIDTH) {
    doc.save()
        .moveTo(x1, y)
        .lineTo(x2, y)
        .strokeColor(color)
        .lineWidth(1)
        .stroke()
        .restore();
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-GB');
}

const getCurrencySymbol = (currency) => {
    const symbols = {
        USD: '$', GBP: '£', EUR: '€', INR: '₹', SGD: 'S$', AUD: 'A$', CAD: 'C$', AED: 'AED '
    };
    return symbols[currency] || currency;
};

export default generatePayslipPDF;
