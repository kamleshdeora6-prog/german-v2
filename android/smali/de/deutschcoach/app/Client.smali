.class public Lde/deutschcoach/app/Client;
.super Landroid/webkit/WebViewClient;

# 7.6: the app shows the live web app; this keeps it inside the app, sends other sites to the browser
# and shows a local "connect once" page when the very first start has no internet.

.field final a:Lde/deutschcoach/app/MainActivity;

.method public constructor <init>(Lde/deutschcoach/app/MainActivity;)V
    .locals 0
    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V
    iput-object p1, p0, Lde/deutschcoach/app/Client;->a:Lde/deutschcoach/app/MainActivity;
    return-void
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Z
    .locals 3
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;
    move-result-object v0
    invoke-virtual {v0}, Landroid/net/Uri;->toString()Ljava/lang/String;
    move-result-object v0
    const-string v1, "file:"
    invoke-virtual {v0, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v2
    if-nez v2, :inside
    const-string v1, "__APP_URL__"
    invoke-virtual {v0, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z
    move-result v2
    if-nez v2, :inside
    iget-object v1, p0, Lde/deutschcoach/app/Client;->a:Lde/deutschcoach/app/MainActivity;
    invoke-virtual {v1, v0}, Lde/deutschcoach/app/MainActivity;->openUrl(Ljava/lang/String;)V
    const/4 v2, 0x1
    return v2
    :inside
    const/4 v2, 0x0
    return v2
.end method

.method public onReceivedError(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;Landroid/webkit/WebResourceError;)V
    .locals 1
    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->isForMainFrame()Z
    move-result v0
    if-eqz v0, :end
    const-string v0, "file:///android_asset/www/offline.html"
    invoke-virtual {p1, v0}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V
    :end
    return-void
.end method
