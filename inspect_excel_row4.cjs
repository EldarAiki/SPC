
const ExcelJS = require('exceljs');

async function inspectExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'd:/Dev/SPC/example_data/t(1).xlsx';
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet('Union Member Statistics');
    const row4 = sheet.getRow(4).values;
    const row5 = sheet.getRow(5).values;
    const row6 = sheet.getRow(6).values;

    console.log("Row 4 Analysis:");
    row4.forEach((v, i) => {
        if (v) console.log(`${i}: ${v}`);
    });

    console.log("\nRow 5 'Total' columns:");
    row5.forEach((v, i) => {
        if (v === 'Total') console.log(`${i}: Total (Parent in Row 4: ${row4[i]})`);
    });
}

inspectExcel().catch(console.error);
