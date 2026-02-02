
const ExcelJS = require('exceljs');

async function verifyOverlap() {
    const workbook = new ExcelJS.Workbook();
    const filePath = 'd:/Dev/SPC/example_data/t(1).xlsx';
    await workbook.xlsx.readFile(filePath);

    const mttSheet = workbook.getWorksheet('Union MTT Detail');
    const memberSheet = workbook.getWorksheet('Union Member Statistics');

    // 1. Find a player in MTT Detail with activity
    let targetPlayer = null;
    mttSheet.eachRow((row, rowNumber) => {
        if (rowNumber < 8) return;
        const playerNickname = row.getCell(4).value?.toString()?.toLowerCase();
        if (playerNickname === 'total') return;

        const pnl = parseFloat(row.getCell(17).value || 0);
        if (pnl !== 0) {
            targetPlayer = {
                id: row.getCell(3).value?.toString()?.trim(),
                nickname: row.getCell(4).value?.toString()?.trim(),
                mttPnl: pnl
            };
            return false; // stop iteration
        }
    });

    if (!targetPlayer) {
        console.log("No player with MTT activity found in 'Union MTT Detail'.");
        return;
    }

    console.log(`Found player in MTT Detail: ${targetPlayer.nickname} (${targetPlayer.id}) with PnL: ${targetPlayer.mttPnl}`);

    // 2. Find this player in Member Statistics
    let foundInMember = false;
    memberSheet.eachRow((row, rowNumber) => {
        if (rowNumber < 7) return;
        const memberId = row.getCell(9).value?.toString()?.trim();
        if (memberId === targetPlayer.id) {
            foundInMember = true;
            console.log(`\n--- Member Statistics for ${targetPlayer.nickname} ---`);

            // Analyze columns
            // Column 38 is usually Total P&L
            // Let's print all non-zero numeric columns to see what's what
            row.eachCell((cell, colNum) => {
                const val = cell.value;
                if (typeof val === 'number' && val !== 0 || colNum === 151 || colNum === 38) {
                    const row4Header = memberSheet.getRow(4).getCell(colNum).value;
                    const row5Header = memberSheet.getRow(5).getCell(colNum).value;
                    const row6Header = memberSheet.getRow(6).getCell(colNum).value;
                    console.log(`Col ${colNum} (${row4Header} > ${row5Header} > ${row6Header}): ${val}`);
                }
            });
        }
    });

    if (!foundInMember) {
        console.log(`Player ${targetPlayer.id} not found in 'Union Member Statistics'.`);
    }
}

verifyOverlap().catch(console.error);
