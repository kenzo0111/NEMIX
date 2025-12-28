import React from 'react';

// --- Interfaces ---

export interface IarItem {
  stockNo?: string;
  description?: string;
  unit?: string;
  quantity?: number | string;
}

export interface IarData {
  entityName?: string;
  fundCluster?: string;
  
  supplier?: string;
  iarNo?: string;
  poNo?: string;
  poDate?: string;
  iarDate?: string;
  invoiceNo?: string;
  requisitioningOffice?: string;
  responsibilityCenterCode?: string;
  responsibilityDate?: string; // Date next to responsibility center code

  items?: IarItem[];

  // Inspection Details
  dateInspected?: string;
  inspectionStatus?: 'verified' | ''; // 'verified' triggers the check
  inspectionOfficerName?: string;
  inspectionOfficerPosition?: string;

  // Acceptance Details
  dateReceived?: string;
  acceptanceStatus?: 'complete' | 'partial' | '';
  partialQuantity?: string; // Optional text if partial
  acceptanceOfficerName?: string;
  acceptanceOfficerPosition?: string;
}

interface InspectionAcceptanceReportProps {
  data: IarData;
  targetRows?: number; // Default 8 to match the form height
}

// --- Helper Functions ---

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US');
  } catch {
    return dateString;
  }
};

