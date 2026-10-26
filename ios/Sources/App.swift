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

class ViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, AVSpeechSynthesizerDelegate {
    private var webView: WKWebView!
    private let synth = AVSpeechSynthesizer()
    private var recognizer: SFSpeechRecognizer? = SFSpeechRecognizer(locale: Locale(identifier: "de-DE"))
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let engine = AVAudioEngine()
    private var listenId = ""

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.08, green: 0.09, blue: 0.17, alpha: 1)
        synth.delegate = self
        // playback category: speech is audible even with the silent switch on
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        let cfg = WKWebViewConfiguration()
        let ucc = WKUserContentController()
        // Bridge shim: mirrors the Android JavascriptInterface API.
        let shim = """
        window.AndroidBridge = {
          hasEndEvent: true,
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
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never   // the web app handles safe areas itself
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
            synth.stopSpeaking(at: .immediate)
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
        synth.stopSpeaking(at: .immediate)
        let session = AVAudioSession.sharedInstance()
        // playAndRecord (not .record): with .record all text-to-speech stays silent after the first microphone use
        try? session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .allowBluetooth, .duckOthers])
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
        guard engine.isRunning || request != nil else { return }        // finish only once
        engine.stop(); engine.inputNode.removeTap(onBus: 0)
        request = nil; task = nil
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        // JSON-encode the strings so quotes, backslashes and line breaks can't break the JavaScript
        let payload = (try? JSONSerialization.data(withJSONObject: [listenId, text])).flatMap { String(data: $0, encoding: .utf8) } ?? "[\"\",\"\"]"
        DispatchQueue.main.async { self.webView.evaluateJavaScript("window.__sttResult && window.__sttResult.apply(null, \(payload))") }
    }

    // tell the page when a sentence has really finished, so the player moves on exactly on time
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        webView.evaluateJavaScript("window.__ttsDone && window.__ttsDone()")
    }
}
