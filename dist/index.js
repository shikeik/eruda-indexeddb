import ErudaIndexedDB from './ErudaIndexedDB';
const MOUNTED_CLASS = 'eruda-indexeddb';
function getResourcesPanel() {
    const erudaEl = document.getElementById('eruda');
    if (!erudaEl || !erudaEl.shadowRoot)
        return null;
    return erudaEl.shadowRoot.querySelector('.eruda-resources');
}
export function mountIndexedDB(erudaObj) {
    const devTools = erudaObj._devTools;
    let instance = null;
    let wrapper = null;
    const ensureMounted = () => {
        const resources = getResourcesPanel();
        if (!resources)
            return false;
        // Already mounted?
        if (resources.querySelector('.' + MOUNTED_CLASS))
            return true;
        // Create wrapper
        wrapper = document.createElement('div');
        wrapper.className = 'eruda-section ' + MOUNTED_CLASS;
        wrapper.style.border = 'none';
        // Insert at the top of .eruda-resources
        resources.insertBefore(wrapper, resources.firstElementChild);
        instance = new ErudaIndexedDB();
        instance.init(wrapper, devTools);
        return true;
    };
    // Hook resources.show() for resilience
    const resourcesTool = devTools.get('resources');
    const originalShow = resourcesTool?.show?.bind(resourcesTool);
    let hooked = false;
    if (originalShow && typeof originalShow === 'function') {
        resourcesTool.show = function (...args) {
            const result = originalShow(...args);
            ensureMounted();
            return result;
        };
        hooked = true;
    }
    // Initial mount attempt with polling (eruda may not be fully rendered yet)
    const maxAttempts = 30;
    let attempts = 0;
    const timer = setInterval(() => {
        if (ensureMounted() || ++attempts >= maxAttempts) {
            clearInterval(timer);
        }
    }, 200);
    return {
        destroy() {
            clearInterval(timer);
            if (hooked && resourcesTool && originalShow) {
                resourcesTool.show = originalShow;
            }
            if (instance) {
                instance.destroy();
                instance = null;
            }
            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
                wrapper = null;
            }
        },
    };
}
export default mountIndexedDB;
//# sourceMappingURL=index.js.map