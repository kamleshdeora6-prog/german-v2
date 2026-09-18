package de.deutschcoach.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.util.ArrayList;
import java.util.Locale;
import org.json.JSONObject;

/** Reference source for the smali in ../smali (the APK is assembled from smali). */
public class MainActivity extends Activity implements TextToSpeech.OnInitListener {
    WebView web;
    TextToSpeech tts;
    String pendingId;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(this), "AndroidBridge");
        setContentView(web);
        web.loadUrl("file:///android_asset/www/index.html");
        tts = new TextToSpeech(this, this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) tts.setLanguage(Locale.GERMANY);
    }

    void speak(String text, float rate) {
        tts.setSpeechRate(rate);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "dc");
    }

    void stopSpeaking() { tts.stop(); }

    void startListen(String id) {
        pendingId = id;
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "de-DE");
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Sprich jetzt …");
        try {
            startActivityForResult(i, 42);
        } catch (ActivityNotFoundException e) {
            js("window.__sttError(" + JSONObject.quote(id) + ",\"No speech recognition app installed (install Google app).\")");
        }
    }

    void startShare(String text) {
        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("text/plain");
        i.putExtra(Intent.EXTRA_TEXT, text);
        startActivity(Intent.createChooser(i, "Save backup"));
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != 42) return;
        String id = JSONObject.quote(pendingId);
        if (res == RESULT_OK && data != null) {
            ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (r != null && r.size() > 0) {
                js("window.__sttResult(" + id + "," + JSONObject.quote(r.get(0)) + ")");
                return;
            }
        }
        js("window.__sttError(" + id + ",\"Didn't catch that. Try again.\")");
    }

    void js(String code) { web.evaluateJavascript(code, null); }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        tts.shutdown();
        super.onDestroy();
    }
}
