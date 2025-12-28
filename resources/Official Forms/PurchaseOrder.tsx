import React from 'react';

// --- Types ---

interface POItem {
  stock_number?: string;
  unit?: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  amount: number;
}

interface PurchaseOrderProps {
  po_number?: string;
  entity_name?: string;
  entity_address?: string;
  supplier?: string;
  supplier_address?: string;
  date_of_purchase?: string; // ISO string or Date string
  tin_number?: string;
  mode_of_procurement?: string;
  mode_of_payment?: string;
  place_of_delivery?: string;
  delivery_term?: string;
  date_of_delivery?: string;
  payment_term?: string;
  items?: POItem[];
  grand_total?: number;
  fund_cluster?: string;
  ors_burs_no?: string;
  funds_available?: string;
  ors_burs_date?: string;
  ors_burs_amount?: string | number;
  accountant_signature?: string;
}

// --- Helpers ---

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatNumber = (num?: number) => {
  return (num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// --- Component ---

export const PurchaseOrder: React.FC<PurchaseOrderProps> = (props) => {
  const {
    po_number = 'PO',
    entity_name = 'Camarines Norte State College',
    entity_address = 'lot 8, F. Pimentel',
    supplier = '',
    supplier_address = '',
    date_of_purchase,
    tin_number = '',
    mode_of_procurement,
    mode_of_payment,
    place_of_delivery = '',
    delivery_term = '',
    date_of_delivery,
    payment_term = '',
    items = [],
    grand_total = 0,
    fund_cluster = '',
    ors_burs_no = '',
    funds_available = '',
    ors_burs_date,
    ors_burs_amount = '',
    accountant_signature = '',
  } = props;

  const procurementMode = mode_of_procurement || mode_of_payment || '';

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 16mm 14mm 18mm 14mm; }
        .po-container { 
            font-family: 'Times New Roman', Times, serif; 
            font-size: 10px; 
            background: #fff; 
            color: #000;
            width: 100%;
            max-width: 210mm; /* A4 width constraint for screen view */
            margin: 0 auto;
        }
        .po-doc { background: #fff; padding: 14px 16px; box-sizing: border-box; position: relative; }
        .annex-label { position: absolute; top: 8px; right: 12px; font-size: 12px; font-weight: 700; color: #000; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        td { vertical-align: top; padding: 4px; }
        
        /* Utility Classes recreated from HTML */
        .table-cell-border { border-right: 1px solid #000; border-top: 1px solid #000; }
        .table-cell-border-right { border-right: 1px solid #000; }
        .table-cell-border-top { border-top: 1px solid #000; }
        .table-border-2 { border: 2px solid #000; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        
        /* Inline style replacements */
        .center-margin-bottom { text-align: center; margin-bottom: 16px; }
        .h1-po { font-size: 14px; font-weight: 700; margin: 0 0 6px; }
        .p-underline { font-size: 12px; text-decoration: underline; margin: 0 0 3px; }
        .p-italic-gray { font-size: 10px; font-style: italic; margin: 0; color: #444; }
        .width-15 { width: 15%; }
        .width-45 { width: 45%; }
        .width-25 { width: 25%; }
        .padding-12 { padding: 12px; }
        .font-size-12 { font-size: 12px; }
        .width-13 { width: 13%; }
        .width-8 { width: 8%; }
        .width-39 { width: 39%; }
        .width-10 { width: 10%; }
        .signature-cell { height: 160px; vertical-align: top; padding: 16px; }
        .p-italic-small-margin { margin-bottom: 8px; font-style: italic; font-size: 10px; }
        .signature-line { width: 192px; margin: 0 auto 8px; height: 48px; border-bottom: 2px solid #000; }
        .p-italic-small { font-size: 10px; font-style: italic; }
        .flex-center { margin-top: 12px; display: flex; align-items: center; justify-content: center; }
        .span-small-margin { font-size: 10px; margin-right: 8px; }
        .date-line { border-bottom: 1px solid black; display: inline-block; width: 80px; padding-bottom: 2px; }
        .center-margin-top { text-align: center; margin-top: 48px; }
        .width-35 { width: 35%; }
        .accountant-cell { padding: 16px; height: 80px; vertical-align: bottom; }
        .accountant-signature { height: 48px; border-bottom: 2px solid #000; margin: 0 auto 4px; width: 192px; display: flex; align-items: flex-end; justify-content: center; font-size: 10px; }
        .p-bold-small-margin { font-size: 10px; font-weight: 700; margin: 4px 0 0; }
        
        @media print { 
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
            .po-container { max-width: none; width: 100%; }
        }
      `}</style>

      <div className="po-container">
        <div className="po-doc">
          <div className="center-margin-bottom">
            <div className="annex-label">Appendix 6.1</div>
            <h1 className="h1-po">PURCHASE ORDER</h1>
            <p className="p-underline">
              {entity_name}
            </p>
            <p className="p-italic-gray">
              {entity_address}
            </p>
          </div>

          <div className="table-border-2">
            <table>
              <tbody>
                <tr>
                  <td className="table-cell-border-right font-semibold width-15">
                    Supplier:
                  </td>
                  <td colSpan={3} className="table-cell-border-right width-45">
                    {supplier}
                  </td>
                  <td className="table-cell-border-right font-semibold width-15">
                    P.O. No.:
                  </td>
                  <td className="width-25">{po_number}</td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">Address:</td>
                  <td colSpan={3} className="table-cell-border-right table-cell-border-top">
                    {supplier_address}
                  </td>
                  <td className="table-cell-border-right table-cell-border-top font-semibold">
                    Date:
                  </td>
                  <td className="table-cell-border-top">{formatDate(date_of_purchase)}</td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">TIN:</td>
                  <td colSpan={3} className="table-cell-border-right table-cell-border-top">
                    {tin_number}
                  </td>
                  <td className="table-cell-border-right table-cell-border-top font-semibold">
                    Mode of Procurement:
                  </td>
                  <td className="table-cell-border-top">{procurementMode}</td>
                </tr>

                <tr>
                  <td colSpan={6} className="table-cell-border-top padding-12">
                    <strong className="font-size-12">Gentlemen:</strong>
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Please furnish this Office the following articles
                    subject to the terms and conditions contained herein:
                  </td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">Place of Delivery:</td>
                  <td colSpan={2} className="table-cell-border-right table-cell-border-top">
                    {place_of_delivery}
                  </td>
                  <td className="table-cell-border-right table-cell-border-top font-semibold">
                    Delivery Term:
                  </td>
                  <td colSpan={2} className="table-cell-border-top">
                    {delivery_term}
                  </td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">Date of Delivery:</td>
                  <td colSpan={2} className="table-cell-border-right table-cell-border-top">
                    {formatDate(date_of_delivery)}
                  </td>
                  <td className="table-cell-border-right table-cell-border-top font-semibold">
                    Payment Term:
                  </td>
                  <td colSpan={2} className="table-cell-border-top">
                    {payment_term}
                  </td>
                </tr>

                {/* Headers */}
                <tr>
                  <td className="table-cell-border text-center font-semibold width-13">
                    Stock/Property Number
                  </td>
                  <td className="table-cell-border text-center font-semibold width-8">
                    Unit
                  </td>
                  <td className="table-cell-border text-center font-semibold width-39">
                    Description
                  </td>
                  <td className="table-cell-border text-center font-semibold width-10">
                    Quantity
                  </td>
                  <td className="table-cell-border text-center font-semibold width-15">
                    Unit Cost
                  </td>
                  <td className="table-cell-border-top text-center font-semibold width-15">
                    Amount
                  </td>
                </tr>

                {/* Loop Items */}
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <tr key={index}>
                      <td className="table-cell-border">{item.stock_number}</td>
                      <td className="table-cell-border">{item.unit}</td>
                      <td className="table-cell-border">{item.description}</td>
                      <td className="table-cell-border text-center">
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="table-cell-border text-right">
                        {formatNumber(item.unit_cost)}
                      </td>
                      <td className="table-cell-border text-right">
                        {formatNumber(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="table-cell-border text-center">
                      No items
                    </td>
                  </tr>
                )}

                {/* Grand Total */}
                <tr>
                  <td colSpan={5} className="table-cell-border text-right font-semibold">
                    Grand Total:
                  </td>
                  <td className="table-cell-border-top text-right font-bold">
                    {formatNumber(grand_total)}
                  </td>
                </tr>

                {/* Footer Signatures */}
                <tr>
                  <td
                    colSpan={3}
                    className="table-cell-border text-center signature-cell"
                  >
                    <p className="p-italic-small-margin">
                      In case of failure to make the total delivery within the time specified above, a
                      penalty of one percent (1%) of the total contract price shall be imposed for
                      each day of delay, until the obligation is fully complied with.
                    </p>
                    <p className="p-italic-small-margin">
                      Conforme:
                    </p>
                    <div className="signature-line"></div>
                    <p className="p-italic-small">
                      signature over printed name of supplier
                    </p>
                    <div className="flex-center">
                      <span className="span-small-margin">Date:</span>
                      <span className="date-line"></span>
                    </div>
                  </td>
                  <td
                    colSpan={3}
                    className="table-cell-border-top text-center signature-cell"
                  >
                    <div className="center-margin-top">
                      <p className="p-italic-small-margin">
                        Very truly yours,
                      </p>
                      <div className="signature-line"></div>
                      <p className="p-italic-small">
                        signature over printed name of authorization
                      </p>
                      <p className="p-italic-small">College President</p>
                    </div>
                  </td>
                </tr>

                {/* Accounting Section */}
                <tr>
                  <td className="table-cell-border font-semibold width-15">
                    Fund Cluster:
                  </td>
                  <td
                    className="table-cell-border-right table-cell-border-top width-35"
                  >
                    {fund_cluster}
                  </td>
                  <td className="table-cell-border font-semibold width-15">
                    ORS/BURS No.:
                  </td>
                  <td colSpan={3} className="table-cell-border-top">
                    {ors_burs_no}
                  </td>
                </tr>

                <tr>
                  <td className="table-cell-border font-semibold">Funds Available:</td>
                  <td className="table-cell-border-right table-cell-border-top">
                    {funds_available}
                  </td>
                  <td className="table-cell-border font-semibold text-left">Date of ORS/BURS:</td>
                  <td className="table-cell-border">{formatDate(ors_burs_date)}</td>
                  <td className="table-cell-border font-semibold text-center">Amount:</td>
                  <td className="table-cell-border-top">{ors_burs_amount}</td>
                </tr>

                <tr>
                  <td
                    colSpan={6}
                    className="table-cell-border-top text-center accountant-cell"
                  >
                    <div className="accountant-signature">
                      {accountant_signature}
                    </div>
                    <p className="p-bold-small-margin">
                      Accountant's Signature
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchaseOrder;