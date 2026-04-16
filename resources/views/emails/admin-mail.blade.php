<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; margin: 0; padding: 40px 20px; }
  .container { max-width: 560px; margin: 0 auto; background: #111; border-radius: 12px; overflow: hidden; border: 1px solid #222; }
  .header { padding: 28px 32px; border-bottom: 1px solid #1e1e1e; display: flex; align-items: center; gap: 10px; }
  .header img { height: 22px; }
  .content { padding: 32px; line-height: 1.7; color: #ccc; }
  .footer { padding: 20px 32px; border-top: 1px solid #1e1e1e; font-size: 12px; color: #555; text-align: center; }
  a { color: #00ff88; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{ asset('images/ensub-logo.png') }}" alt="ENSub">
      <span style="color:#555; font-size:13px">ENS.sub Admin</span>
    </div>
    <div class="content">
      <p>Hi <strong>{{ $tenantName }}</strong>,</p>
      {!! nl2br(e($body)) !!}
    </div>
    <div class="footer">
      ENSub · <a href="https://ensub.org">ensub.org</a>
    </div>
  </div>
</body>
</html>
