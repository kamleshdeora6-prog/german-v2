.class public Lde/deutschcoach/app/Bridge;
.super Ljava/lang/Object;

.field final a:Lde/deutschcoach/app/MainActivity;

.method public constructor <init>(Lde/deutschcoach/app/MainActivity;)V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lde/deutschcoach/app/Bridge;->a:Lde/deutschcoach/app/MainActivity;
    return-void
.end method

.method public speak(Ljava/lang/String;F)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .locals 1
    iget-object v0, p0, Lde/deutschcoach/app/Bridge;->a:Lde/deutschcoach/app/MainActivity;
    invoke-virtual {v0, p1, p2}, Lde/deutschcoach/app/MainActivity;->speak(Ljava/lang/String;F)V
    return-void
.end method

.method public stop()V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .locals 1
    iget-object v0, p0, Lde/deutschcoach/app/Bridge;->a:Lde/deutschcoach/app/MainActivity;
    invoke-virtual {v0}, Lde/deutschcoach/app/MainActivity;->stopSpeaking()V
    return-void
.end method

.method public listen(Ljava/lang/String;)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .locals 3
    iget-object v0, p0, Lde/deutschcoach/app/Bridge;->a:Lde/deutschcoach/app/MainActivity;
    new-instance v1, Lde/deutschcoach/app/Task;
    const/4 v2, 0x0
    invoke-direct {v1, v0, v2, p1}, Lde/deutschcoach/app/Task;-><init>(Lde/deutschcoach/app/MainActivity;ILjava/lang/String;)V
    invoke-virtual {v0, v1}, Lde/deutschcoach/app/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V
    return-void
.end method

.method public share(Ljava/lang/String;)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .locals 3
    iget-object v0, p0, Lde/deutschcoach/app/Bridge;->a:Lde/deutschcoach/app/MainActivity;
    new-instance v1, Lde/deutschcoach/app/Task;
    const/4 v2, 0x1
    invoke-direct {v1, v0, v2, p1}, Lde/deutschcoach/app/Task;-><init>(Lde/deutschcoach/app/MainActivity;ILjava/lang/String;)V
    invoke-virtual {v0, v1}, Lde/deutschcoach/app/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V
    return-void
.end method

.method public openUrl(Ljava/lang/String;)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .locals 3
    iget-object v0, p0, Lde/deutschcoach/app/Bridge;->a:Lde/deutschcoach/app/MainActivity;
    new-instance v1, Lde/deutschcoach/app/Task;
    const/4 v2, 0x2
    invoke-direct {v1, v0, v2, p1}, Lde/deutschcoach/app/Task;-><init>(Lde/deutschcoach/app/MainActivity;ILjava/lang/String;)V
    invoke-virtual {v0, v1}, Lde/deutschcoach/app/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V
    return-void
.end method

# 7.6: progress hand-over from the old built-in copy (file://) to the live web app (https://) – one string in SharedPreferences
.method public getHandover()Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .locals 4
    iget-object v0, p0, Lde/deutschcoach/app/Bridge;->a:Lde/deutschcoach/app/MainActivity;
    const-string v1, "dc"
    const/4 v2, 0x0
    invoke-virtual {v0, v1, v2}, Lde/deutschcoach/app/MainActivity;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;
    move-result-object v0
    const-string v1, "handover"
    const-string v2, ""
    invoke-interface {v0, v1, v2}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v3
    return-object v3
.end method

.method public setHandover(Ljava/lang/String;)V
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .locals 3
    iget-object v0, p0, Lde/deutschcoach/app/Bridge;->a:Lde/deutschcoach/app/MainActivity;
    const-string v1, "dc"
    const/4 v2, 0x0
    invoke-virtual {v0, v1, v2}, Lde/deutschcoach/app/MainActivity;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;
    move-result-object v0
    invoke-interface {v0}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;
    move-result-object v0
    const-string v1, "handover"
    invoke-interface {v0, v1, p1}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    move-result-object v0
    invoke-interface {v0}, Landroid/content/SharedPreferences$Editor;->commit()Z
    return-void
.end method

.method public shell()I
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    .locals 1
    const/4 v0, 0x1
    return v0
.end method
