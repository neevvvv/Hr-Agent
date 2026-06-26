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

export function generateLetterContent({ docType, employee, profile, purpose }) {
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const refNo = `XYZ/${docType.split('_')[0]}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

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
___________________________
Priya Sharma
HR Manager, XYZ Corporation`;

  let body = '';
  switch (docType) {
    case 'EMPLOYMENT_LETTER':
      body = `
TO WHOM IT MAY CONCERN

This is to certify that **${employee.full_name}** is currently employed with XYZ Corporation as **${profile?.job_title || 'Software Engineer'}** in the **${profile?.department || 'Engineering'}** department.

The employee has been with our organization since **${employee.joined_on}** and continues to be in active employment.

This letter is issued upon the employee's request for the purpose of **${purpose}**.`.trim();
      break;

    case 'SALARY_CERTIFICATE':
      body = `
SALARY CERTIFICATE

This is to certify that **${employee.full_name}**, employed at XYZ Corporation as **${profile?.job_title || 'Software Engineer'}**, draws an annual CTC commensurate with the role and grade.

Employee details:
  • Date of joining: ${employee.joined_on}
  • Department: ${profile?.department || 'Engineering'}
  • Employee ID: EMP-${employee.id.toString().padStart(5, '0')}

This certificate is issued for the purpose of **${purpose}**.`.trim();
      break;

    case 'EXPERIENCE_LETTER':
      body = `
EXPERIENCE CERTIFICATE

This is to certify that **${employee.full_name}** has been associated with XYZ Corporation in the role of **${profile?.job_title || 'Software Engineer'}**, ${profile?.department || 'Engineering'} department, since **${employee.joined_on}**.

During this tenure, the employee has demonstrated professionalism, technical competence, and strong team collaboration.

This letter is issued for the purpose of **${purpose}**.`.trim();
      break;

    case 'ADDRESS_PROOF':
      body = `
ADDRESS VERIFICATION LETTER

This is to confirm that **${employee.full_name}**, employee of XYZ Corporation, has provided the following address on record:

  ${profile?.address_line1 || '[Address not on file]'}
  ${profile?.city || ''}, ${profile?.state || ''} ${profile?.postal_code || ''}
  ${profile?.country || 'India'}

This letter is issued for the purpose of **${purpose}**.`.trim();
      break;

    case 'NOC':
      body = `
NO OBJECTION CERTIFICATE

XYZ Corporation hereby states that it has no objection to **${employee.full_name}** (Employee ID: EMP-${employee.id.toString().padStart(5, '0')}), employed as **${profile?.job_title || 'Software Engineer'}**, undertaking activities related to:

  **${purpose}**

This NOC is issued at the request of the employee for the stated purpose only.`.trim();
      break;
  }

  return `${header}\n\n${body}\n\n${footer}`;
}