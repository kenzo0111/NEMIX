<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>@yield('title', 'Official Compliance Report')</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm;
        }

        body {
            font-family: 'DejaVu Serif', 'Times New Roman', Times, serif;
            font-size: 8.5pt;
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

        /* Official-form geometry belongs to each form, not this document shell. */
    </style>
    @yield('styles')
</head>
<body>
    @yield('content')
</body>
</html>
