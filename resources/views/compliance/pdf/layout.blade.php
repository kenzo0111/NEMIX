<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>@yield('title', 'Official Compliance Report')</title>
    <style>
        /* DOMPDF Compatible Global Print Reset & Typography */
        @page {
            margin: 10mm 10mm 10mm 10mm;
        }

        body {
            font-family: 'DejaVu Sans', 'Times-Roman', serif;
            font-size: 8pt;
            color: #000000;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            line-height: 1.15;
        }

        .report-page {
            width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff;
            page-break-after: always;
        }

        .report-page:last-child {
            page-break-after: avoid;
        }

        /* Typography & Utilities */
        .text-center { text-align: center !important; }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .font-bold { font-weight: bold !important; }
        .font-normal { font-weight: normal !important; }
        .uppercase { text-transform: uppercase !important; }
        .italic { font-style: italic !important; }

        /* Document Header Typography */
        .official-header {
            width: 100%;
            margin-bottom: 6px;
            text-align: center;
        }

        .official-appendix {
            text-align: right;
            font-size: 8.5pt;
            font-style: italic;
            font-weight: bold;
            margin-bottom: 2px;
        }

        .official-title {
            font-size: 11pt;
            font-weight: bold;
            text-align: center;
            margin: 4px 0 8px 0;
            letter-spacing: 0.5px;
        }

        /* Form Fields & Border Lines */
        .form-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 6px;
        }

        .form-label {
            font-weight: bold;
            font-size: 8pt;
            vertical-align: bottom;
            padding: 2px 0 2px 0;
        }

        .form-value {
            border-bottom: 1px solid #000000;
            padding: 0 4px 2px 4px;
            vertical-align: bottom;
            font-size: 8pt;
            line-height: 1.15;
        }

        /* Standard Table Grid */
        table.report-grid {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1.5px solid #000000;
            margin-bottom: 0;
        }

        table.report-grid th,
        table.report-grid td {
            border: 1px solid #000000;
            padding: 3px 4px;
            font-size: 7.5pt;
            vertical-align: middle;
            line-height: 1.15;
            word-wrap: break-word;
            word-break: break-all;
        }

        table.report-grid th {
            font-weight: bold;
            text-align: center;
            background-color: #ffffff;
            padding: 4px 4px;
        }

        /* Prevent table row splits across pages */
        table.report-grid tr {
            page-break-inside: avoid;
        }

        /* Signature Blocks */
        .signatory-box {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 6px;
        }

        .signatory-cell {
            vertical-align: top;
            padding: 4px 6px;
        }

        .signatory-header {
            font-size: 8pt;
            font-weight: bold;
            margin-bottom: 12px;
        }

        .signatory-name {
            font-weight: bold;
            text-align: center;
            font-size: 8pt;
            border-bottom: 1px solid #000000;
            padding-bottom: 2px;
            margin-bottom: 2px;
            text-transform: uppercase;
        }

        .signatory-caption {
            text-align: center;
            font-size: 6.8pt;
            line-height: 1.1;
            padding-top: 2px;
        }
    </style>
    @yield('styles')
</head>
<body>
    @yield('content')
</body>
</html>
