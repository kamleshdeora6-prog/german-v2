.class public Lde/deutschcoach/app/MainActivity;
.super Landroid/app/Activity;
.implements Landroid/speech/tts/TextToSpeech$OnInitListener;

.field web:Landroid/webkit/WebView;
.field tts:Landroid/speech/tts/TextToSpeech;
.field pendingId:Ljava/lang/String;

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 5
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V
    new-instance v0, Landroid/webkit/WebView;
    invoke-direct {v0, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lde/deutschcoach/app/MainActivity;->web:Landroid/webkit/WebView;
    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;
    move-result-object v1
    const/4 v2, 0x1
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V
    const/4 v3, 0x0
    invoke-virtual {v1, v3}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V
    const/16 v4, 0x64
    invoke-virtual {v1, v4}, Landroid/webkit/WebSettings;->setTextZoom(I)V
    new-instance v1, Landroid/webkit/WebViewClient;
    invoke-direct {v1}, Landroid/webkit/WebViewClient;-><init>()V
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V
    new-instance v1, Landroid/webkit/WebChromeClient;
    invoke-direct {v1}, Landroid/webkit/WebChromeClient;-><init>()V
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V
    new-instance v1, Lde/deutschcoach/app/Bridge;
    invoke-direct {v1, p0}, Lde/deutschcoach/app/Bridge;-><init>(Lde/deutschcoach/app/MainActivity;)V
    const-string v2, "AndroidBridge"
    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V
    invoke-virtual {p0, v0}, Lde/deutschcoach/app/MainActivity;->setContentView(Landroid/view/View;)V
    const-string v1, "file:///android_asset/www/index.html"
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    new-instance v1, Landroid/speech/tts/TextToSpeech;
    invoke-direct {v1, p0, p0}, Landroid/speech/tts/TextToSpeech;-><init>(Landroid/content/Context;Landroid/speech/tts/TextToSpeech$OnInitListener;)V
    iput-object v1, p0, Lde/deutschcoach/app/MainActivity;->tts:Landroid/speech/tts/TextToSpeech;
    return-void
.end method

.method public onInit(I)V
    .locals 2
    const/4 v0, 0x0
    if-ne p1, v0, :end
    iget-object v0, p0, Lde/deutschcoach/app/MainActivity;->tts:Landroid/speech/tts/TextToSpeech;
    if-eqz v0, :end
    sget-object v1, Ljava/util/Locale;->GERMANY:Ljava/util/Locale;
    invoke-virtual {v0, v1}, Landroid/speech/tts/TextToSpeech;->setLanguage(Ljava/util/Locale;)I
    :end
    return-void
.end method

.method speak(Ljava/lang/String;F)V
    .locals 4
    iget-object v0, p0, Lde/deutschcoach/app/MainActivity;->tts:Landroid/speech/tts/TextToSpeech;
    if-eqz v0, :end
    invoke-virtual {v0, p2}, Landroid/speech/tts/TextToSpeech;->setSpeechRate(F)I
    const/4 v1, 0x0
    const/4 v2, 0x0
    const-string v3, "dc"
    invoke-virtual {v0, p1, v1, v2, v3}, Landroid/speech/tts/TextToSpeech;->speak(Ljava/lang/CharSequence;ILandroid/os/Bundle;Ljava/lang/String;)I
    :end
    return-void
.end method

.method stopSpeaking()V
    .locals 1
    iget-object v0, p0, Lde/deutschcoach/app/MainActivity;->tts:Landroid/speech/tts/TextToSpeech;
    if-eqz v0, :end
    invoke-virtual {v0}, Landroid/speech/tts/TextToSpeech;->stop()I
    :end
    return-void
.end method

.method js(Ljava/lang/String;)V
    .locals 2
    iget-object v0, p0, Lde/deutschcoach/app/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :end
    const/4 v1, 0x0
    invoke-virtual {v0, p1, v1}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :end
    return-void
.end method

.method call2(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 3
    new-instance v0, Ljava/lang/StringBuilder;
    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    const-string v1, "("
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-static {p2}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v2
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    const-string v1, ","
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-static {p3}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;
    move-result-object v2
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    const-string v1, ")"
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v1
    invoke-virtual {p0, v1}, Lde/deutschcoach/app/MainActivity;->js(Ljava/lang/String;)V
    return-void
.end method

.method startListen(Ljava/lang/String;)V
    .locals 4
    iput-object p1, p0, Lde/deutschcoach/app/MainActivity;->pendingId:Ljava/lang/String;
    new-instance v0, Landroid/content/Intent;
    const-string v1, "android.speech.action.RECOGNIZE_SPEECH"
    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V
    const-string v1, "android.speech.extra.LANGUAGE_MODEL"
    const-string v2, "free_form"
    invoke-virtual {v0, v1, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;
    const-string v1, "android.speech.extra.LANGUAGE"
    const-string v2, "de-DE"
    invoke-virtual {v0, v1, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;
    const-string v1, "android.speech.extra.PROMPT"
    const-string v2, "Sprich jetzt auf Deutsch"
    invoke-virtual {v0, v1, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;
    const/16 v1, 0x2a
    :try_start_0
    invoke-virtual {p0, v0, v1}, Lde/deutschcoach/app/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    goto :done
    :catch_0
    move-exception v2
    const-string v2, "window.__sttError"
    const-string v3, "No speech recognition available on this phone. Install the Google app or use the on-screen keyboard."
    invoke-virtual {p0, v2, p1, v3}, Lde/deutschcoach/app/MainActivity;->call2(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    :done
    return-void
.end method

.method startShare(Ljava/lang/String;)V
    .locals 3
    new-instance v0, Landroid/content/Intent;
    const-string v1, "android.intent.action.SEND"
    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V
    const-string v1, "text/plain"
    invoke-virtual {v0, v1}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;
    const-string v1, "android.intent.extra.TEXT"
    invoke-virtual {v0, v1, p1}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;
    const-string v1, "Deutsch Coach backup"
    invoke-static {v0, v1}, Landroid/content/Intent;->createChooser(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;
    move-result-object v2
    invoke-virtual {p0, v2}, Lde/deutschcoach/app/MainActivity;->startActivity(Landroid/content/Intent;)V
    return-void
.end method

.method protected onActivityResult(IILandroid/content/Intent;)V
    .locals 5
    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onActivityResult(IILandroid/content/Intent;)V
    const/16 v0, 0x2a
    if-ne p1, v0, :ret
    iget-object v1, p0, Lde/deutschcoach/app/MainActivity;->pendingId:Ljava/lang/String;
    const/4 v0, -0x1
    if-ne p2, v0, :err
    if-eqz p3, :err
    const-string v2, "android.speech.extra.RESULTS"
    invoke-virtual {p3, v2}, Landroid/content/Intent;->getStringArrayListExtra(Ljava/lang/String;)Ljava/util/ArrayList;
    move-result-object v2
    if-eqz v2, :err
    invoke-virtual {v2}, Ljava/util/ArrayList;->size()I
    move-result v3
    if-lez v3, :err
    const/4 v3, 0x0
    invoke-virtual {v2, v3}, Ljava/util/ArrayList;->get(I)Ljava/lang/Object;
    move-result-object v4
    check-cast v4, Ljava/lang/String;
    const-string v2, "window.__sttResult"
    invoke-virtual {p0, v2, v1, v4}, Lde/deutschcoach/app/MainActivity;->call2(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    goto :ret
    :err
    const-string v2, "window.__sttError"
    const-string v3, "I did not catch that. Tap the mic and speak again."
    invoke-virtual {p0, v2, v1, v3}, Lde/deutschcoach/app/MainActivity;->call2(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    :ret
    return-void
.end method

.method public onBackPressed()V
    .locals 2
    iget-object v0, p0, Lde/deutschcoach/app/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :sup
    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z
    move-result v1
    if-eqz v1, :sup
    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V
    return-void
    :sup
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V
    return-void
.end method

.method protected onDestroy()V
    .locals 1
    iget-object v0, p0, Lde/deutschcoach/app/MainActivity;->tts:Landroid/speech/tts/TextToSpeech;
    if-eqz v0, :skip
    invoke-virtual {v0}, Landroid/speech/tts/TextToSpeech;->shutdown()V
    :skip
    invoke-super {p0}, Landroid/app/Activity;->onDestroy()V
    return-void
.end method

.method openUrl(Ljava/lang/String;)V
    .locals 3
    :try_start_0
    new-instance v0, Landroid/content/Intent;
    const-string v1, "android.intent.action.VIEW"
    invoke-static {p1}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;
    move-result-object v2
    invoke-direct {v0, v1, v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V
    const/high16 v1, 0x10000000
    invoke-virtual {v0, v1}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;
    invoke-virtual {p0, v0}, Lde/deutschcoach/app/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    goto :done
    :catch_0
    move-exception v0
    :done
    return-void
.end method
