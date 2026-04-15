import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInventoryPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Top Right Label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Appendix 66', pageWidth - 25, 10);

    // 2. Main Titles
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('REPORT ON THE PHYSICAL COUNT OF INVENTORIES', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('___________________________________________________', pageWidth / 2, 28, { align: 'center' });
    doc.text('(Type of Inventory Item)', pageWidth / 2, 32, { align: 'center' });

    doc.text('As at ____________________', pageWidth / 2, 40, { align: 'center' });

    // 3. Header Metadata
    doc.text('Fund Cluster : __________________________', 14, 50);
    
    const subHeaderText = "For which ____________________ , ____________________ , ____________________ is accountable.";
    doc.setFontSize(9);
    doc.text(subHeaderText, 14, 58);
    
    // Labels under the lines for the subheader
    doc.setFontSize(7);
    doc.text('(Name of Accountable Officer)', 35, 61);
    doc.text('(Official Designation)', 75, 61);
    doc.text('(Entity Name)', 115, 61);

    // 4. The Inventory Table
    autoTable(doc, {
        startY: 65,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0],
            halign: 'center',
            valign: 'middle',
        },
        headStyles: {
            fillColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        head: [
            [
                { content: 'Article', rowSpan: 2 },
                { content: 'Description', rowSpan: 2 },
                { content: 'Stock Number', rowSpan: 2 },
                { content: 'Unit of Measure', rowSpan: 2 },
                { content: 'Unit Value', rowSpan: 2 },
                { content: 'Balance Per Card', rowSpan: 1 },
                { content: 'On Hand Per Count', rowSpan: 1 },
                { content: 'Shortage/Overage', colSpan: 2 },
                { content: 'Remarks', rowSpan: 2 },
            ],
            [
                { content: '(Quantity)', rowSpan: 1 },
                { content: '(Quantity)', rowSpan: 1 },
                { content: 'Quantity', rowSpan: 1 },
                { content: 'Value', rowSpan: 1 }
            ]
        ],
        body: Array(15).fill(['', '', '', '', '', '', '', '', '', '']), // Placeholder empty rows
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 50 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 },
            7: { cellWidth: 20 },
            8: { cellWidth: 20 },
            9: { cellWidth: 'auto' },
        },
    });

    // 5. Signature Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    const colWidth = (pageWidth - 28) / 3;
    const sigY = finalY + 20;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Column 1
    doc.text('Certified Correct by:', 14, finalY);
    doc.line(14, sigY, 14 + colWidth - 5, sigY);
    doc.setFontSize(7);
    doc.text('Signature over Printed Name of\nInventory Committee Chair and\nMembers', 14 + (colWidth / 2) - 2.5, sigY + 4, { align: 'center' });

    // Column 2
    doc.setFontSize(9);
    doc.text('Approved by:', 14 + colWidth, finalY);
    doc.line(14 + colWidth, sigY, 14 + (colWidth * 2) - 5, sigY);
    doc.setFontSize(7);
    doc.text('Signature over Printed Name of Head of\nAgency/Entity or Authorized Representative', 14 + colWidth + (colWidth / 2) - 2.5, sigY + 4, { align: 'center' });

    // Column 3
    doc.setFontSize(9);
    doc.text('Verified by:', 14 + (colWidth * 2), finalY);
    doc.line(14 + (colWidth * 2), sigY, pageWidth - 14, sigY);
    doc.setFontSize(7);
    doc.text('Signature over Printed Name of COA\nRepresentative', 14 + (colWidth * 2) + (colWidth / 2), sigY + 4, { align: 'center' });

    doc.save('Inventory_Report.pdf');
};

// --- Type Definitions ---
interface InventoryItem {
  id: string;
  article: string;
  description: string;
  stockNumber: string;
  unitOfMeasure: string;
  unitValue: number | string;
  balancePerCardQty: number | string;
  onHandPerCountQty: number | string;
  shortageOverageQty: number | string;
  shortageOverageValue: number | string;
  remarks: string;
}

interface RPCIFormState {
  inventoryType: string;
  asAtDate: string;
  fundCluster: string;
  accountableOfficer: string;
  officialDesignation: string;
  entityName: string;
  assumptionDate: string;
  items: InventoryItem[];
  certifiedCorrectBy: string;
  approvedBy: string;
  verifiedBy: string;
}

