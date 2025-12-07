import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate a payslip PDF
 * @param {Object} payroll - Payroll document
 * @param {Object} staff - Staff document
 * @param {Object} settings - Settings document
 * @param {string} outputPath - Where to save the PDF
 */
export const generatePayslipPDF = async (payroll, staff, settings, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20).text(settings.companyName || 'Company Payslip', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(settings.companyAddress || '', { align: 'center' });
            doc.moveDown(2);

            // Payslip title
            doc.fontSize(16).text('Payslip', { align: 'center', underline: true });
            doc.moveDown(2);

            // Staff and period info
            doc.fontSize(12);
            doc.text(`Employee: ${staff.fullName}`);
            doc.text(`Email: ${staff.email}`);
            doc.text(`Designation: ${staff.designation || 'N/A'}`);
            doc.moveDown();
            doc.text(`Period: ${new Date(payroll.periodStart).toLocaleDateString()} - ${new Date(payroll.periodEnd).toLocaleDateString()}`);
            doc.moveDown(2);

            // Earnings table
            doc.fontSize(14).text('Earnings', { underline: true });
            doc.moveDown();
            doc.fontSize(11);

            const currencySymbol = getCurrencySymbol(settings.currency);

            doc.text(`Normal Hours: ${payroll.normalHours.toFixed(2)} hrs @ ${currencySymbol}${staff.hourlyRate}/hr`);
            doc.text(`Normal Pay: ${currencySymbol}${payroll.normalPay.toFixed(2)}`, { align: 'right', baseline: 'bottom' });
            doc.moveDown(0.5);

            doc.text(`Overtime Hours: ${payroll.otHours.toFixed(2)} hrs`);
            doc.text(`Overtime Pay: ${currencySymbol}${payroll.otPay.toFixed(2)}`, { align: 'right' });
            doc.moveDown(0.5);

            doc.text(`Travel Expenses: ${currencySymbol}${payroll.travelExpenses.toFixed(2)}`, { align: 'right' });
            doc.moveDown(2);

            // Deductions
            doc.fontSize(14).text('Deductions', { underline: true });
            doc.moveDown();
            doc.fontSize(11);
            doc.text(`Leave Deductions: ${currencySymbol}${payroll.leaveDeductions.toFixed(2)}`, { align: 'right' });
            doc.moveDown(2);

            // Total
            doc.fontSize(14);
            doc.rect(50, doc.y, 500, 1).fill('#000');
            doc.moveDown();
            doc.text(`Total Pay: ${currencySymbol}${payroll.totalPay.toFixed(2)}`, { bold: true, align: 'right' });
            doc.moveDown();
            doc.rect(50, doc.y, 500, 1).fill('#000');

            // Footer
            doc.moveDown(3);
            doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.text(`Status: ${payroll.isPaid ? 'PAID' : 'UNPAID'}`, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Get currency symbol
 */
const getCurrencySymbol = (currency) => {
    const symbols = {
        USD: '$',
        GBP: '£',
        EUR: '€',
        INR: '₹',
        SGD: 'S$',
        AUD: 'A$',
        CAD: 'C$',
    };
    return symbols[currency] || currency;
};

export default generatePayslipPDF;
