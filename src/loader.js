const config = require('config');
const csv = require('ya-csv');
const fs = require('fs');
const hash = require('honesthash')({ speed: 1 });
const http = require('https');
const Promise = require('bluebird');
const xlsx = require('xlsx');

const db = require('./db');

const salesXlsxPath = config.get('data.path') + config.get('data.sales_xlsx_name');
const sourcePath = config.get('data.source_path');

const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сент', 'окт', 'нояб', 'дек'];


const convertSalesXlsxToCsv = () => new Promise((resolve, reject) => {
    try {
        const workbook = xlsx.readFile(salesXlsxPath);
        const salesSheet = workbook.Sheets['Продажи'];
        const salesCsv = xlsx.utils.sheet_to_csv(salesSheet);
        fs.writeFile(sourcePath, salesCsv, resolve);
    }
    catch (e) {
        reject(e);
    }
});

const loadSales = () => new Promise(resolve => {
    const sales = [];

    csv.createCsvFileReader(sourcePath, {
        separator: ',',
        quote: '"',
        escape: '',
        comment: '',
        columnsFromHeader: true
    }).addListener('data', data => {
        if (data['Статус'] == 'Удален') {
            return;
        }

        const dateParts = data['Дата'].split(' ');
        const timeParts = data['Дата открытия'].split(', ')[1].split(':');

        const date = new Date(
            2000 + parseInt(dateParts[2]),
            months.indexOf(dateParts[1]),
            dateParts[0],
            timeParts[0],
            timeParts[1],
            0);

        var sale = {
            datetime: date,
            client_personnel_number: data['ТН'],
            client_surname: data['Фамилия'],
            client_card_number: data['Номер карты'],
            sum: data['Сумма бонусов'],
            receipt_number: data['Номер чека'],
            payment_by_cash: parseFloat(data['Оплачено наличкой']) || 0,
            payment_by_card: parseFloat(data['карточкой']) || 0,
            payment_by_certificate: parseFloat(data['сертификатом']) || 0,
            payment_by_bonuses: parseFloat(data['бонусами']) || 0,
            comment: data['Комментарий'] || '',
            status: data['Статус'] || ''
        };

        sale.id = hash.hex(JSON.stringify(sale));

        sales.push(sale);
    }).addListener('end', () => {
        resolve(sales);
    });
});

const loadSalesFile = () => convertSalesXlsxToCsv()
    .then(loadSales)
    .then(db.saveSales);

module.exports = {
    loadSalesFile
};
