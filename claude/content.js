let isProcessingMem0 = false;

function addMem0Button() {
  const sendButton = document.querySelector(
    'button[aria-label="Send Message"]'
  );
  const screenshotButton = document.querySelector(
    'button[aria-label="Capture screenshot"]'
  );

  function createPopup(container, position = "top") {
    const popup = document.createElement("div");
    popup.className = "mem0-popup";
    let positionStyles = "";

    if (position === "top") {
      positionStyles = `
        bottom: 100%;
        left: 50%;
        transform: translateX(-40%);
        margin-bottom: 11px;
      `;
    } else if (position === "right") {
      positionStyles = `
        top: 50%;
        left: 100%;
        transform: translateY(-50%);
        margin-left: 11px;
      `;
    }

    popup.style.cssText = `
            display: none;
            position: absolute;
            background-color: #21201C;
            color: white;
            padding: 6px 8px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ${positionStyles}
        `;
    container.appendChild(popup);
    return popup;
  }

  if (
    window.location.href.includes("claude.ai/new") &&
    screenshotButton &&
    !document.querySelector("#mem0-button")
  ) {
    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "relative";
    buttonContainer.style.display = "inline-block";

    const mem0Button = document.createElement("button");
    mem0Button.id = "mem0-button";
    mem0Button.className = screenshotButton.className;
    mem0Button.style.marginLeft = "0px";
    mem0Button.setAttribute("aria-label", "Add related memories");

    const mem0Icon = document.createElement("img");
    mem0Icon.src = chrome.runtime.getURL("icons/mem0-claude-icon-purple.png");
    mem0Icon.style.width = "16px";
    mem0Icon.style.height = "16px";

    const popup = createPopup(buttonContainer, "right");
    mem0Button.appendChild(mem0Icon);
    mem0Button.addEventListener("click", () => handleMem0Click(popup));

    buttonContainer.appendChild(mem0Button);

    const tooltip = document.createElement("div");
    tooltip.id = "mem0-tooltip";
    tooltip.textContent = "Add related memories";
    tooltip.style.cssText = `
            display: none;
            position: fixed;
            background-color: black;
            color: white;
            padding: 3px 7px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
            transform: translateX(-50%);
        `;
    document.body.appendChild(tooltip);

    mem0Button.addEventListener("mouseenter", (event) => {
      const rect = mem0Button.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      tooltip.style.left = `${buttonCenterX}px`;
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.display = "block";
    });

    mem0Button.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    screenshotButton.parentNode.insertBefore(
      buttonContainer,
      screenshotButton.nextSibling
    );
  } else if (sendButton && !document.querySelector("#mem0-button")) {
    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "relative";
    buttonContainer.style.display = "inline-block";

    const mem0Button = document.createElement("img");
    mem0Button.id = "mem0-button";
    mem0Button.src = chrome.runtime.getURL("icons/mem0-claude-icon-purple.png");
    mem0Button.style.width = "16px";
    mem0Button.style.height = "16px";
    mem0Button.style.marginRight = "16px";
    mem0Button.style.cursor = "pointer";
    mem0Button.style.padding = "8px";
    mem0Button.style.borderRadius = "5px";
    mem0Button.style.transition = "background-color 0.3s ease";
    mem0Button.style.boxSizing = "content-box";
    mem0Button.addEventListener("click", () => handleMem0Click(popup));

    const popup = createPopup(buttonContainer, "top");

    mem0Button.addEventListener("mouseenter", () => {
      mem0Button.style.backgroundColor = "rgba(0, 0, 0, 0.35)";
      tooltip.style.visibility = "visible";
      tooltip.style.opacity = "1";
    });
    mem0Button.addEventListener("mouseleave", () => {
      mem0Button.style.backgroundColor = "transparent";
      tooltip.style.visibility = "hidden";
      tooltip.style.opacity = "0";
    });

    const tooltip = document.createElement("div");
    tooltip.textContent = "Add related memories";
    tooltip.style.visibility = "hidden";
    tooltip.style.backgroundColor = "black";
    tooltip.style.color = "white";
    tooltip.style.textAlign = "center";
    tooltip.style.borderRadius = "6px";
    tooltip.style.padding = "2px 6px";
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = "1";
    tooltip.style.top = "calc(100% + 5px)";
    tooltip.style.left = "50%";
    tooltip.style.transform = "translateX(-50%)";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.opacity = "0";
    tooltip.style.transition = "opacity 0.3s";
    tooltip.style.fontSize = "12px";

    buttonContainer.appendChild(mem0Button);
    buttonContainer.appendChild(tooltip);

    const flexContainer = document.createElement("div");
    flexContainer.style.display = "flex";
    flexContainer.style.alignItems = "center";

    const screenshotButton = document.querySelector(
      'button[aria-label="Capture screenshot"]'
    );

    screenshotButton.parentNode.insertBefore(
      buttonContainer,
      screenshotButton.nextSibling
    );
  }
}

