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
}
