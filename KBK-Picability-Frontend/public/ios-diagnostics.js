
(function () {
    var messages = [];
    var panel = null;

    function log(message) {
        var line = new Date().toLocaleTimeString() + " " + message;
        messages.push(line);
        console.log("[Picability Debug]", message);

        if (!document.body) return;

        if (!panel) {
            panel = document.createElement("pre");
            panel.id = "picability-ios-debug";
            panel.style.cssText =
                "position:fixed;inset:0;z-index:2147483647;" +
                "background:#111827;color:#a7f3d0;padding:24px;" +
                "overflow:auto;white-space:pre-wrap;" +
                "font:13px monospace;margin:0;";
            document.body.appendChild(panel);
        }

        panel.textContent =
            "PICABILITY iOS DIAGNOSTICS\n\n" + messages.join("\n");
    }

    window.addEventListener("error", function (event) {
        log("JS ERROR: " + event.message +
            " at " + event.filename + ":" + event.lineno);
    }, true);

    window.addEventListener("unhandledrejection", function (event) {
        log("PROMISE REJECTION: " + String(event.reason));
    });

    document.addEventListener("DOMContentLoaded", function () {
        log("HTML loaded");
        log("Origin: " + location.origin);

        var scripts = document.querySelectorAll("script[src]");
        scripts.forEach(function (script) {
            log("Script: " + script.getAttribute("src"));
        });

        setTimeout(function () {
            var root = document.getElementById("root");
            log("React root: " +
                (root && root.children.length ? "HAS CONTENT" : "EMPTY"));
        }, 5000);
    });

    log("Diagnostics initialized");
})();