async function handleMem0Click(popup, clickSendButton = false) {
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: 'Mem0 button clicked',
    level: 'info'
  });

  const inputElement =
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector("textarea");
  let message = getInputValue();
  setButtonLoadingState(true);
  if (!message) {
    console.error("No input message found");
    showPopup(popup, "No input message found");
    setButtonLoadingState(false);
    return;
  }

  message = message.split("Here is some more information about me:")[0];

  if (isProcessingMem0) {
    return;
  }

  isProcessingMem0 = true;

    try {
        const data = await new Promise((resolve) => {
            chrome.storage.sync.get(
            ["apiKey", "userId", "access_token"],
                function (items) {
                resolve(items);
                }
            );
        });

        const apiKey = data.apiKey;
        const userId = data.userId || "chrome-extension-user";
        const accessToken = data.access_token;

            if (!apiKey && !accessToken) {
                showPopup(popup, 'No API Key or Access Token found');
                isProcessingMem0 = false;
                setButtonLoadingState(false);
                return;
            }

            const authHeader = accessToken ? `Bearer ${accessToken}` : `Token ${apiKey}`;

            const messages = getLastMessages(2);
            messages.push({ role: "user", content: message });

            // Existing search API call
            const searchResponse = await fetch('https://api.mem0.ai/v1/memories/search/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({ query: message, user_id: userId, rerank: false, threshold: 0.3, limit: 10, filter_memories: true })
            });

            if (clickSendButton) {
                const sendButton = document.querySelector('button[aria-label="Send Message"]');
                if (sendButton) {
                    setTimeout(() => {
                        sendButton.click();
                    }, 100);
                } else {
                    console.error("Send button not found");
                }
                }

            if (!searchResponse.ok) {
                throw new Error(
                    `API request failed with status ${searchResponse.status}`
                );
                }

            const responseData = await searchResponse.json();

            if (inputElement) {
            const memories = responseData.map((item) => item.memory);

            if (memories.length > 0) {
                let currentContent =
                inputElement.tagName.toLowerCase() === "div"
                    ? inputElement.innerHTML
                    : inputElement.value;

                const memInfoRegex =
                /<p><strong>Here is some more information about me:<\/strong><\/p>([\s\S]*?)(?=<p><strong>|$)/;
                const memInfoMatch = currentContent.match(memInfoRegex);

                // Prepare new memory content
                let memoryContent = "";
                memories.forEach((mem) => {
                memoryContent += `<p>- ${mem}</p>`;
                });

                if (memInfoMatch) {
                // Replace existing memory information
                currentContent = currentContent.replace(
                    memInfoRegex,
                    `<p><strong>Here is some more information about me:</strong></p>${memoryContent}`
                );
                } else {
                // Append new memory information
                currentContent += `<p><br></p><p><strong>Here is some more information about me:</strong></p>${memoryContent}`;
                }

                if (inputElement.tagName.toLowerCase() === "div") {
                inputElement.innerHTML = currentContent;
                } else {
                inputElement.value = currentContent;
                }

                inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                setButtonLoadingState(false);
            } else {
                if (inputElement.tagName.toLowerCase() === "div") {
                inputElement.innerHTML = message;
                } else {
                // For textarea
                inputElement.value = message;
                }
                inputElement.dispatchEvent(new Event("input", { bubbles: true }));
                showPopup(popup, "No memories found");
                setButtonLoadingState(false);
            }
            } else {
            showPopup(popup, "No input field found to update");
            setButtonLoadingState(false);
            }

            // New add memory API call (non-blocking)
            fetch('https://api.mem0.ai/v1/memories/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    messages: messages,
                    user_id: userId,
                    infer: true
                })
            }).then(response => {
                if (!response.ok) {
                    console.error('Failed to add memory:', response.status);
                }
            }).catch(error => {
                console.error('Error adding memory:', error);
            });

  } catch (error) {
    console.error("Error:", error);
    showPopup(popup, "Failed to send message to Mem0");
    setButtonLoadingState(false);
    Sentry.captureException("Failed to send message to Mem0");
  } finally {
    isProcessingMem0 = false;
  }
}

