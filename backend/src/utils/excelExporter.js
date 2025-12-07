import XLSX from 'xlsx';

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {string} sheetName - Name of the sheet
 * @param {string} filePath - Output file path
 */
export const exportToExcel = (data, sheetName, filePath) => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, filePath);
        return filePath;
    } catch (error) {
        throw new Error(`Error exporting to Excel: ${error.message}`);
    }
};

/**
 * Export multiple sheets to Excel
 * @param {Array} sheets - Array of {name, data} objects
 * @param {string} filePath - Output file path
 */
export const exportMultipleSheets = (sheets, filePath) => {
    try {
        const workbook = XLSX.utils.book_new();

        sheets.forEach(sheet => {
            const worksheet = XLSX.utils.json_to_sheet(sheet.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        });

        XLSX.writeFile(workbook, filePath);
        return filePath;
    } catch (error) {
        throw new Error(`Error exporting to Excel: ${error.message}`);
    }
};

export default { exportToExcel, exportMultipleSheets };
