
const ExcelJS = require('exceljs');

async function inspectExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'd:/Dev/SPC/example_data/t(1).xlsx';
    await workbook.xlsx.readFile(filePath);

    {
        const sheet = workbook.getWorksheet('Union Member Statistics');
        console.log(`\n--- Sheet: Union Member Statistics ---`);
        for (let i = 1; i <= 6; i++) {
            const row = sheet.getRow(i);
            const values = row.values.slice(1);
            console.log(`Row ${i}:`, values.map((v, idx) => `${idx}:${v}`).join(' | '));
        }
        // Let's find specific columns
        const row4 = sheet.getRow(4).values;
        const row5 = sheet.getRow(5).values;
        const row6 = sheet.getRow(6).values;

        console.log("Searching for 'Player P&L' and 'Rake&Fee' Totals...");
        // Usually Player P&L Total and Rake&Fee Total are the last ones in their sections
    }

    {
        const sheet = workbook.getWorksheet('Union MTT Detail');
        console.log(`\n--- Sheet: Union MTT Detail ---`);
        for (let i = 1; i <= 7; i++) {
            const row = sheet.getRow(i);
            const values = row.values.slice(1);
            console.log(`Row ${i}:`, values.map((v, idx) => `${idx}:${v}`).join(' | '));
        }
    }
}

inspectExcel().catch(console.error);