function getLastMessages(count) {
  const messageContainer = document.querySelector(
    ".flex-1.flex.flex-col.gap-3.px-4.max-w-3xl.mx-auto.w-full"
  );
  if (!messageContainer) return [];

  const messageElements = Array.from(messageContainer.children).reverse();
  const messages = [];

  for (const element of messageElements) {
    if (messages.length >= count) break;

    const userElement = element.querySelector(".font-user-message");
    const assistantElement = element.querySelector(".font-claude-message");

    if (userElement) {
      const content = userElement.textContent.trim();
      messages.unshift({ role: "user", content });
    } else if (assistantElement) {
      const content = assistantElement.textContent.trim();
      messages.unshift({ role: "assistant", content });
    }
  }

  return messages;
}

function setButtonLoadingState(isLoading) {
  const mem0Button = document.querySelector("#mem0-button");
  if (mem0Button) {
    if (isLoading) {
      mem0Button.disabled = true;
      document.body.style.cursor = "wait";
      mem0Button.style.cursor = "wait";
      mem0Button.style.opacity = "0.7";
    } else {
      mem0Button.disabled = false;
      document.body.style.cursor = "default";
      mem0Button.style.cursor = "pointer";
      mem0Button.style.opacity = "1";
    }
  }
}

function showPopup(popup, message) {
  // Create and add the (i) icon
  const infoIcon = document.createElement("span");
  infoIcon.textContent = "ⓘ ";
  infoIcon.style.marginRight = "3px";

  popup.innerHTML = "";
  popup.appendChild(infoIcon);
  popup.appendChild(document.createTextNode(message));

  popup.style.display = "block";
  setTimeout(() => {
    popup.style.display = "none";
  }, 2000);
}

function getInputValue() {
  const inputElement =
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector("textarea");
  return inputElement ? inputElement.textContent || inputElement.value : null;
}

function initializeMem0Integration() {
  Sentry.addBreadcrumb({
    category: 'lifecycle',
    message: 'Initializing Mem0 integration',
    level: 'info'
  });

  addMem0Button();
  
  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "m") {
      event.preventDefault();
      Sentry.addBreadcrumb({
        category: 'user-action',
        message: 'Ctrl+M shortcut used',
        level: 'info'
      });
      const popup = document.querySelector(".mem0-popup");
      if (popup) {
        (async () => {
          await handleMem0Click(popup, true);
        })();
      } else {
        console.error("Mem0 popup not found");
        Sentry.captureMessage("Mem0 popup not found", "error");
      }
    }
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        addMem0Button();
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

initializeMem0Integration();