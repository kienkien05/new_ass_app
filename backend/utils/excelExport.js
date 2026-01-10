const ExcelJS = require('exceljs');

/**
 * Generate revenue report as Excel file
 * @param {Array} data - Revenue data array
 * @param {Object} options - Report options
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function generateRevenueReport(data, options = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EViENT System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Báo cáo doanh thu');

    // Header styling
    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        }
    };

    // Define columns
    sheet.columns = [
        { header: 'Ngày', key: 'date', width: 15 },
        { header: 'Sự kiện', key: 'event', width: 30 },
        { header: 'Số vé', key: 'tickets', width: 12 },
        { header: 'Doanh thu (VNĐ)', key: 'revenue', width: 20 }
    ];

    // Style header row
    sheet.getRow(1).eachCell((cell) => {
        Object.assign(cell, headerStyle);
    });
    sheet.getRow(1).height = 25;

    // Add data rows
    data.forEach((row, index) => {
        const dataRow = sheet.addRow({
            date: row.date,
            event: row.eventTitle,
            tickets: row.ticketCount,
            revenue: row.revenue
        });

        // Alternate row colors
        if (index % 2 === 1) {
            dataRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2F2F2' }
                };
            });
        }

        // Format currency column
        dataRow.getCell('revenue').numFmt = '#,##0';
    });

    // Add summary row
    const totalRevenue = data.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
    const totalTickets = data.reduce((sum, row) => sum + Number(row.ticketCount || 0), 0);

    const summaryRow = sheet.addRow({
        date: 'TỔNG CỘNG',
        event: '',
        tickets: totalTickets,
        revenue: totalRevenue
    });

    summaryRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF2CC' }
        };
    });
    summaryRow.getCell('revenue').numFmt = '#,##0';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = { generateRevenueReport };
