
const ExcelJS = require('exceljs');

async function compareDetailedVsSummary() {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'd:/Dev/SPC/example_data/t(1).xlsx';
    await workbook.xlsx.readFile(filePath);

    const mttSheet = workbook.getWorksheet('Union MTT Detail');
    const memberSheet = workbook.getWorksheet('Union Member Statistics');

    const playerId = '4406-1298'; // Mangisto San

    console.log(`--- Comparing data for Player ${playerId} ---`);

    // 1. Sum up MTT Detail
    let mttDetailPnl = 0;
    let mttDetailRake = 0;
    mttSheet.eachRow((row, rowNumber) => {
        if (rowNumber < 8) return;
        if (row.getCell(3).value?.toString()?.trim() === playerId) {
            const pnl = parseFloat(row.getCell(17).value || 0);

            // Rake: Total Buy-in Fee (7, 8) + Total Re-Entry Fee (11, 12)
            // (Note: excel-parser uses 1-based indexing for row.getCell)
            // Row 7 & 8 are Fees for Buy-in (Chips/Ticket)
            // Row 11 & 12 are Fees for Re-Entry (Chips/Ticket)
            const fee1 = parseFloat(row.getCell(7).value || 0);
            const fee2 = parseFloat(row.getCell(8).value || 0);
            const fee3 = parseFloat(row.getCell(11).value || 0);
            const fee4 = parseFloat(row.getCell(12).value || 0);
            const rake = fee1 + fee2 + fee3 + fee4;

            mttDetailPnl += pnl;
            mttDetailRake += rake;
            console.log(`MTT Row ${rowNumber} PnL: ${pnl}, Rake: ${rake}`);
        }
    });

    console.log(`MTT Detail TOTAL -> PnL: ${mttDetailPnl}, Rake: ${mttDetailRake}`);

    // 2. Look at Member Statistics
    memberSheet.eachRow((row, rowNumber) => {
        if (rowNumber < 7) return;
        if (row.getCell(9).value?.toString()?.trim() === playerId) {
            console.log(`Member Statistics -> MTT PnL (Col 30): ${row.getCell(30).value}, MTT Rake (Col 57): ${row.getCell(57).value}`);
        }
    });
}

compareDetailedVsSummary().catch(console.error);
