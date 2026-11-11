package de.deutschcoach.app;

import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** 7.6: the app shows the live web app (APP_URL is filled in by build_apk.sh). */
public class Client extends WebViewClient {
    final MainActivity a;
    public Client(MainActivity a) { this.a = a; }
    @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        String u = r.getUrl().toString();
        if (u.startsWith("file:") || u.startsWith("__APP_URL__")) return false;
        a.openUrl(u); return true;          // other websites open in the browser
    }
    @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
        if (r.isForMainFrame()) v.loadUrl("file:///android_asset/www/offline.html");   // first start without internet
    }
}
