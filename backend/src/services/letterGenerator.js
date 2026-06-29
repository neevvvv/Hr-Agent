import PDFDocument from 'pdfkit';

const docTypeLabels = {
  EMPLOYMENT_LETTER:  'Employment Letter',
  SALARY_CERTIFICATE: 'Salary Certificate',
  EXPERIENCE_LETTER:  'Experience Letter',
  ADDRESS_PROOF:      'Address Proof Letter',
  NOC:                'No Objection Certificate',
};

export function getDocTypeLabel(type) {
  return docTypeLabels[type] || type;
}

function formatDate(value) {
  if (!value) return '—';

  try {
    return new Date(value).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(value);
  }
}

// =====================================
// Plain-text letter content (existing)
// =====================================
export function generateLetterContent({ docType, employee, profile, purpose }) {
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const refNo = `XYZ/${docType.split('_')[0]}/${new Date().getFullYear()}/${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const header = `
═══════════════════════════════════════════════════
                  XYZ CORPORATION
        Human Resources Department
              Bengaluru, India
═══════════════════════════════════════════════════

Ref: ${refNo}
Date: ${today}
`.trim();

  const footer = `
For any verification, please contact:
HR Department · hr@xyzcorp.com · +91-80-1234-5678

This is a system-generated document.

____________________________
Priya Sharma
HR Manager, XYZ Corporation
`.trim();

  let body = '';

  switch (docType) {
    case 'EMPLOYMENT_LETTER':
      body = `
TO WHOM IT MAY CONCERN

This is to certify that **${employee.full_name}** is currently employed with XYZ Corporation as **${profile?.job_title || 'Software Engineer'}** in the **${profile?.department || 'Engineering'}** department.

The employee has been with our organization since **${formatDate(employee.joined_on)}** and continues to be in active employment.

This letter is issued upon the employee's request for the purpose of **${purpose}**.
`.trim();
      break;

    case 'SALARY_CERTIFICATE':
      body = `
SALARY CERTIFICATE

This is to certify that **${employee.full_name}**, employed at XYZ Corporation as **${profile?.job_title || 'Software Engineer'}**, draws an annual CTC commensurate with the role and grade.

Employee details:
  • Date of joining: ${formatDate(employee.joined_on)}
  • Department: ${profile?.department || 'Engineering'}
  • Employee ID: EMP-${employee.id.toString().padStart(5, '0')}

This certificate is issued for the purpose of **${purpose}**.
`.trim();
      break;

    case 'EXPERIENCE_LETTER':
      body = `
EXPERIENCE CERTIFICATE

This is to certify that **${employee.full_name}** has been associated with XYZ Corporation in the role of **${profile?.job_title || 'Software Engineer'}**, ${profile?.department || 'Engineering'} department, since **${formatDate(employee.joined_on)}**.

During this tenure, the employee has demonstrated professionalism, technical competence, and strong team collaboration.

This letter is issued for the purpose of **${purpose}**.
`.trim();
      break;

    case 'ADDRESS_PROOF':
      body = `
ADDRESS VERIFICATION LETTER

This is to confirm that **${employee.full_name}**, employee of XYZ Corporation, has provided the following address on record:

  ${profile?.address_line1 || '[Address not on file]'}
  ${[profile?.city, profile?.state, profile?.postal_code].filter(Boolean).join(', ')}
  ${profile?.country || 'India'}

This letter is issued for the purpose of **${purpose}**.
`.trim();
      break;

    case 'NOC':
      body = `
NO OBJECTION CERTIFICATE

XYZ Corporation hereby states that it has no objection to **${employee.full_name}** (Employee ID: EMP-${employee.id.toString().padStart(5, '0')}), employed as **${profile?.job_title || 'Software Engineer'}**, undertaking activities related to:

  **${purpose}**

This NOC is issued at the request of the employee for the stated purpose only.
`.trim();
      break;

    default:
      body = `
TO WHOM IT MAY CONCERN

This is to certify that **${employee.full_name}** is associated with XYZ Corporation.

This letter is issued for the purpose of **${purpose}**.
`.trim();
      break;
  }

  return `${header}\n\n${body}\n\n${footer}`;
}

// =====================================
// PDF letter generation (new)
// =====================================
export function generateLetterPdf({ docType, employee, profile, purpose }) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 56,
    info: {
      Title: getDocTypeLabel(docType),
      Author: 'XYZ Corporation HR Department',
      Subject: getDocTypeLabel(docType),
    },
  });

  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const refNo = `XYZ/${docType.split('_')[0]}/${new Date().getFullYear()}/${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  // ===== Company header =====
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#0f172a')
    .text('XYZ CORPORATION', { align: 'center' });

  doc
    .moveDown(0.2)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#475569')
    .text('Human Resources Department · Bengaluru, India', {
      align: 'center',
    });

  doc
    .moveDown(0.8)
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .moveTo(56, doc.y)
    .lineTo(539, doc.y)
    .stroke();

  // ===== Ref + Date row =====
  doc.moveDown(1);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#475569')
    .text(`Ref: ${refNo}`, { continued: true })
    .text(`Date: ${today}`, { align: 'right' });

  // ===== Title =====
  doc.moveDown(1.5);

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#111827')
    .text(getDocTypeLabel(docType), { align: 'center' });

  doc.moveDown(1.25);

  // ===== Body content =====
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#1f2937');

  const writeParagraph = (text) => {
    doc.text(text, { align: 'left', lineGap: 5 });
    doc.moveDown(0.6);
  };

  switch (docType) {
    case 'EMPLOYMENT_LETTER':
      writeParagraph('TO WHOM IT MAY CONCERN');
      writeParagraph(
        `This is to certify that ${employee.full_name} is currently employed with XYZ Corporation as ${profile?.job_title || 'Software Engineer'} in the ${profile?.department || 'Engineering'} department.`
      );
      writeParagraph(
        `The employee has been with our organization since ${formatDate(employee.joined_on)} and continues to be in active employment.`
      );
      writeParagraph(
        `This letter is issued upon the employee's request for the purpose of ${purpose}.`
      );
      break;

    case 'SALARY_CERTIFICATE':
      writeParagraph('SALARY CERTIFICATE');
      writeParagraph(
        `This is to certify that ${employee.full_name}, employed at XYZ Corporation as ${profile?.job_title || 'Software Engineer'}, draws an annual CTC commensurate with the role and grade.`
      );
      writeParagraph('Employee details:');
      writeParagraph(`   • Date of joining: ${formatDate(employee.joined_on)}`);
      writeParagraph(`   • Department: ${profile?.department || 'Engineering'}`);
      writeParagraph(`   • Employee ID: EMP-${employee.id.toString().padStart(5, '0')}`);
      writeParagraph(
        `This certificate is issued for the purpose of ${purpose}.`
      );
      break;

    case 'EXPERIENCE_LETTER':
      writeParagraph('EXPERIENCE CERTIFICATE');
      writeParagraph(
        `This is to certify that ${employee.full_name} has been associated with XYZ Corporation in the role of ${profile?.job_title || 'Software Engineer'}, ${profile?.department || 'Engineering'} department, since ${formatDate(employee.joined_on)}.`
      );
      writeParagraph(
        'During this tenure, the employee has demonstrated professionalism, technical competence, and strong team collaboration.'
      );
      writeParagraph(
        `This letter is issued for the purpose of ${purpose}.`
      );
      break;

    case 'ADDRESS_PROOF':
      writeParagraph('ADDRESS VERIFICATION LETTER');
      writeParagraph(
        `This is to confirm that ${employee.full_name}, employee of XYZ Corporation, has provided the following address on record:`
      );
      writeParagraph(`   ${profile?.address_line1 || '[Address not on file]'}`);
      writeParagraph(
        `   ${[profile?.city, profile?.state, profile?.postal_code].filter(Boolean).join(', ')}`
      );
      writeParagraph(`   ${profile?.country || 'India'}`);
      writeParagraph(
        `This letter is issued for the purpose of ${purpose}.`
      );
      break;

    case 'NOC':
      writeParagraph('NO OBJECTION CERTIFICATE');
      writeParagraph(
        `XYZ Corporation hereby states that it has no objection to ${employee.full_name} (Employee ID: EMP-${employee.id.toString().padStart(5, '0')}), employed as ${profile?.job_title || 'Software Engineer'}, undertaking activities related to:`
      );
      writeParagraph(`   ${purpose}`);
      writeParagraph(
        'This NOC is issued at the request of the employee for the stated purpose only.'
      );
      break;

    default:
      writeParagraph('TO WHOM IT MAY CONCERN');
      writeParagraph(
        `This is to certify that ${employee.full_name} is associated with XYZ Corporation.`
      );
      writeParagraph(
        `This letter is issued for the purpose of ${purpose}.`
      );
      break;
  }

  // ===== Signature block =====
  doc.moveDown(2);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#475569')
    .text('____________________________', { align: 'left' });

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text('Priya Sharma', { align: 'left' });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#475569')
    .text('HR Manager, XYZ Corporation', { align: 'left' });

  // ===== Footer =====
  doc.moveDown(1.5);

  doc
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .moveTo(56, doc.y)
    .lineTo(539, doc.y)
    .stroke();

  doc.moveDown(0.5);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#64748b')
    .text(
      'For verification: hr@xyzcorp.com · +91-80-1234-5678',
      { align: 'center' }
    );

  doc
    .moveDown(0.2)
    .text('This is a system-generated document.', { align: 'center' });

  return doc;
}