export const InspectionAcceptanceReport: React.FC<InspectionAcceptanceReportProps> = ({ 
  data, 
  targetRows = 8 
}) => {
  const items = data.items || [];
  
  // Calculate empty rows needed to fill the page
  const emptyRowsCount = Math.max(0, targetRows - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <>
      <style>{`
        @page { margin: 18pt; size: A4 portrait; }
        .iar-container {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.25;
            color: #000;
            background: #fff;
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            box-sizing: border-box;
        }

        /* Titles */
        .header-title { text-align: right; font-style: italic; font-size: 12pt; margin-bottom: 6px; }
        .main-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 10px; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; }
        
        /* Info Table */
        .info-table { margin-bottom: 12px; }
        .info-table td { padding: 2px 6px; font-size: 9.5pt; vertical-align: bottom; }
        .info-table .label { width: 14%; font-weight: normal; padding-right: 4px; }
        .info-table .field { border-bottom: 1px solid #000; padding-bottom: 2px; }

        /* Items Table */
        .items-table { margin: 8px 0 6px 0; table-layout: fixed; border: 1px solid #000; }
        .items-table th, .items-table td { border: 1px solid #000; padding: 6px; font-size: 10pt; vertical-align: middle; }
        
        /* Specific header rows within items table */
        .meta-cell { border: none !important; border-right: 1px solid #000 !important; text-align: left; padding: 3px; font-size: 9pt; }
        .meta-cell-last { border: none !important; text-align: left; padding: 3px; font-size: 9pt; }
        .meta-row { border-bottom: 1px solid #000; }

        .items-table th.col-header { background: #f2f2f2; font-weight: bold; text-align: center; }
        
        /* Columns */
        .stock-col { width: 12%; text-align: center; }
        .description-col { width: 52%; text-align: left; padding-left: 6px; vertical-align: top; }
        .unit-col { width: 12%; text-align: center; }
        .quantity-col { width: 12%; text-align: right; }
        
        /* Info table colgroup */
        .info-table col:nth-child(1) { width: 12%; }
        .info-table col:nth-child(2) { width: 52%; }
        .info-table col:nth-child(3) { width: 12%; }
        .info-table col:nth-child(4) { width: 12%; }
        
        /* Description header override */
        .description-header { text-align: center; vertical-align: middle; padding-left: 0; }
        
        .items-table tbody td { height: 26px; }

        /* Footer / Signatures */
        .items-table tfoot th { text-align: center; font-weight: bold; padding: 6px 8px; border: 1px solid #000; background: #fff; }
        .items-table tfoot td { border: 1px solid #000; padding: 10px 12px; vertical-align: top; min-height: 140px; }

        .section-content { display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: 140px; }
        .date-field { margin-bottom: 8px; font-size: 10pt; }
        
        /* Checkboxes */
        .checkbox-group { margin-bottom: 6px; font-size: 10pt; display: flex; align-items: center; }
        .checkbox { 
            display: inline-block; 
            width: 14px; height: 14px; 
            border: 1px solid #000; 
            margin-right: 6px; 
            text-align: center;
            line-height: 12px;
            font-size: 12px;
        }

        /* Signatures */
        .signature-block { margin-top: auto; text-align: center; margin-top: 24px; }
        .signature-line { display: inline-block; width: 80%; border-top: 1px solid #000; padding-top: 6px; font-weight: bold; font-size: 10pt; text-transform: uppercase; }
        .position-line { display: block; width: 80%; margin: 6px auto 0; font-size: 9pt; }

        @media print {
            body { margin: 0; padding: 0; }
            .iar-container { width: 100%; max-width: none; }
            .items-table th.col-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="iar-container">
        <div className="header-title">Appendix 64</div>
        <div className="main-title">INSPECTION AND ACCEPTANCE REPORT</div>

        {/* Info Row (Entity/Fund) */}
        <table className="info-table">
          <colgroup>
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <td className="label">Entity Name :</td>
              <td className="field">{data.entityName}</td>
              <td className="label">Fund Cluster :</td>
              <td className="field">{data.fundCluster}</td>
            </tr>
          </tbody>
        </table>

        {/* Main Items Table with Embedded Metadata Header */}
        <table className="items-table">
          <thead>
            {/* Meta Rows */}
            <tr className="meta-row">
              <td colSpan={2} className="meta-cell">Supplier : {data.supplier}</td>
              <td colSpan={2} className="meta-cell-last">IAR No. : {data.iarNo}</td>
            </tr>
            <tr className="meta-row">
              <td colSpan={2} className="meta-cell">PO No./Date : {data.poNo} {data.poDate ? `/ ${formatDate(data.poDate)}` : ''}</td>
              <td colSpan={2} className="meta-cell-last">Date : {formatDate(data.iarDate)}</td>
            </tr>
            <tr className="meta-row">
              <td colSpan={2} className="meta-cell">Requisitioning Office/Dept : {data.requisitioningOffice}</td>
              <td colSpan={2} className="meta-cell-last">Invoice No : {data.invoiceNo}</td>
            </tr>
            <tr className="meta-row">
              <td colSpan={2} className="meta-cell">Responsibility Center Code : {data.responsibilityCenterCode}</td>
              <td colSpan={2} className="meta-cell-last">Date : {formatDate(data.responsibilityDate)}</td>
            </tr>

            {/* Column Headers */}
            <tr>
              <th className="col-header stock-col">Stock/<br />Property No.</th>
              <th className="col-header description-col description-header">Description</th>
              <th className="col-header unit-col">Unit</th>
              <th className="col-header quantity-col">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="stock-col">{item.stockNo}</td>
                <td className="description-col">{item.description}</td>
                <td className="unit-col">{item.unit}</td>
                <td className="quantity-col">{item.quantity}</td>
              </tr>
            ))}

            {/* Empty Rows */}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="stock-col">&nbsp;</td>
                <td className="description-col">&nbsp;</td>
                <td className="unit-col">&nbsp;</td>
                <td className="quantity-col">&nbsp;</td>
              </tr>
            ))}
          </tbody>

          {/* Footer / Signatories */}
          <tfoot>
            <tr>
              <th colSpan={2}>INSPECTION</th>
              <th colSpan={2}>ACCEPTANCE</th>
            </tr>
            <tr>
              <td colSpan={2}>
                <div className="section-content">
                  <div>
                    <div className="date-field">
                      <strong>Date Inspected :</strong> {formatDate(data.dateInspected)}
                    </div>
                    <div className="checkbox-group">
                      <div className="checkbox">
                        {data.inspectionStatus === 'verified' && <span>&#10003;</span>}
                      </div>
                      <span>Inspected, verified and found in order as to quantity and specifications</span>
                    </div>
                  </div>
                  <div className="signature-block">
                    <div className="signature-line">
                      {data.inspectionOfficerName || 'Inspection Officer'}
                    </div>
                    <div className="position-line">
                      {data.inspectionOfficerPosition || 'Inspection Committee'}
                    </div>
                  </div>
                </div>
              </td>
              <td colSpan={2}>
                <div className="section-content">
                  <div>
                    <div className="date-field">
                      <strong>Date Received :</strong> {formatDate(data.dateReceived)}
                    </div>
                    <div className="checkbox-group">
                      <div className="checkbox">
                        {data.acceptanceStatus === 'complete' && <span>&#10003;</span>}
                      </div>
                      <span>Complete</span>
                    </div>
                    <div className="checkbox-group">
                      <div className="checkbox">
                        {data.acceptanceStatus === 'partial' && <span>&#10003;</span>}
                      </div>
                      <span>Partial {data.acceptanceStatus === 'partial' && `(pls. specify quantity)`}</span>
                    </div>
                  </div>
                  <div className="signature-block">
                    <div className="signature-line">
                      {data.acceptanceOfficerName || 'ARSENIO GEM A. GARCILLANOSA'}
                    </div>
                    <div className="position-line">
                      {data.acceptanceOfficerPosition || 'Supply Officer III'}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
};

export default InspectionAcceptanceReport;