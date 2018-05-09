"use strict";
(() => {
  const urlInput = document.querySelector("#url");
  const baseInput = document.querySelector("#base");

  // Use an iframe to avoid <base> affecting the main page. This is especially bad in Edge where it
  // appears to break Edge's DevTools.
  const browserIframeDocument = document.querySelector("#browser-iframe").contentDocument;
  const browserAnchor = browserIframeDocument.createElement("a");
  const browserBase = browserIframeDocument.createElement("base");
  browserIframeDocument.head.appendChild(browserBase);
  browserIframeDocument.body.appendChild(browserAnchor);

  const components = [
    "href", "protocol", "username",
    "password", "port", "hostname",
    "pathname", "search", "hash"
  ];

  urlInput.addEventListener("input", update);
  baseInput.addEventListener("input", update);
  setFromFragment();
  update();

  function update() {
    const browserResult = getBrowserResult();
    const jsdomResult = getJsdomResult();
    const mismatchedComponents = getMismatchedComponents(browserResult, jsdomResult);

    setResult("browser", browserResult, mismatchedComponents);
    setResult("jsdom", jsdomResult, mismatchedComponents);
    updateFragmentForSharing();
  }

  function setResult(kind, result, mismatchedComponents) {
    const output = document.querySelector(`#${kind}-output`);
    const error = document.querySelector(`#${kind}-error`);

    if (result instanceof Error) {
      output.hidden = true;
      error.hidden = false;
      error.textContent = result.toString();
    } else {
      output.hidden = false;
      error.hidden = true;
      for (const component of components) {
        const componentEl = output.querySelector(`#${component}`).querySelector("td");
        setComponentElValue(componentEl, result[component]);
        setComponentElMismatch(componentEl, mismatchedComponents.has(component));
      }
    }
  }

  function setComponentElValue(componentEl, value) {
    const isEmptyString = value === "";
    componentEl.textContent = isEmptyString ? "(empty string)" : value;
    componentEl.classList.toggle("empty-string", isEmptyString);
  }

  function setComponentElMismatch(componentEl, isMismatched) {
    componentEl.classList.toggle("pass", !isMismatched);
    componentEl.classList.toggle("fail", isMismatched);
  }

  function getMismatchedComponents(result1, result2) {
    const mismatched = new Set();
    for (const component of components) {
      if (result1[component] !== result2[component]) {
        mismatched.add(component);
      }
    }
    return mismatched;
  }

  function getBrowserResult() {
    // First make sure the base is not invalid by testing it against an about:blank base.
    browserBase.href = "about:blank";
    browserAnchor.href = baseInput.value;
    if (browserAnchor.protocol === ":") {
      return new Error("Browser could not parse the base URL");
    }

    // Now actually parse the URL against the base.
    browserAnchor.href = urlInput.value;
    browserBase.href = baseInput.value;
    if (browserAnchor.protocol === ":") {
      return new Error("Browser could not parse the input");
    }

    return browserAnchor;
  }

  function getJsdomResult() {
    try {
      return new whatwgURL.URL(urlInput.value, baseInput.value);
    } catch (e) {
      return e;
    }
  }

  function updateFragmentForSharing() {
    location.hash = `url=${btoa(urlInput.value)}&base=${btoa(baseInput.value)}`;
  }

  function setFromFragment() {
    const pieces = /#url=([^&]+)&base=(.*)/.exec(location.hash);
    if (!pieces) {
      return;
    }
    const [, urlEncoded, baseEncoded] = pieces;
    urlInput.value = atob(urlEncoded);
    baseInput.value = atob(baseEncoded);
  }
})();
