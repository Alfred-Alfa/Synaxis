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

// Register Custom Fonts for UTF-8 support (especially for Rupee ₹ symbol)
const robotoRegular = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf');
const robotoBold = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf');

/**
 * Generate a Corporate Standard Payslip PDF
 */
export const generatePayslipPDF = async (payroll, staff, settings, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true });
            const stream = fs.createWriteStream(outputPath);

            // Register fonts
            if (fs.existsSync(robotoRegular)) {
                doc.registerFont('Roboto', robotoRegular);
            }
            if (fs.existsSync(robotoBold)) {
                doc.registerFont('Roboto-Bold', robotoBold);
            }

            const fontNormal = fs.existsSync(robotoRegular) ? 'Roboto' : 'Helvetica';
            const fontBold = fs.existsSync(robotoBold) ? 'Roboto-Bold' : 'Helvetica-Bold';

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
                        // Fallback if logo is invalid
                    }
                }
            }

            // Company Details (Right Aligned)
            doc.font(fontBold).fontSize(18).fillColor(PRIMARY_COLOR)
                .text('Synaxis', MARGIN, y, { align: 'right' });

            y += 22;
            doc.font(fontNormal).fontSize(10).fillColor(TEXT_COLOR);

            const addr = settings.companyAddress || {};
            const addressLines = typeof addr === 'string' ? [addr] : [
                addr.street,
                [addr.city, addr.state, addr.zip].filter(Boolean).join(', '),
                addr.country
            ].filter(Boolean);

            if (addressLines.length === 0 && !settings.companyEmail) {
                doc.text('Premium HR Solutions', MARGIN, y, { align: 'right' });
            } else if (addressLines.length === 0) {
                doc.text(settings.companyEmail, MARGIN, y, { align: 'right' });
            } else {
                addressLines.forEach(line => {
                    doc.text(line, MARGIN, y, { align: 'right' });
                    y += 13;
                });
            }

            // Separator Line
            y = Math.max(y, 110) + 10;
            drawLine(doc, y, PRIMARY_COLOR);
            y += 20;

            // --- 2. TITLE & INFO GRID ---

            doc.font(fontBold).fontSize(16).fillColor(ACCENT_COLOR)
                .text('PAYSLIP', MARGIN, y, { align: 'center' });

            y += 25;

            // Info Box Background
            const infoBoxHeight = 100;
            doc.rect(MARGIN, y, CONTENT_WIDTH, infoBoxHeight).fill('#f8fafc').stroke('#cbd5e1');

            // Left Column: Employee Info
            let leftY = y + 15;
            const leftX = MARGIN + 15;

            doc.fillColor(PRIMARY_COLOR).font(fontBold).fontSize(11).text('Employee Details', leftX, leftY);
            leftY += 18;

            const drawLabelValue = (label, value, x, currentY) => {
                doc.font(fontNormal).fontSize(9).fillColor(TEXT_COLOR).text(label, x, currentY);
                doc.font(fontBold).fillColor('#1e293b').text(value, x + 85, currentY);
                return currentY + 14;
            };

            leftY = drawLabelValue('Employee Name:', staff.fullName, leftX, leftY);
            leftY = drawLabelValue('Designation:', staff.designation || 'N/A', leftX, leftY);
            leftY = drawLabelValue('Bank Account:', staff.bankDetails?.accountNumber || 'N/A', leftX, leftY);
            leftY = drawLabelValue('Bank Name:', staff.bankDetails?.bankName || 'N/A', leftX, leftY);

            // Right Column: Pay Info
            let rightY = y + 15;
            const rightX = MARGIN + (CONTENT_WIDTH / 2) + 15;

            doc.fillColor(PRIMARY_COLOR).font(fontBold).fontSize(11).text('Payment Details', rightX, rightY);
            rightY += 18;

            rightY = drawLabelValue('Period:', `${formatDate(payroll.periodStart)} to ${formatDate(payroll.periodEnd)}`, rightX, rightY);
            rightY = drawLabelValue('Payment Date:', formatDate(payroll.paidAt || new Date()), rightX, rightY);
            rightY = drawLabelValue('Pay Mode:', 'Bank Transfer', rightX, rightY);
            rightY = drawLabelValue('Currency:', 'INR (Rupees)', rightX, rightY);

            y += infoBoxHeight + 35;

            // --- 3. EARNINGS & DEDUCTIONS TABLE ---

            // Table Header
            const col1 = MARGIN; // Description
            const col2 = MARGIN + 220; // Details
            const col3 = MARGIN + 380; // Amount
            const col4 = MARGIN + CONTENT_WIDTH; // Right Edge

            doc.rect(MARGIN, y, CONTENT_WIDTH, 28).fill(ACCENT_COLOR);
            doc.fillColor('#ffffff').font(fontBold).fontSize(10);

            // Headers
            doc.text('Description', col1 + 12, y + 9);
            doc.text('Computation Details', col2, y + 9);
            doc.text('Amount (INR)', col3, y + 9, { width: col4 - col3 - 12, align: 'right' });

            y += 28;

            const currency = '₹'; // Force Rupee Symbol with Roboto

            // Row Drawer Helper
            const drawRow = (label, details, amount, color = '#0f172a', isNegative = false) => {
                const displayAmt = isNegative ? `- ${currency}${Math.abs(amount).toFixed(2)}` : `${currency}${amount.toFixed(2)}`;
                const textColor = isNegative ? '#dc2626' : color;

                doc.fillColor(textColor).font(fontNormal).fontSize(10);
                doc.text(label, col1 + 12, y + 10);
                doc.text(details, col2, y + 10, { width: 150 });
                doc.font(fontBold).text(displayAmt, col3, y + 10, { width: col4 - col3 - 12, align: 'right' });

                y += 30;
                drawLine(doc, y, '#e2e8f0');
            };

            // 1. Regular Pay
            const hourlyRate = payroll.normalRate || staff.hourlyRate;
            drawRow('Regular Pay', `${payroll.normalHours.toFixed(1)} hrs @ ${currency}${hourlyRate}/hr`, payroll.normalPay);

            // 2. OT Pay
            if (payroll.otPay > 0 || payroll.otHours > 0) {
                const otRate = payroll.otHours > 0 ? (payroll.otPay / payroll.otHours).toFixed(2) : (hourlyRate * 1.5).toFixed(2);
                drawRow('OT Pay', `${payroll.otHours.toFixed(1)} hrs @ ${currency}${otRate}/hr`, payroll.otPay);
            }

            // 3. Travel Allowance
            if (payroll.travelExpenses > 0) {
                drawRow('Travel Allowance', 'Reimbursements and Conveyance', payroll.travelExpenses, '#059669');
            }

            // 4. Leave Deductions
            if (payroll.leaveDeductions > 0) {
                drawRow('Leave Deductions', 'Unpaid leave adjustment', payroll.leaveDeductions, '#dc2626', true);
            }

            // 5. Tax
            if (payroll.taxDeduction > 0) {
                const taxLabel = payroll.taxPercentage > 0 ? `Tax (${payroll.taxPercentage}%)` : 'Income Tax';
                drawRow(taxLabel, 'Statutory Income Tax', payroll.taxDeduction, '#dc2626', true);
            }

            // 6. Bonus
            if (payroll.bonus > 0) {
                drawRow('Bonus', 'Performance / Special Bonus', payroll.bonus, '#10b981');
            }

            y += 15;

            // --- 4. NET PAY SUMMARY ---

            const totalBoxWidth = 240;
            const totalBoxX = MARGIN + CONTENT_WIDTH - totalBoxWidth;

            doc.rect(totalBoxX, y, totalBoxWidth, 45).fill(PRIMARY_COLOR);

            doc.fillColor('#ffffff').font(fontBold).fontSize(12);
            doc.text('NET TAKE HOME', totalBoxX + 15, y + 16);
            doc.fontSize(16);
            doc.text(`${currency}${payroll.totalPay.toFixed(2)}`, totalBoxX, y + 16, { width: totalBoxWidth - 15, align: 'right' });

            y += 75;

            // --- 5. NOTES SECTION ---
            if (payroll.notes) {
                doc.fillColor(ACCENT_COLOR).font(fontBold).fontSize(10).text('Important Notes:', MARGIN, y);
                y += 18;
                doc.fillColor(TEXT_COLOR).font(fontNormal).fontSize(9).text(payroll.notes, MARGIN, y, { width: CONTENT_WIDTH, lineGap: 3 });
                y += 45;
            }

            // --- 6. SIGNATURES ---
            y = Math.max(y, 700);

            const lineY = y;
            const lineLen = 170;

            drawLine(doc, lineY, '#475569', MARGIN, MARGIN + lineLen);
            doc.font(fontNormal).fontSize(9).fillColor(TEXT_COLOR).text('Authorized Signatory', MARGIN, lineY + 8);

            drawLine(doc, lineY, '#475569', MARGIN + CONTENT_WIDTH - lineLen, MARGIN + CONTENT_WIDTH);
            doc.text('Employee Signature', MARGIN + CONTENT_WIDTH - lineLen, lineY + 8);

            doc.fontSize(8).fillColor('#94a3b8').text('This is a computer-generated document and does not require a physical stamp.', MARGIN, doc.page.height - 35, { align: 'center' });

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
        .lineWidth(0.8)
        .stroke()
        .restore();
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const getCurrencySymbol = (currency) => {
    return '₹'; // Enforce Rupee as per user request
};

export default generatePayslipPDF;
