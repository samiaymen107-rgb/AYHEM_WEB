// يولد توثيقًا تلقائيًا لأي وحدة جديدة

export function autoDocument(unitName, purpose) {
  return `
# ${unitName}

## Purpose
${purpose}

## Status
AUTO-DOCUMENTED

## Linked to
AYHEM SUPREME MANDATE
`;
}
