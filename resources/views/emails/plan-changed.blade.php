<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; margin: 0; padding: 40px 20px; }
  .container { max-width: 560px; margin: 0 auto; background: #111; border-radius: 12px; overflow: hidden; border: 1px solid #222; }
  .header { padding: 28px 32px; border-bottom: 1px solid #1e1e1e; }
  .header img { height: 22px; }
  .content { padding: 32px; line-height: 1.7; color: #ccc; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .badge-pro      { background: #2d2400; color: #f59e0b; border: 1px solid #f59e0b44; }
  .badge-business { background: #001e2d; color: #38bdf8; border: 1px solid #38bdf844; }
  .badge-free     { background: #1a1a1a; color: #888; border: 1px solid #333; }
  .cta { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #00ff88; color: #000; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; }
  .footer { padding: 20px 32px; border-top: 1px solid #1e1e1e; font-size: 12px; color: #555; text-align: center; }
  a { color: #00ff88; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{ asset('images/ensub-logo.png') }}" alt="ENSub">
    </div>
    <div class="content">
      <p>Hi <strong>{{ $tenant->name }}</strong>,</p>

      @if ($newPlan === 'free')
        <p>Your ENSub subscription has been cancelled and your project has been moved to the <span class="badge badge-free">Free</span> plan.</p>
        <p>Your existing subdomains remain active, but you're now limited to <strong>50 subdomains</strong> and offchain resolution only.</p>
        <p>You can reactivate at any time from your <a href="https://ensub.org/manage/{{ $tenant->slug }}">project dashboard</a>.</p>
      @elseif ($newPlan === 'pro')
        <p>Your project <strong>{{ $tenant->ens_domain }}</strong> has been upgraded to <span class="badge badge-pro">Pro</span>!</p>
        <p>You now have access to:</p>
        <ul>
          <li>Up to <strong>500 subdomains</strong></li>
          <li>On-chain ENS resolver (L1)</li>
          <li>Durin L2 chains (up to 3)</li>
        </ul>
        <a href="https://ensub.org/manage/{{ $tenant->slug }}" class="cta">Go to dashboard →</a>
      @elseif ($newPlan === 'business')
        <p>Your project <strong>{{ $tenant->ens_domain }}</strong> has been upgraded to <span class="badge badge-business">Business</span>!</p>
        <p>You now have access to:</p>
        <ul>
          <li>Up to <strong>10,000 subdomains</strong></li>
          <li>On-chain ENS resolver (L1)</li>
          <li>Unlimited Durin L2 chains</li>
          <li>Priority support</li>
        </ul>
        <a href="https://ensub.org/manage/{{ $tenant->slug }}" class="cta">Go to dashboard →</a>
      @endif
    </div>
    <div class="footer">
      ENSub · <a href="https://ensub.org">ensub.org</a>
      &nbsp;·&nbsp; <a href="https://ensub.org/manage/{{ $tenant->slug }}">Manage project</a>
    </div>
  </div>
</body>
</html>
