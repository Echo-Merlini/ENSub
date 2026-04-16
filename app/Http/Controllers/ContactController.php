<?php

namespace App\Http\Controllers;

use App\Mail\RawHtmlMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:100',
            'email'   => 'required|email|max:255',
            'message' => 'required|string|max:2000',
        ]);

        $name    = e($validated['name']);
        $email   = e($validated['email']);
        $message = nl2br(e($validated['message']));

        $html = "<!DOCTYPE html><html><head><meta charset='utf-8'>
<style>
body{font-family:sans-serif;background:#0a0a0a;color:#ccc;padding:32px}
.wrap{max-width:520px;margin:0 auto;background:#111;border-radius:10px;padding:28px;border:1px solid #222}
h2{color:#fff;margin-top:0}label{color:#888;font-size:12px;text-transform:uppercase}p{margin:4px 0 16px}
</style></head>
<body><div class='wrap'>
<h2>📬 New ENSub contact message</h2>
<label>From</label><p><strong>{$name}</strong> &lt;{$email}&gt;</p>
<label>Message</label><p>{$message}</p>
</div></body></html>";

        Mail::to(config('mail.contact_destination', 'merloproductions@gmail.com'))
            ->send(new RawHtmlMail("ENSub contact: {$name}", $html));

        return response()->json(['success' => true]);
    }
}
