package de.deutschcoach.app;

import android.webkit.JavascriptInterface;

public class Bridge {
    final MainActivity a;
    public Bridge(MainActivity a) { this.a = a; }
    @JavascriptInterface public void speak(String text, float rate) { a.speak(text, rate); }
    @JavascriptInterface public void stop() { a.stopSpeaking(); }
    @JavascriptInterface public void listen(String id) { a.runOnUiThread(new Task(a, 0, id)); }
    @JavascriptInterface public void openUrl(String url) { a.runOnUiThread(new Task(a, 2, url)); }
    @JavascriptInterface public void share(String text) { a.runOnUiThread(new Task(a, 1, text)); }
    // 7.6: progress hand-over from the old built-in copy (file://) to the live web app (https://)
    @JavascriptInterface public String getHandover() { return a.getSharedPreferences("dc", 0).getString("handover", ""); }
    @JavascriptInterface public void setHandover(String s) { a.getSharedPreferences("dc", 0).edit().putString("handover", s).commit(); }
    @JavascriptInterface public int shell() { return 1; }
}
