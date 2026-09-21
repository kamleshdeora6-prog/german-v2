import UIKit
import WebKit
import AVFoundation
import Speech

/// Deutsch Coach for iOS – the same offline web app in a WKWebView,
/// with native text-to-speech and speech recognition wired to `window.AndroidBridge`
/// (the JS side only checks for that object, so one bridge name works on both platforms).
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        let w = UIWindow(frame: UIScreen.main.bounds)
        w.rootViewController = ViewController()
        w.makeKeyAndVisible()
        window = w
        return true
    }
}

class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
    private var webView: WKWebView!
    private let synth = AVSpeechSynthesizer()
    private var recognizer: SFSpeechRecognizer? = SFSpeechRecognizer(locale: Locale(identifier: "de-DE"))
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let engine = AVAudioEngine()
    private var listenId = ""

    override func viewDidLoad() {
        super.viewDidLoad()
        let cfg = WKWebViewConfiguration()
        let ucc = WKUserContentController()
        // Bridge shim: mirrors the Android JavascriptInterface API.
        let shim = """
        window.AndroidBridge = {
          speak: (t, rate) => webkit.messageHandlers.bridge.postMessage({fn:'speak', text:t, rate:rate}),
          stop:  () => webkit.messageHandlers.bridge.postMessage({fn:'stop'}),
          listen:(id) => webkit.messageHandlers.bridge.postMessage({fn:'listen', id:id}),
          share: (t) => webkit.messageHandlers.bridge.postMessage({fn:'share', text:t}),
          openUrl:(u) => webkit.messageHandlers.bridge.postMessage({fn:'openUrl', url:u})
        };
        """
        ucc.addUserScript(WKUserScript(source: shim, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        ucc.add(self, name: "bridge")
        cfg.userContentController = ucc
        cfg.allowsInlineMediaPlayback = true

        webView = WKWebView(frame: view.bounds, configuration: cfg)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.scrollView.bounces = false
        view.addSubview(webView)

        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        SFSpeechRecognizer.requestAuthorization { _ in }
    }

    // Keep in-app navigation inside the app, send http(s) links to Safari.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url, url.scheme == "http" || url.scheme == "https" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel); return
        }
        decisionHandler(.allow)
    }

    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let fn = body["fn"] as? String else { return }
        switch fn {
        case "speak":
            let u = AVSpeechUtterance(string: body["text"] as? String ?? "")
            u.voice = AVSpeechSynthesisVoice(language: "de-DE")
            u.rate = Float(body["rate"] as? Double ?? 1.0) * AVSpeechUtteranceDefaultSpeechRate
            synth.speak(u)
        case "stop":
            synth.stopSpeaking(at: .immediate)
        case "listen":
            listenId = body["id"] as? String ?? ""
            startListening()
        case "share":
            let vc = UIActivityViewController(activityItems: [body["text"] as? String ?? ""], applicationActivities: nil)
            present(vc, animated: true)
        case "openUrl":
            if let s = body["url"] as? String, let url = URL(string: s) { UIApplication.shared.open(url) }
        default: break
        }
    }

    private func startListening() {
        task?.cancel(); task = nil
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.record, mode: .measurement, options: .duckOthers)
        try? session.setActive(true, options: .notifyOthersOnDeactivation)
        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = false
        request = req
        let input = engine.inputNode
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) { buf, _ in req.append(buf) }
        engine.prepare(); try? engine.start()
        task = recognizer?.recognitionTask(with: req) { [weak self] result, error in
            guard let self = self else { return }
            if let result = result, result.isFinal {
                self.finishListening(result.bestTranscription.formattedString)
            } else if error != nil {
                self.finishListening("")
            }
        }
        // hard stop after 12 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 12) { [weak self] in
            guard let self = self, self.engine.isRunning else { return }
            self.request?.endAudio()
        }
    }

    private func finishListening(_ text: String) {
        engine.stop(); engine.inputNode.removeTap(onBus: 0)
        request = nil; task = nil
        let escaped = text.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "'", with: "\\'")
        webView.evaluateJavaScript("window.__sttResult && window.__sttResult('\(listenId)', '\(escaped)')")
    }
}
