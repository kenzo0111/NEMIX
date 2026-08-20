import React from 'react';

// --- Interfaces ---

export interface RisItem {
  stock_no?: string;
  unit?: string;
  description?: string;
  quantity?: number | string;
  stock_available?: boolean; // Determines where the checkmark goes
  issue_quantity?: number | string;
  remarks?: string;
}

export interface RisData {
  entity_name?: string;
  fund_cluster?: string;
  division?: string;
  responsibility_center_code?: string;
  office?: string;
  ris_no?: string;
  purpose?: string;
  
  // Items
  items?: RisItem[];

  // Signatories
  requested_by_signature?: string;
  requested_by_name?: string;
  requested_by_designation?: string;
  requested_by_date?: string; // ISO Date string

  approved_by_signature?: string;
  approved_by_name?: string;
  approved_by_designation?: string;
  approved_by_date?: string;

  issued_by_signature?: string;
  issued_by_name?: string;
  issued_by_designation?: string;
  issued_by_date?: string;

  received_by_signature?: string;
  received_by_name?: string;
  received_by_designation?: string;
  received_by_date?: string;
}

interface RequisitionIssueSlipProps {
  data: RisData;
}

// --- Helper Functions ---

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const getDynamicNameStyle = (name?: string): React.CSSProperties => {
  if (!name) return { fontSize: '9pt', whiteSpace: 'nowrap' };
  const len = name.trim().length;
  if (len > 32) {
    return { fontSize: '6.5pt', whiteSpace: 'nowrap', display: 'inline-block' };
  }
  if (len > 24) {
    return { fontSize: '7.5pt', whiteSpace: 'nowrap', display: 'inline-block' };
  }
  if (len > 18) {
    return { fontSize: '8pt', whiteSpace: 'nowrap', display: 'inline-block' };
  }
  return { fontSize: '9pt', whiteSpace: 'nowrap', display: 'inline-block' };
};

const getDynamicDesignationStyle = (designation?: string): React.CSSProperties => {
  if (!designation) return { fontSize: '8pt', whiteSpace: 'nowrap' };
  const len = designation.trim().length;
  if (len > 32) {
    return { fontSize: '6.5pt', whiteSpace: 'nowrap', display: 'inline-block', lineHeight: 1.1 };
  }
  if (len > 24) {
    return { fontSize: '7pt', whiteSpace: 'nowrap', display: 'inline-block', lineHeight: 1.1 };
  }
  if (len > 16) {
    return { fontSize: '7.5pt', whiteSpace: 'nowrap', display: 'inline-block', lineHeight: 1.1 };
  }
  return { fontSize: '8pt', whiteSpace: 'nowrap', display: 'inline-block', lineHeight: 1.1 };
};

