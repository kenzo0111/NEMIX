import React from 'react';

export interface RSMIItem {
  id?: string;
  risNo: string;
  responsibilityCenterCode: string;
  stockNo: string;
  itemDescription: string;
  unit: string;
  quantityIssued: number | null;
  unitCost: number | null;
  amount: number | null;
}

export interface RSMIRecapitulation {
  stockNo: string;
  quantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
  uacsObjectCode: string;
}

export interface RSMIForm {
  entityName: string;
  serialNo: string;
  fundCluster: string;
  date: string;
  issuedItems: RSMIItem[];
  recapitulationItems: RSMIRecapitulation[];
  supplyCustodianName: string;
  accountingStaffName: string;
  accountingDate: string;
}

interface Props {
  data: RSMIForm;
}

export default function RSMIFormPaper({ data }: Props) {
  // COA forms usually have around 25-30 rows for the main section
  const totalRows = 25;
  const items = [...data.issuedItems];
  const recaps = [...data.recapitulationItems];

  return (
    <div className="mx-auto p-8 bg-white text-black mb-10 w-full max-w-[8.5in]" style={{ minHeight: '11in', fontFamily: '"Times New Roman", Times, serif' }}>
      {/* Header */}
      <div className="text-right italic text-base mb-4">Appendix 64</div>
      <h1 className="text-center font-bold text-base mb-8 uppercase tracking-wide">Report of Supplies and Materials Issued</h1>

      {/* Metadata Section */}
      <div className="grid grid-cols-2 gap-8 mb-4 text-sm font-bold">
        <div className="space-y-4">
          <div className="flex items-end">
            <span className="pr-2">Entity Name :</span>
            <span className="flex-1 border-b border-black pb-0.5 px-2 font-normal leading-none min-h-[1.2rem]">{data.entityName}</span>
          </div>
          <div className="flex items-end">
            <span className="pr-2">Fund Cluster :</span>
            <span className="flex-1 border-b border-black pb-0.5 px-2 font-normal leading-none min-h-[1.2rem]">{data.fundCluster}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-end">
            <span className="pr-2 w-20">Serial No. :</span>
            <span className="flex-1 border-b border-black pb-0.5 px-2 font-normal leading-none min-h-[1.2rem]">{data.serialNo}</span>
          </div>
          <div className="flex items-end">
            <span className="pr-2 w-20">Date :</span>
            <span className="flex-1 border-b border-black pb-0.5 px-2 font-normal leading-none min-h-[1.2rem]">{data.date}</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="border-2 border-black">
        <table className="w-full border-collapse text-[11px] table-fixed">
          <thead>
            <tr className="border-b-2 border-black">
              <th colSpan={6} className="border-r-2 border-black font-normal italic py-1.5">To be filled up by the Supply and/or Property Division/Unit</th>
              <th colSpan={2} className="font-normal italic py-1.5">To be filled up by the Accounting Division/Unit</th>
            </tr>
            <tr className="border-b-2 border-black text-center align-middle">
              <th className="border-r border-black w-[9%] py-3 font-bold">RIS No.</th>
              <th className="border-r border-black w-[13%] leading-tight px-1 font-bold">Responsibility<br/>Center Code</th>
              <th className="border-r border-black w-[11%] font-bold">Stock No.</th>
              <th className="border-r border-black w-[20%] font-bold">Item</th>
              <th className="border-r border-black w-[7%] font-bold">Unit</th>
              <th className="border-r-2 border-black w-[10%] leading-tight px-1 font-bold">Quantity<br/>Issued</th>
              <th className="border-r border-black w-[15%] font-bold">Unit Cost</th>
              <th className="font-bold w-[15%]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Empty Main Rows or Filled Rows */}
            {[...Array(25)].map((_, i) => {
              const item = items[i];
              return (
                <tr key={i} className="h-6 border-b border-black last:border-b-2">
                  <td className="border-r border-black px-1 break-words">{item?.risNo || '\u00A0'}</td>
                  <td className="border-r border-black px-1 text-center break-words">{item?.responsibilityCenterCode || '\u00A0'}</td>
                  <td className="border-r border-black px-1 break-words">{item?.stockNo || '\u00A0'}</td>
                  <td className="border-r border-black px-1 break-words">{item?.itemDescription || '\u00A0'}</td>
                  <td className="border-r border-black px-1 text-center break-words">{item?.unit || '\u00A0'}</td>
                  <td className="border-r-2 border-black px-1 text-right break-words">{item?.quantityIssued || '\u00A0'}</td>
                  <td className="border-r border-black px-1 text-right break-words">{item?.unitCost || '\u00A0'}</td>
                  <td className="px-1 text-right break-words">{item?.amount || '\u00A0'}</td>
                </tr>
              );
            })}

            {/* Recapitulation Headers */}
            <tr className="border-b border-black font-bold text-center bg-white h-7">
              <td colSpan={2} className="border-r-2 border-black border-b-2">Recapitulation:</td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td colSpan={3} className="border-l-2 border-b-2 border-black">Recapitulation:</td>
            </tr>
            <tr className="border-b-2 border-black font-bold text-center h-8 bg-white">
              <td className="border-r border-black">Stock No.</td>
              <td className="border-r-2 border-black">Quantity</td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-l-2 border-black">Unit Cost</td>
              <td className="border-r border-black leading-tight">Total Cost</td>
              <td className="leading-tight">UACS Object Code</td>
            </tr>

            {/* Recapitulation Content Rows */}
            {[...Array(6)].map((_, i) => {
              const recap = recaps[i];
              return (
                <tr key={`recap-${i}`} className="h-7 border-b border-black last:border-b-0">
                  <td className="border-r border-black px-1 break-words">{recap?.stockNo || '\u00A0'}</td>
                  <td className="border-r-2 border-black px-1 text-center break-words">{recap?.quantity || '\u00A0'}</td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-l-2 border-black px-1 text-right break-words">{recap?.unitCost || '\u00A0'}</td>
                  <td className="border-r border-black px-1 text-right break-words">{recap?.totalCost || '\u00A0'}</td>
                  <td className="px-1 text-center break-words">{recap?.uacsObjectCode || '\u00A0'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer / Signatures */}
        <div className="grid grid-cols-2 border-t-2 border-black text-[12px]">
          <div className="p-4 border-r-2 border-black flex flex-col pt-6 pb-2">
            <p className="mb-10 ml-4 font-normal">I hereby certify to the correctness of the above information.</p>
            <div className="text-center px-8 mt-auto">
              <div className="border-b border-black font-bold min-h-[1.5rem] uppercase">
                {data.supplyCustodianName}
              </div>
              <p className="mt-1 font-normal">Signature over Printed Name of Supply and/or<br/>Property Custodian</p>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="px-2 pt-2 text-sm">Posted by:</div>
            <div className="flex-1 px-4 pb-2 flex gap-4 mt-12 items-end">
              <div className="flex-1 text-center">
                <div className="border-b border-black font-bold uppercase min-h-[1.5rem]">
                  {data.accountingStaffName}
                </div>
                <p className="mt-1 font-normal">Signature over Printed Name of<br/>Designated Accounting Staff</p>
              </div>
              <div className="w-28 text-center pb-[18px]">
                <div className="border-b border-black font-bold min-h-[1.5rem]">
                  {data.accountingDate}
                </div>
                <p className="mt-1 font-normal">Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}