const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
  // Read the Excel file
  const filePath = path.join(__dirname, 'Uniformat Building Elements Code.xlsx');
  const workbook = XLSX.readFile(filePath);
  
  console.log('Sheet names:', workbook.SheetNames);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Process each sheet
  workbook.SheetNames.forEach(sheetName => {
    console.log(`Sheet: ${sheetName}`);
    console.log('-'.repeat(40));
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Print the data
    jsonData.forEach((row, index) => {
      if (row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
        console.log(row.map(cell => cell || '').join('\t'));
      }
    });
    
    console.log('\n' + '='.repeat(80) + '\n');
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
  
  // Try to read the file as binary and show first few bytes
  try {
    const buffer = fs.readFileSync(path.join(__dirname, 'Uniformat Building Elements Code.xlsx'));
    console.log('\nFile exists, size:', buffer.length, 'bytes');
    console.log('First 16 bytes (hex):', buffer.slice(0, 16).toString('hex'));
  } catch (fsError) {
    console.error('File system error:', fsError.message);
  }
}