export const RequisitionIssueSlip: React.FC<RequisitionIssueSlipProps> = ({ data }) => {
  // Logic to pad empty rows to reach exactly 20 lines like the original PHP loop
  const items = data.items || [];
  const targetRowCount = 20;
  const emptyRowsCount = Math.max(0, targetRowCount - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page {
            size: A4 portrait;
            margin: 20px;
        }
        .ris-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            background: #fff;
            color: #000;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            box-sizing: border-box;
        }
        .header-title {
            text-align: right;
            font-style: italic;
            font-size: 12pt;
            margin-bottom: 5px;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        /* Info Table (Entity/Fund) */
        .info-table td {
            padding: 3px 5px;
            font-size: 9pt;
            vertical-align: bottom;
        }
        .info-table .field {
            border-bottom: 1px solid #000;
            min-width: 200px;
            font-weight: bold;
        }
        
        /* Main Grid Table */
        .main-table {
            margin-top: 10px;
            border: 1px solid #000;
            width: 100%;
        }
        .main-table th, .main-table td {
            border: 1px solid #000;
            padding: 4px;
            font-size: 9pt;
        }
        .main-table th {
            background-color: #f0f0f0; /* Matches original gray shade */
            font-weight: bold;
            text-align: center;
        }
        .main-table .section-header {
            font-style: italic;
            background-color: #ffffff; /* White background for 'Requisition' header */
        }
        .main-table td {
            height: 20px; /* Minimum height for rows */
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        
        /* Signature Section specific overrides within main table */
        .sig-header {
            background-color: #ffffff !important;
            font-weight: bold;
            text-align: center;
        }
        .sig-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin: 0;
        }
        .sig-table th, .sig-table td {
            border: 1px solid #000;
            padding: 4px 2px;
            font-size: 9pt;
            vertical-align: middle;
            overflow: hidden;
        }
        .sig-table th.sig-header {
            background-color: #ffffff !important;
            font-weight: bold;
            text-align: center;
        }
        .sig-cell {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: clip;
            text-align: center;
        }
        
        /* Additional classes for inline styles */
        .info-table .entity-label { width: 80px; }
        .info-table .spacer { width: 50px; }
        .info-table .fund-label { width: 80px; }
        .division-cell { border-right: 1px solid #000; }
        .stock-no { width: 10%; }
        .unit { width: 8%; }
        .description { width: 32%; }
        .quantity { width: 8%; }
        .yes { width: 5%; }
        .no { width: 5%; }
        .issue-quantity { width: 10%; }
        .remarks { width: 22%; }
        .purpose-cell { text-align: left; padding: 5px; height: 50px; vertical-align: top; }
        .sig-empty { border: 1px solid #000; background-color: #fff; }
        
        @media print {
            body { margin: 0; padding: 0; }
            .ris-container { width: 100%; max-width: none; }
            /* Ensure background colors print */
            .main-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="ris-container">
        <div className="header-title">Appendix 63</div>

        <div className="main-title">REQUISITION AND ISSUE SLIP</div>

        {/* Top Info Table */}
        <table className="info-table">
          <tbody>
            <tr>
              <td className="entity-label">Entity Name :</td>
              <td className="field">{data.entity_name}</td>
              <td className="spacer"></td>
              <td className="fund-label">Fund Cluster :</td>
              <td className="field">{data.fund_cluster}</td>
            </tr>
          </tbody>
        </table>

        {/* Main Content Table */}
        <table className="main-table">
          <thead>
            {/* Meta Headers */}
            <tr>
              <td colSpan={4} className="text-left division-cell">
                Division : {data.division}
              </td>
              <td colSpan={4} className="text-left">
                Responsibility Center Code : {data.responsibility_center_code}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="text-left division-cell">
                Office : {data.office}
              </td>
              <td colSpan={4} className="text-left">
                RIS No. : {data.ris_no}
              </td>
            </tr>

            {/* Column Headers */}
            <tr>
              <th colSpan={4} className="section-header">Requisition</th>
              <th colSpan={2}>Stock Available?</th>
              <th colSpan={2} className="section-header">Issue</th>
            </tr>
            <tr>
              <th className="stock-no">Stock No.</th>
              <th className="unit">Unit</th>
              <th className="description">Description</th>
              <th className="quantity">Quantity</th>
              <th className="yes">Yes</th>
              <th className="no">No</th>
              <th className="issue-quantity">Quantity</th>
              <th className="remarks">Remarks</th>
            </tr>
          </thead>
          
          <tbody>
            {/* Item Rows */}
            {items.map((item, index) => (
              <tr key={index}>
                <td className="text-center">{item.stock_no}</td>
                <td className="text-center">{item.unit}</td>
                <td>{item.description}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-center">
                  {item.stock_available === true ? <span>&#10004;</span> : ''}
                </td>
                <td className="text-center">
                  {item.stock_available === false ? <span>&#10004;</span> : ''}
                </td>
                <td className="text-center">{item.issue_quantity}</td>
                <td>{item.remarks}</td>
              </tr>
            ))}

            {/* Empty Padding Rows */}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}

            {/* Purpose Row */}
            <tr>
              <td colSpan={8} className="purpose-cell">
                Purpose: {data.purpose}
              </td>
            </tr>

            {/* Signatories Section */}
            <tr>
              <td colSpan={8} style={{ padding: 0, border: 'none' }}>
                <table className="sig-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '22%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ borderLeft: 'none', borderTop: 'none' }}></th>
                      <th className="sig-header" style={{ borderTop: 'none' }}>Requested by:</th>
                      <th className="sig-header" style={{ borderTop: 'none' }}>Approved by:</th>
                      <th className="sig-header" style={{ borderTop: 'none' }}>Issued by:</th>
                      <th className="sig-header" style={{ borderRight: 'none', borderTop: 'none' }}>Received by:</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Signatures */}
                    <tr>
                      <td style={{ borderLeft: 'none' }}>Signature :</td>
                      <td className="text-center">{data.requested_by_signature}</td>
                      <td className="text-center">{data.approved_by_signature}</td>
                      <td className="text-center">{data.issued_by_signature}</td>
                      <td className="text-center" style={{ borderRight: 'none' }}>{data.received_by_signature}</td>
                    </tr>

                    {/* Printed Names */}
                    <tr>
                      <td style={{ borderLeft: 'none' }}>Printed Name :</td>
                      <td className="sig-cell">
                        <span className="font-bold" style={getDynamicNameStyle(data.requested_by_name)}>
                          {data.requested_by_name}
                        </span>
                      </td>
                      <td className="sig-cell">
                        <span className="font-bold" style={getDynamicNameStyle(data.approved_by_name || 'ARSENIO GEM A. GARCILLANOSA')}>
                          {data.approved_by_name || 'ARSENIO GEM A. GARCILLANOSA'}
                        </span>
                      </td>
                      <td className="sig-cell">
                        <span className="font-bold" style={getDynamicNameStyle(data.issued_by_name)}>
                          {data.issued_by_name}
                        </span>
                      </td>
                      <td className="sig-cell" style={{ borderRight: 'none' }}>
                        <span className="font-bold" style={getDynamicNameStyle(data.received_by_name)}>
                          {data.received_by_name}
                        </span>
                      </td>
                    </tr>

                    {/* Designations */}
                    <tr>
                      <td style={{ borderLeft: 'none' }}>Designation :</td>
                      <td className="sig-cell">
                        <span style={getDynamicDesignationStyle(data.requested_by_designation)}>
                          {data.requested_by_designation}
                        </span>
                      </td>
                      <td className="sig-cell">
                        <span style={getDynamicDesignationStyle(data.approved_by_designation || 'SUPPLY OFFICER III/ADMIN OFFICER V')}>
                          {data.approved_by_designation || 'SUPPLY OFFICER III/ADMIN OFFICER V'}
                        </span>
                      </td>
                      <td className="sig-cell">
                        <span style={getDynamicDesignationStyle(data.issued_by_designation)}>
                          {data.issued_by_designation}
                        </span>
                      </td>
                      <td className="sig-cell" style={{ borderRight: 'none' }}>
                        <span style={getDynamicDesignationStyle(data.received_by_designation)}>
                          {data.received_by_designation}
                        </span>
                      </td>
                    </tr>

                    {/* Dates */}
                    <tr>
                      <td style={{ borderLeft: 'none', borderBottom: 'none' }}>Date :</td>
                      <td className="text-center" style={{ borderBottom: 'none' }}>{formatDate(data.requested_by_date)}</td>
                      <td className="text-center" style={{ borderBottom: 'none' }}>{formatDate(data.approved_by_date)}</td>
                      <td className="text-center" style={{ borderBottom: 'none' }}>{formatDate(data.issued_by_date)}</td>
                      <td className="text-center" style={{ borderRight: 'none', borderBottom: 'none' }}>{formatDate(data.received_by_date)}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default RequisitionIssueSlip;