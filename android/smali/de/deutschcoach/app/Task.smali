.class public Lde/deutschcoach/app/Task;
.super Ljava/lang/Object;
.implements Ljava/lang/Runnable;

.field final a:Lde/deutschcoach/app/MainActivity;
.field final kind:I
.field final arg:Ljava/lang/String;

.method public constructor <init>(Lde/deutschcoach/app/MainActivity;ILjava/lang/String;)V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lde/deutschcoach/app/Task;->a:Lde/deutschcoach/app/MainActivity;
    iput p2, p0, Lde/deutschcoach/app/Task;->kind:I
    iput-object p3, p0, Lde/deutschcoach/app/Task;->arg:Ljava/lang/String;
    return-void
.end method

.method public run()V
    .locals 4
    iget-object v0, p0, Lde/deutschcoach/app/Task;->a:Lde/deutschcoach/app/MainActivity;
    iget-object v1, p0, Lde/deutschcoach/app/Task;->arg:Ljava/lang/String;
    iget v2, p0, Lde/deutschcoach/app/Task;->kind:I
    if-nez v2, :not_listen
    invoke-virtual {v0, v1}, Lde/deutschcoach/app/MainActivity;->startListen(Ljava/lang/String;)V
    return-void
    :not_listen
    const/4 v3, 0x2
    if-ne v2, v3, :share
    invoke-virtual {v0, v1}, Lde/deutschcoach/app/MainActivity;->openUrl(Ljava/lang/String;)V
    return-void
    :share
    invoke-virtual {v0, v1}, Lde/deutschcoach/app/MainActivity;->startShare(Ljava/lang/String;)V
    return-void
.end method
