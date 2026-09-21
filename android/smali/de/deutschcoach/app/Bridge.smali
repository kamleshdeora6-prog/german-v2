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
