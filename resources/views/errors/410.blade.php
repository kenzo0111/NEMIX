<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Link expired | SupplySync</title>
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet">
    <style>
        :root { color-scheme: light; --surface:#fff; --text:#1f2937; --muted:#475569; --border:#64748b; --brand:#7f1d1d; }
        html.dark { color-scheme:dark; --surface:#1d2024; --text:#f8fafc; --muted:#cbd5e1; --border:#64748b; --brand:#fca5a5; }
        * { box-sizing:border-box; } body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px 16px; background:#450a0a; color:var(--text); font:16px/1.625 Figtree, 'Segoe UI', sans-serif; }
        main { width:100%; max-width:512px; padding:32px; border-radius:12px; background:var(--surface); }
        .brand { display:flex; align-items:center; gap:12px; color:var(--brand); font-weight:600; } .brand img { width:48px; height:48px; object-fit:contain; }
        h1 { font-size:24px; line-height:1.35; font-weight:600; margin:24px 0 12px; } p { margin:12px 0; color:var(--muted); }
        nav { display:flex; flex-wrap:wrap; gap:12px; margin-top:24px; } a { display:inline-flex; align-items:center; justify-content:center; min-height:40px; padding:8px 14px; border:1px solid var(--border); border-radius:8px; color:var(--brand); font-size:14px; font-weight:600; text-decoration:none; } a:focus-visible { outline:2px solid var(--brand); outline-offset:2px; }
        .primary { background:#7f1d1d; border-color:#7f1d1d; color:white; }
    </style>
    <script>try { const mode = localStorage.getItem('nemix_theme'); if (mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark'); } catch (_) {}</script>
</head>
<body><main>
    <div class="brand"><img src="{{ asset('images/ucnlogo.png') }}" alt="University of Camarines Norte seal"><span>SupplySync<br>Consumable Supply Management</span></div>
    <h1>This link has expired</h1>
    @if (request()->routeIs('register.invitation'))
        <p>This invitation has expired or has already been used. Ask your administrator to resend the invitation email.</p>
    @else
        <p>This password reset link has expired or has already been used. Request a new email to reset your password.</p>
    @endif
    <nav aria-label="Account recovery">
        @unless (request()->routeIs('register.invitation'))<a class="primary" href="{{ route('password.request') }}">Request a new reset email</a>@endunless
        <a href="{{ route('login') }}">Return to sign in</a>
    </nav>
</main></body>
</html>
