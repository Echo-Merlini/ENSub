<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('type')->unique();   // machine key, never changes
            $table->string('label');             // human label in admin
            $table->string('trigger');           // when this fires (info only)
            $table->string('subject');
            $table->longText('body');            // full HTML, supports {placeholder} vars
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        $style = '
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0a0a0a;color:#e0e0e0;margin:0;padding:40px 20px}
  .wrap{max-width:560px;margin:0 auto;background:#111;border-radius:12px;overflow:hidden;border:1px solid #222}
  .hdr{padding:24px 32px;border-bottom:1px solid #1e1e1e}
  .hdr img{height:22px}
  .body{padding:32px;line-height:1.7;color:#ccc}
  .body h2{color:#fff;margin-top:0}
  .body ul{padding-left:20px}
  .cta{display:inline-block;margin-top:20px;padding:12px 24px;background:#00ff88;color:#000;border-radius:8px;font-weight:600;text-decoration:none;font-size:14px}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:600}
  .badge-pro{background:#2d2400;color:#f59e0b;border:1px solid #f59e0b44}
  .badge-biz{background:#001e2d;color:#38bdf8;border:1px solid #38bdf844}
  .badge-free{background:#1a1a1a;color:#888;border:1px solid #333}
  .ftr{padding:18px 32px;border-top:1px solid #1e1e1e;font-size:12px;color:#555;text-align:center}
  a{color:#00ff88;text-decoration:none}
</style>';

        $header = '<div class="hdr"><img src="https://ensub.org/images/ensub-logo.png" alt="ENSub"></div>';
        $footer = '<div class="ftr">ENSub &nbsp;·&nbsp; <a href="https://ensub.org">ensub.org</a> &nbsp;·&nbsp; <a href="{dashboard_url}">Manage project</a></div>';

        $wrap = fn (string $inner) => "<!DOCTYPE html><html><head><meta charset=\"utf-8\">{$style}</head><body><div class=\"wrap\">{$header}<div class=\"body\">{$inner}</div>{$footer}</div></body></html>";

        $now = now();

        DB::table('email_templates')->insert([
            [
                'type'    => 'plan_upgraded_pro',
                'label'   => 'Plan Upgraded — Pro',
                'trigger' => 'Stripe webhook: subscription activated (pro)',
                'subject' => 'Welcome to ENSub Pro! 🎉',
                'body'    => $wrap('
<h2>You\'re on Pro now!</h2>
<p>Hi <strong>{tenant_name}</strong>, your project <strong>{tenant_domain}</strong> has been upgraded to <span class="badge badge-pro">Pro</span>.</p>
<p>You now have access to:</p>
<ul>
  <li>Up to <strong>{claim_limit} subdomains</strong></li>
  <li>On-chain ENS resolver (L1)</li>
  <li>Durin L2 chains (up to 3)</li>
</ul>
<a href="{dashboard_url}" class="cta">Go to dashboard →</a>'),
                'active'     => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type'    => 'plan_upgraded_business',
                'label'   => 'Plan Upgraded — Business',
                'trigger' => 'Stripe webhook: subscription activated (business)',
                'subject' => 'Welcome to ENSub Business! 🚀',
                'body'    => $wrap('
<h2>You\'re on Business now!</h2>
<p>Hi <strong>{tenant_name}</strong>, your project <strong>{tenant_domain}</strong> has been upgraded to <span class="badge badge-biz">Business</span>.</p>
<p>You now have access to:</p>
<ul>
  <li>Up to <strong>{claim_limit} subdomains</strong></li>
  <li>On-chain ENS resolver (L1)</li>
  <li>Unlimited Durin L2 chains</li>
  <li>Priority support</li>
</ul>
<a href="{dashboard_url}" class="cta">Go to dashboard →</a>'),
                'active'     => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type'    => 'plan_cancelled',
                'label'   => 'Plan Cancelled',
                'trigger' => 'Stripe webhook: subscription deleted',
                'subject' => 'Your ENSub subscription has been cancelled',
                'body'    => $wrap('
<h2>Subscription cancelled</h2>
<p>Hi <strong>{tenant_name}</strong>, your ENSub subscription has been cancelled and your project has been moved to the <span class="badge badge-free">Free</span> plan.</p>
<p>Your existing subdomains remain active, but you\'re now limited to <strong>50 subdomains</strong> and offchain resolution only.</p>
<p>You can reactivate at any time from your project dashboard.</p>
<a href="{dashboard_url}" class="cta">Reactivate →</a>'),
                'active'     => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type'    => 'admin_manual',
                'label'   => 'Admin Manual Email',
                'trigger' => 'Manual — sent from the Tenants admin panel',
                'subject' => 'Message from ENSub',
                'body'    => $wrap('
<p>Hi <strong>{tenant_name}</strong>,</p>
{body}'),
                'active'     => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
