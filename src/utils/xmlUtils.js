// Parse XML
export function parseXML(xmlStr) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlStr, "application/xml");

  const errorNode = xml.querySelector("parsererror");
  if (errorNode) {
    throw new Error(errorNode.textContent);
  }

  return xml;
}

// 🔍 Extract ALL tags (for group selection)
export function extractAllTags(xmlStr) {
  const xml = parseXML(xmlStr);
  const elements = xml.getElementsByTagName("*");

  const tags = new Set();
  for (let el of elements) {
    tags.add(el.localName);
  }

  return Array.from(tags).sort();
}

// 🎯 Extract ONLY tags inside selected group
export function extractTagsFromGroup(xmlStr, groupTag) {
  const xml = parseXML(xmlStr);
  const groups = xml.getElementsByTagNameNS("*", groupTag);

  const tags = new Set();

  for (let group of groups) {
    const elements = group.getElementsByTagName("*");

    for (let el of elements) {
      tags.add(el.localName);
    }
  }

  return Array.from(tags).sort();
}

// 🔄 Convert XML → CSV (dynamic)
export function convertXMLToCSV(xmlStr, config) {
  const xml = parseXML(xmlStr);

  const { groupTag, stepTag, labelTag, referenceTag } = config;

  if (!groupTag || !stepTag || !labelTag || !referenceTag) {
    throw new Error("Please select all mapping fields");
  }

  const groups = xml.getElementsByTagNameNS("*", groupTag);

  let csv = "Workflow_Step,label,referenceID\n";
  let tableData = [];

  for (let group of groups) {
    const stepNode = group.getElementsByTagNameNS("*", stepTag)[0];
    const labelNode = group.getElementsByTagNameNS("*", labelTag)[0];
    const refNode = group.getElementsByTagNameNS("*", referenceTag)[0];

    const stepName =
      stepNode?.getAttribute("wd:Descriptor") ||
      stepNode?.getAttribute("Descriptor") ||
      stepNode?.textContent?.trim() ||
      "";

    const label = labelNode?.textContent?.trim() || "";
    const referenceId = refNode?.textContent?.trim() || "";

    const clean = (val) => `"${val.replace(/"/g, '""')}"`;

    csv += `${clean(stepName)},${clean(label)},${clean(referenceId)}\n`;

    tableData.push({ stepName, label, referenceId });
  }

  return { csv, tableData };
}