// --- Helper for empty row generation ---
const generateEmptyRow = (): InventoryItem => ({
  id: Math.random().toString(36).substr(2, 9),
  article: '',
  description: '',
  stockNumber: '',
  unitOfMeasure: '',
  unitValue: '',
  balancePerCardQty: '',
  onHandPerCountQty: '',
  shortageOverageQty: '',
  shortageOverageValue: '',
  remarks: '',
});

export default function InventoryReportForm({ data, hideButtons }: { data?: Partial<RPCIFormState>, hideButtons?: boolean }) {
  const [formState, setFormState] = useState<RPCIFormState>({
    inventoryType: data?.inventoryType || '',
    asAtDate: data?.asAtDate || '',
    fundCluster: data?.fundCluster || '',
    accountableOfficer: data?.accountableOfficer || '',
    officialDesignation: data?.officialDesignation || '',
    entityName: data?.entityName || '',
    assumptionDate: data?.assumptionDate || '',
    items: data?.items || Array.from({ length: 15 }, generateEmptyRow),
    certifiedCorrectBy: data?.certifiedCorrectBy || '',
    approvedBy: data?.approvedBy || '',
    verifiedBy: data?.verifiedBy || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof InventoryItem, value: string) => {
    const newItems = [...formState.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormState((prev) => ({ ...prev, items: newItems }));
  };

  return (
    <div className="min-h-screen bg-gray-200 py-8 px-4 font-sans text-sm print:bg-white print:p-0">
      <div className="w-[11in] max-w-full mx-auto bg-white shadow-xl min-h-[8.5in] p-8 print:shadow-none print:w-full print:max-w-none print:p-0 relative">
        
        {/* Page Number / Margin Note (optional, like 163 in the image) */}
        <div className="absolute left-[-2rem] top-1/2 -rotate-90 transform origin-left text-xs font-serif hidden print:block">
          163
        </div>

        {/* Header Section */}
        <div className="text-right italic mb-2 font-serif text-base">Appendix 66</div>
        
        <div className="text-center font-bold text-lg mb-4 font-serif">
          REPORT ON THE PHYSICAL COUNT OF INVENTORIES
        </div>

        <div className="flex flex-col items-center mb-6 space-y-4">
          <div className="flex flex-col items-center">
            <div className="border-b border-black text-center w-96 uppercase font-semibold text-sm min-h-[1.5rem]">
              {formState.inventoryType}
            </div>
            <span className="text-xs mt-1 font-serif">(Type of Inventory Item)</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-end font-serif font-bold space-x-2">
              <span>As at</span>
              <div className="border-b border-black w-64 text-center font-normal min-h-[1.5rem]">
                {formState.asAtDate}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 font-serif font-bold flex items-end">
          <span className="whitespace-nowrap mr-2">Fund Cluster :</span>
          <div className="border-b border-black w-64 font-normal px-2 min-h-[1.5rem]">
            {formState.fundCluster}
          </div>
        </div>

        {/* Accountability Paragraph */}
        <div className="mb-6 flex flex-wrap items-end font-serif text-sm leading-8">
          <span className="font-bold mr-2">For which</span>
          <div className="flex flex-col mx-2 items-center mb-[-0.6rem]">
            <div className="border-b border-black w-64 text-center font-bold min-h-[1.5rem]">
              {formState.accountableOfficer}
            </div>
            <span className="text-[10px] font-bold italic leading-tight">(Name of Accountable Officer)</span>
          </div>
          <span className="mr-2 font-bold">,</span>
          <div className="flex flex-col mx-2 items-center mb-[-0.6rem]">
            <div className="border-b border-black w-48 text-center font-bold min-h-[1.5rem]">
              {formState.officialDesignation}
            </div>
            <span className="text-[10px] font-bold italic leading-tight">(Official Designation)</span>
          </div>
          <span className="mr-2 font-bold">,</span>
          <div className="flex flex-col mx-2 items-center mb-[-0.6rem]">
            <div className="border-b border-black w-56 text-center font-bold min-h-[1.5rem]">
              {formState.entityName}
            </div>
            <span className="text-[10px] font-bold italic leading-tight">(Entity Name)</span>
          </div>
          <span className="mx-2 font-bold flex items-end mb-[0.1rem]">is accountable.</span>
        </div>

        {/* Inventory Table */}
        <div className="mb-4">
          <table className="w-full border-collapse border-[1.5px] border-solid border-black text-center text-xs font-serif font-bold">
            <thead>
              <tr>
                <th className="border-[1.5px] border-solid border-black p-1 w-[8%]" rowSpan={2}>Article</th>
                <th className="border-[1.5px] border-solid border-black p-1 w-[20%]" rowSpan={2}>Description</th>
                <th className="border-[1.5px] border-solid border-black p-1 w-[10%]" rowSpan={2}>Stock Number</th>
                <th className="border-[1.5px] border-solid border-black p-1 w-[8%]" rowSpan={2}>Unit of<br/>Measure</th>
                <th className="border-[1.5px] border-solid border-black p-1 w-[8%]" rowSpan={2}>Unit<br/>Value</th>
                <th className="border-[1.5px] border-solid border-black p-0 w-[10%]" rowSpan={2}>
                  <div className="py-1">Balance Per Card</div>
                  <div className="border-t-[1.5px] border-solid border-black py-1 font-normal">(Quantity)</div>
                </th>
                <th className="border-[1.5px] border-solid border-black p-0 w-[10%]" rowSpan={2}>
                  <div className="py-1">On Hand Per<br/>Count</div>
                  <div className="border-t-[1.5px] border-solid border-black py-1 font-normal">(Quantity)</div>
                </th>
                <th className="border-[1.5px] border-solid border-black p-1 w-[14%]" colSpan={2}>Shortage/Overage</th>
                <th className="border-[1.5px] border-solid border-black p-1 w-[12%]" rowSpan={2}>Remarks</th>
              </tr>
              <tr>
                <th className="border-[1.5px] border-solid border-black p-1 font-normal w-[7%]">Quantity</th>
                <th className="border-[1.5px] border-solid border-black p-1 font-normal w-[7%]">Value</th>
              </tr>
            </thead>
            <tbody>
              {formState.items.map((item, index) => (
                <tr key={item.id} className="h-6">
                  <td className="border-[1.5px] border-solid border-black px-1 text-center font-sans font-normal">{item.article}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-left font-sans font-normal">{item.description}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-center font-sans font-normal">{item.stockNumber}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-center font-sans font-normal">{item.unitOfMeasure}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-right font-sans font-normal">{item.unitValue}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-right font-sans font-normal">{item.balancePerCardQty}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-right font-sans font-normal">{item.onHandPerCountQty}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-right font-sans font-normal">{item.shortageOverageQty}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-right font-sans font-normal">{item.shortageOverageValue}</td>
                  <td className="border-[1.5px] border-solid border-black px-1 text-left font-sans font-normal">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div className="flex w-full text-center mt-2 font-serif border-[1.5px] border-solid border-black border-t-0">
          {/* Certified Correct By */}
          <div className="flex-1 p-2 border-r-[1.5px] border-solid border-black pb-8">
            <div className="w-full text-left mb-6 font-bold text-xs">Certified Correct by:</div>
            <div className="flex flex-col items-center mt-8 px-4">
              <div className="border-b border-black w-full text-center font-bold uppercase font-sans text-sm min-h-[1.5rem]">
                {formState.certifiedCorrectBy}
              </div>
              <div className="text-[10px] mt-1">Signature over Printed Name of</div>
              <div className="text-[10px]">Inventory Committee Chair and</div>
              <div className="text-[10px]">Members</div>
            </div>
          </div>

          {/* Approved By */}
          <div className="flex-1 p-2 border-r-[1.5px] border-solid border-black pb-8">
            <div className="w-full text-left mb-6 font-bold text-xs">Approved by:</div>
            <div className="flex flex-col items-center mt-8 px-4">
              <div className="border-b border-black w-full text-center font-bold uppercase font-sans text-sm min-h-[1.5rem]">
                {formState.approvedBy}
              </div>
              <div className="text-[10px] mt-1">Signature over Printed Name of</div>
              <div className="text-[10px]">Head of Agency/Entity or Authorized Representative</div>
            </div>
          </div>

          {/* Verified By */}
          <div className="flex-1 p-2 pb-8">
            <div className="w-full text-left mb-6 font-bold text-xs">Verified by:</div>
            <div className="flex flex-col items-center mt-8 px-4">
              <div className="border-b border-black w-full text-center font-bold uppercase font-sans text-sm min-h-[1.5rem]">
                {formState.verifiedBy}
              </div>
              <div className="text-[10px] mt-1">Signature over Printed Name of</div>
              <div className="text-[10px]">COA Representative</div>
            </div>
          </div>
        </div>

        {/* Print Button (Hidden during actual printing) */}
        {!hideButtons && (
          <div className="mt-12 flex justify-center gap-4 print:hidden">
            <button 
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow"
            >
              Print Form
            </button>
            <button 
              onClick={generateInventoryPDF}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow"
            >
              Generate PDF
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
