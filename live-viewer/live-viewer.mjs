import whatwgURL from "./whatwg-url.mjs";

const urlInput = document.querySelector("#url");
const baseInput = document.querySelector("#base");

const te = new TextEncoder();
const td = new TextDecoder();

const components = [
  "href",
  "protocol",
  "username",
  "password",
  "port",
  "hostname",
  "pathname",
  "search",
  "hash",
  "origin"
];

urlInput.addEventListener("input", update);
baseInput.addEventListener("input", update);
window.addEventListener("hashchange", setFromFragment);
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
      const componentEl = output.querySelector(`.${component}`).querySelector("td");
      setComponentElValue(componentEl, result[component]);
      setComponentElMismatch(componentEl, mismatchedComponents.has(component));
    }
  }
}

function setComponentElValue(componentEl, value) {
  // This shows up in Edge where username/password are undefined.
  const isNonString = typeof value !== "string";
  const isEmptyString = value === "";

  componentEl.textContent = isEmptyString ? "(empty string)" : value;
  componentEl.classList.toggle("empty-string", isEmptyString);
  componentEl.classList.toggle("non-string", isNonString);
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
  try {
    return new URL(urlInput.value, baseInput.value);
  } catch (e) {
    return e;
  }
}

function getJsdomResult() {
  try {
    return new whatwgURL.URL(urlInput.value, baseInput.value);
  } catch (e) {
    return e;
  }
}

function updateFragmentForSharing() {
  history.replaceState(
    undefined,
    "",
    `#url=${encodeToBase64(urlInput.value)}&base=${encodeToBase64(baseInput.value)}`
  );
}

function setFromFragment() {
  const pieces = /#url=([^&]*)&base=(.*)/u.exec(location.hash);
  if (!pieces) {
    return;
  }
  const [, urlEncoded, baseEncoded] = pieces;
  try {
    urlInput.value = decodeFromBase64(urlEncoded);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("url hash parameter was not deserializable.");
  }

  try {
    baseInput.value = decodeFromBase64(baseEncoded);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("base hash parameter was not deserializable.");
  }

  update();
}

// btoa / atob don't work on Unicode.
// This version is a superset of btoa / atob, so it maintains compatibility with older versions of
// the live viewer which used btoa / atob directly.
function encodeToBase64(originalString) {
  const bytes = te.encode(originalString);
  const byteString = Array.from(bytes, byte => String.fromCharCode(byte)).join("");
  const encoded = btoa(byteString);
  return encoded;
}

function decodeFromBase64(encoded) {
  const byteString = atob(encoded);
  const bytes = Uint8Array.from(byteString, char => char.charCodeAt(0));
  const originalString = td.decode(bytes);
  return originalString;
}
