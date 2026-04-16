<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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
  .ftr{padding:18px 32px;border-top:1px solid #1e1e1e;font-size:12px;color:#555;text-align:center}
  a{color:#00ff88;text-decoration:none}
</style>';

        $header = '<div class="hdr"><img src="https://ensub.org/images/ensub-logo.png" alt="ENSub"></div>';
        $footer = '<div class="ftr">ENSub &nbsp;·&nbsp; <a href="https://ensub.org">ensub.org</a> &nbsp;·&nbsp; You\'re receiving this because you have an ENSub project.</div>';

        $body = "<!DOCTYPE html><html><head><meta charset=\"utf-8\">{$style}</head><body><div class=\"wrap\">{$header}<div class=\"body\">
<h2>📣 What's new on ENSub</h2>
<p>Hi <strong>{tenant_name}</strong>,</p>
<p>Here's what's new:</p>
<p>{body}</p>
<a href=\"https://ensub.org/manage/{tenant_slug}\" class=\"cta\">Go to your dashboard →</a>
</div>{$footer}</div></body></html>";

        DB::table('email_templates')->insert([
            'type'       => 'newsletter',
            'label'      => 'Newsletter / Announcement',
            'trigger'    => 'Manual — sent to all tenants with a notification email set',
            'subject'    => "What's new on ENSub",
            'body'       => $body,
            'active'     => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('email_templates')->where('type', 'newsletter')->delete();
    }
};
