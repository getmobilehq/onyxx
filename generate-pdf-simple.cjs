const fs = require('fs');
const htmlPdf = require('html-pdf-node');

async function generateSimplePDF() {
  const assessmentId = 'da5031dc-9e28-490f-82fe-a426a96d7396';
  
  try {
    console.log('📊 Generating PDF report...');
    
    // Read the HTML file we created
    const htmlContent = fs.readFileSync(`assessment-report-${assessmentId}.html`, 'utf8');
    
    let options = { 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    };
    
    let file = { content: htmlContent };
    
    // Generate PDF
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    const pdfFileName = `assessment-report-${assessmentId}.pdf`;
    fs.writeFileSync(pdfFileName, pdfBuffer);
    
    console.log('✅ PDF generated successfully!');
    console.log(`💾 PDF saved as: ${pdfFileName}`);
    console.log(`📄 File size: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
  }
}

generateSimplePDF();