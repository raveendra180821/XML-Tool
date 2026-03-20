import React, { useState, useRef, useEffect } from "react";
import { MdContentCopy } from "react-icons/md";
import { FaDownload } from "react-icons/fa6";

import "./XMLTool.css";
import {
  convertXMLToCSV,
  extractAllTags,
  extractTagsFromGroup,
} from "../utils/xmlUtils";

export default function XMLTool() {
  const [xmlInput, setXmlInput] = useState("");
  const [output, setOutput] = useState("");
  const [tableData, setTableData] = useState([]);
  const [groupTags, setGroupTags] = useState([]);
  const [childTags, setChildTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [fileName, setFileName] = useState("Get_Status_Mappings.csv");
  const [config, setConfig] = useState({
    groupTag: "",
    stepTag: "",
    labelTag: "",
    referenceTag: "",
  });

  useEffect(() => {
    const handleClick = (e) => {
      // If click is OUTSIDE dropdown → close
      if (
        !e.target.closest(".tools-dropdown") &&
        !e.target.closest(".header-right")
      ) {
        setShowToolsModal(false);
      }
    };

    if (showToolsModal) {
      window.addEventListener("click", handleClick);
    }

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [showToolsModal]);

  const fileInputRef = useRef(null);
  const outputRef = useRef(null);

  // Detect all tags
  const handleDetectTags = () => {
    try {
      const tags = extractAllTags(xmlInput);
      setGroupTags(tags);

      // 🔥 Try auto-detection
      const detected = autoDetectMapping(tags);

      if (detected) {
        setConfig(detected);

        // Load child tags automatically
        const child = extractTagsFromGroup(xmlInput, detected.groupTag);
        setChildTags(child);
      } else {
        // fallback reset
        setConfig({
          groupTag: "",
          stepTag: "",
          labelTag: "",
          referenceTag: "",
        });
        setChildTags([]);
      }
    } catch {
      alert("Invalid XML");
    }
  };

  const autoDetectMapping = (tags) => {
    const hasGroup = tags.includes("Business_Process_Steps_group");

    if (!hasGroup) return null;

    return {
      groupTag: "Business_Process_Steps_group",
      stepTag: "Workflow_Step",
      labelTag: "Workflow_Step_Alternate_Name",
      referenceTag: "referenceID",
    };
  };

  // When group changes → extract child tags
  const handleGroupChange = (value) => {
    const updatedConfig = { ...config, groupTag: value };
    setConfig(updatedConfig);

    const tags = extractTagsFromGroup(xmlInput, value);
    setChildTags(tags);
  };

  // Convert
  const handleConvert = () => {
    try {
      setLoading(true);

      setTimeout(() => {
        const { csv, tableData } = convertXMLToCSV(xmlInput, config);
        setOutput(csv);
        setTableData(tableData);
        setLoading(false);

        setTimeout(() => {
          outputRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }, 300);
    } catch (err) {
      setOutput("❌ " + err.message);
      setTableData([]);
      setLoading(false);
    }
  };

  // Download
  const handleDownloadConfirm = () => {
    if (!fileName.trim()) return;

    let finalName = fileName.endsWith(".csv") ? fileName : fileName + ".csv";

    const blob = new Blob([output], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = finalName;
    a.click();

    URL.revokeObjectURL(url);
    setShowModal(false);
  };

  // Copy
  const copyToClipboard = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);

      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy");
    }
  };

  // Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);

    // Auto-generate CSV file name from uploaded XML
    const baseName = file.name.replace(/\.xml$/i, "");

    // Only set if user hasn't manually changed it
    setFileName((prev) => {
      if (
        prev === "Get_Status_Mappings.csv" || // default
        prev === "" ||
        prev.endsWith(".csv")
      ) {
        return baseName + ".csv";
      }
      return prev;
    });

    const reader = new FileReader();
    reader.onload = (event) => setXmlInput(event.target.result);
    reader.readAsText(file);
  };

  const handleReset = () => {
    setIsResetting(true);

    setTimeout(() => {
      setUploadedFileName("");
      setFileName("Get_Status_Mappings.csv");
      setXmlInput("");
      setOutput("");
      setTableData([]);
      setGroupTags([]);
      setChildTags([]);
      setConfig({
        groupTag: "",
        stepTag: "",
        labelTag: "",
        referenceTag: "",
      });
      setCopied(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setIsResetting(false);
    }, 400); // animation duration
  };

  const handleXmlChange = (value) => {
    setXmlInput(value);

    // Reset everything if empty
    if (!value.trim()) {
      setOutput("");
      setTableData([]);
      setGroupTags([]);
      setChildTags([]);
      setConfig({
        groupTag: "",
        stepTag: "",
        labelTag: "",
        referenceTag: "",
      });
    }
  };

  // Disable logic
  const isConvertDisabled =
    !xmlInput ||
    !config.groupTag ||
    !config.stepTag ||
    !config.labelTag ||
    !config.referenceTag;

  return (
    <>
      <div className="app-header">
        {/* LEFT */}
        <div className="header-left">
          🛠 <span>XML to CSV Converter</span>
        </div>

        {/* RIGHT */}
        <div className="header-right">
          <button onClick={() => setShowToolsModal(true)}>
            🔗 Other Tools
          </button>
        </div>
      </div>

      {showToolsModal && (
        <div
          className="tools-dropdown-wrapper"
          onClick={() => setShowToolsModal(false)} // 👈 outside click closes
        >
          <div
            className="tools-dropdown"
            onClick={(e) => e.stopPropagation()} // 👈 PREVENT close when clicking inside
          >
            <h4>Other Tools</h4>

            <a
              href="https://data-hugger-05.lovable.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lovable ↗
            </a>

            <button
              className="close-btn"
              onClick={() => setShowToolsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className={`container ${isResetting ? "resetting" : ""}`}>
        {uploadedFileName && (
          <div className="file-name hide-scrollbar">{uploadedFileName}</div>
        )}

        {/* INPUT */}
        <div className="card">
          <div className="upload-header">
            <label className="file-upload">
              📂 Upload XML
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </label>

            <button className="reset-btn" onClick={handleReset}>
              ♻ Reset
            </button>
          </div>

          <p className="or">-- OR --</p>

          <textarea
            value={xmlInput}
            onChange={(e) => handleXmlChange(e.target.value)}
            placeholder="Paste your XML here..."
          />

          <div className="actions">
            <button className="secondary-btn" onClick={handleDetectTags}>
              🔍 Detect Tags
            </button>
          </div>

          {/* Mapping */}
          {groupTags.length > 0 && (
            <div className="mapping">
              <div className="field">
                <label>Group Tag</label>
                <select
                  value={config.groupTag}
                  onChange={(e) => handleGroupChange(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {groupTags.map((tag) => (
                    <option key={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Workflow Step Tag</label>
                <select
                  value={config.stepTag}
                  onChange={(e) =>
                    setConfig({ ...config, stepTag: e.target.value })
                  }
                >
                  <option value="">-- Select --</option>
                  {childTags.map((tag) => (
                    <option key={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Label Tag</label>
                <select
                  value={config.labelTag}
                  onChange={(e) =>
                    setConfig({ ...config, labelTag: e.target.value })
                  }
                >
                  <option value="">-- Select --</option>
                  {childTags.map((tag) => (
                    <option key={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Reference ID Tag</label>
                <select
                  value={config.referenceTag}
                  onChange={(e) =>
                    setConfig({ ...config, referenceTag: e.target.value })
                  }
                >
                  <option value="">-- Select --</option>
                  {childTags.map((tag) => (
                    <option key={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="actions">
            <button
              className="primary-btn"
              onClick={handleConvert}
              disabled={isConvertDisabled}
            >
              ⚡ Convert to CSV
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && <div className="loader">Processing XML...</div>}

        {/* Output */}
        {tableData.length > 0 && (
          <div className="card" ref={outputRef}>
            <div className="output-header">
              <h3>Results</h3>

              <div className="output-actions">
                <span className="stats">
                  <b>Rows: </b>
                  {tableData.length}
                </span>

                <button
                  className="secondary-btn small"
                  onClick={() => setShowModal(true)}
                >
                  <FaDownload />
                </button>

                <button
                  className={`secondary-btn small ${copied ? "copied" : ""}`}
                  onClick={copyToClipboard}
                >
                  {copied ? "✔ Copied" : <MdContentCopy />}
                </button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Workflow Step</th>
                    <th>Label</th>
                    <th>Reference ID</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i}>
                      <td>{row.stepName}</td>
                      <td>{row.label}</td>
                      <td className="mono">{row.referenceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h4>Download File</h4>

              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
              />

              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button className="primary-btn" onClick={handleDownloadConfirm}>
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
