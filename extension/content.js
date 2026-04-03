// Content script to interact with the page DOM
// This script is injected into every page the user visits

// Create a virtual cursor element
const virtualCursor = document.createElement('div');
virtualCursor.id = 'mistral-agent-cursor';
Object.assign(virtualCursor.style, {
  position: 'fixed',
  width: '20px',
  height: '20px',
  backgroundColor: 'rgba(59, 130, 246, 0.5)',
  border: '2px solid rgba(59, 130, 246, 0.8)',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: '999999',
  transition: 'all 0.3s ease-out',
  display: 'none',
  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
});
document.body.appendChild(virtualCursor);

function showRipple(x, y) {
  const ripple = document.createElement('div');
  Object.assign(ripple.style, {
    position: 'fixed',
    left: `${x - 15}px`,
    top: `${y - 15}px`,
    width: '30px',
    height: '30px',
    border: '4px solid #3b82f6',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: '999998',
    animation: 'mistral-ripple 0.6s ease-out forwards'
  });
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes mistral-ripple {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(3); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

async function moveCursorTo(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  virtualCursor.style.display = 'block';
  virtualCursor.style.left = `${x - 10}px`;
  virtualCursor.style.top = `${y - 10}px`;
  
  return new Promise(r => setTimeout(r, 400));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSnapshot") {
    const snapshot = {
      url: window.location.href,
      title: document.title,
      domTree: document.documentElement.outerHTML,
      visibleText: document.body.innerText,
      forms: Array.from(document.forms).map(form => ({
        id: form.id,
        action: form.action,
        inputs: Array.from(form.elements).map(el => ({
          name: el.name,
          type: el.type,
          placeholder: el.placeholder
        }))
      })),
      interactiveElements: Array.from(document.querySelectorAll('button, a, input, select, textarea')).map(el => ({
        tag: el.tagName,
        text: el.innerText || el.value || el.placeholder,
        id: el.id,
        className: el.className,
        rect: el.getBoundingClientRect()
      }))
    };
    sendResponse(snapshot);
  }
  
  if (request.action === "executeActions") {
    (async () => {
      console.log("Executing actions with visual feedback:", request.actions);
      
      for (const action of request.actions) {
        let element = null;
        if (action.selector) {
          element = document.querySelector(action.selector);
        } else if (action.id) {
          element = document.getElementById(action.id);
        } else if (action.text) {
          element = Array.from(document.querySelectorAll('button, a, input, label')).find(el => 
            el.innerText.includes(action.text) || el.value?.includes(action.text)
          );
        }

        if (element) {
          await moveCursorTo(element);
          
          switch (action.type) {
            case 'click':
              const rect = element.getBoundingClientRect();
              showRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
              element.click();
              break;
            case 'fill':
            case 'type':
              element.focus();
              element.style.outline = '2px solid #3b82f6';
              element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              
              // Simulate typing
              const text = action.value || action.text;
              element.value = '';
              for (const char of text) {
                element.value += char;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(r => setTimeout(r, 50));
              }
              
              setTimeout(() => {
                element.style.outline = '';
                element.style.backgroundColor = '';
              }, 500);
              break;
            case 'hover':
              element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
              break;
            case 'scroll':
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              break;
          }
        }
        await new Promise(r => setTimeout(r, 500));
      }
      
      setTimeout(() => {
        virtualCursor.style.display = 'none';
      }, 1000);
      
      sendResponse({ success: true });
    })();
    return true; // Keep channel open for async response
  }
  
  return true;
});
