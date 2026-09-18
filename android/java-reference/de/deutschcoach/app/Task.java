package de.deutschcoach.app;

public class Task implements Runnable {
    final MainActivity a; final int kind; final String arg;
    public Task(MainActivity a, int kind, String arg) { this.a = a; this.kind = kind; this.arg = arg; }
    public void run() { if (kind == 0) a.startListen(arg); else a.startShare(arg); }
}
