/*
 * Build the password-protected page.
 *
 *   node build.js "<password>"
 *
 * Reads src/app.html (the readable page, never committed), encrypts it with
 * AES-256-GCM under a key derived from the password by PBKDF2-SHA256, and
 * writes PHD-budget-configurator.html: a small unlock shell carrying nothing
 * but the ciphertext. Without the password the published file is noise, which
 * is what lets the repository stay public.
 *
 * Re-run this after every edit to src/app.html, then commit and push.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ITERATIONS = 600000;          // OWASP guidance for PBKDF2-SHA256
const SRC = path.join(__dirname, "src", "app.html");
const OUT = path.join(__dirname, "PHD-budget-configurator.html");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node build.js "<password>"');
  process.exit(1);
}

const plaintext = fs.readFileSync(SRC);
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");

const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
// WebCrypto expects the GCM tag appended to the ciphertext
const payload = Buffer.concat([body, cipher.getAuthTag()]).toString("base64");

const shell = `<meta charset="utf-8">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>PHDc Multi-Country RWD Budget Configurator</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
:root{
  --ground:#F4F6F4;--surface:#FFFFFF;--ink:#15201E;--muted:#657573;
  --line:#DCE3E0;--line-strong:#C3CECB;--teal:#1F6270;--danger:#A03A2E;
  --font-ui:"Segoe UI Variable Text","Segoe UI",-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;
}
@media (prefers-color-scheme:dark){
  :root{--ground:#0D1413;--surface:#151E1D;--ink:#E7EDEB;--muted:#8C9C99;
        --line:#26312F;--line-strong:#35433F;--teal:#5FB0BF;--danger:#E0796A}
}
:root[data-theme="light"]{--ground:#F4F6F4;--surface:#FFFFFF;--ink:#15201E;--muted:#657573;
  --line:#DCE3E0;--line-strong:#C3CECB;--teal:#1F6270;--danger:#A03A2E}
:root[data-theme="dark"]{--ground:#0D1413;--surface:#151E1D;--ink:#E7EDEB;--muted:#8C9C99;
  --line:#26312F;--line-strong:#35433F;--teal:#5FB0BF;--danger:#E0796A}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;
  background:var(--ground);color:var(--ink);font-family:var(--font-ui);font-size:15px;line-height:1.55}
.gate{width:100%;max-width:376px;background:var(--surface);border:1px solid var(--line-strong);
  border-radius:4px;padding:26px 26px 24px;box-shadow:0 1px 2px rgba(21,32,30,.06),0 10px 30px -14px rgba(21,32,30,.3)}
.gate img{width:48px;height:auto;display:block;margin-bottom:18px}
.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);font-weight:600;margin-bottom:6px}
h1{margin:0;font-size:19px;font-weight:600;letter-spacing:-.012em;line-height:1.3}
p.sub{margin:7px 0 0;color:var(--muted);font-size:13px}
form{margin-top:20px;display:flex;flex-direction:column;gap:10px}
label{font-size:12px;color:var(--muted)}
input{width:100%;font:inherit;padding:9px 11px;border:1px solid var(--line-strong);
  border-radius:4px;background:var(--ground);color:var(--ink)}
input:focus-visible{outline:2px solid var(--teal);outline-offset:1px}
button{font:inherit;padding:9px 14px;border:0;border-radius:4px;background:var(--teal);
  color:#fff;font-weight:600;font-size:14px;cursor:pointer}
button:disabled{opacity:.6;cursor:progress}
.msg{font-size:12.5px;color:var(--danger);min-height:1.2em}
.foot{margin-top:18px;padding-top:14px;border-top:1px solid var(--line);font-size:11.5px;color:var(--muted)}
</style>

<div class="gate">
  <img src="${logoDataUri()}" alt="PHDc Population Health Data Center">
  <div class="eyebrow">Confidential</div>
  <h1>Multi-Country Real-World Data Programme</h1>
  <p class="sub">This preliminary budget is password protected. Ask your PHDc contact for the password.</p>
  <form id="f">
    <label for="pw">Password</label>
    <input id="pw" type="password" autocomplete="current-password" autofocus>
    <button type="submit" id="go">Unlock</button>
    <p class="msg" id="msg"></p>
  </form>
  <p class="foot">PHDc Population Health Data Center</p>
</div>

<script>
(function(){
"use strict";
var SALT = "${salt.toString("base64")}";
var IV   = "${iv.toString("base64")}";
var DATA = "${payload}";
var ITER = ${ITERATIONS};

function b64(s){
  var bin = atob(s), out = new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
  return out;
}

var form = document.getElementById("f");
var input = document.getElementById("pw");
var button = document.getElementById("go");
var msg = document.getElementById("msg");

if(!(window.crypto && window.crypto.subtle)){
  msg.textContent = "This browser cannot decrypt the page. Open it over https, or use a current browser.";
  button.disabled = true;
}

form.addEventListener("submit", function(e){
  e.preventDefault();
  unlock(input.value);
});

function unlock(password){
  msg.textContent = "";
  button.disabled = true;
  button.textContent = "Unlocking";

  var enc = new TextEncoder();
  crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"])
    .then(function(base){
      return crypto.subtle.deriveKey(
        { name:"PBKDF2", salt:b64(SALT), iterations:ITER, hash:"SHA-256" },
        base, { name:"AES-GCM", length:256 }, false, ["decrypt"]);
    })
    .then(function(key){
      return crypto.subtle.decrypt({ name:"AES-GCM", iv:b64(IV) }, key, b64(DATA));
    })
    .then(function(plain){
      var html = new TextDecoder().decode(plain);
      document.open();
      document.write(html);
      document.close();
    })
    .catch(function(){
      button.disabled = false;
      button.textContent = "Unlock";
      msg.textContent = "That password does not open this page. Check for a stray space, then try again.";
      input.select();
    });
}
})();
</script>
`;

fs.writeFileSync(OUT, shell, "utf8");

console.log("built " + path.basename(OUT));
console.log("  source     " + plaintext.length.toLocaleString() + " bytes");
console.log("  ciphertext " + payload.length.toLocaleString() + " base64 chars");
console.log("  pbkdf2     " + ITERATIONS.toLocaleString() + " iterations, sha256");

/* The logo is lifted straight out of the source page so the unlock screen
   carries it without a second copy going stale. */
function logoDataUri(){
  var m = /src="(data:image\/png;base64,[^"]+)"/.exec(plaintext.toString("utf8"));
  if(!m) throw new Error("logo data URI not found in " + SRC);
  return m[1];
}
