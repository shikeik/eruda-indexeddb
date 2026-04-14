import LunaDataGrid from 'luna-data-grid';
import { deleteDB, openDB } from 'idb';
export default class ErudaIndexedDB {
    constructor() {
        this.dataGrid = null;
        this.items = [];
        this.devTools = null;
        this.selectedItem = null;
        this.supported = true;
        this.container = null;
        this.dataGridEl = null;
        this.filterText = '';
    }
    init($container, devTools) {
        this.devTools = devTools;
        this.container = $container;
        this.initTemplate(this.container);
        this.dataGridEl = this.container.querySelector('.eruda-data-grid');
        this.dataGrid = new LunaDataGrid(this.dataGridEl, {
            columns: [
                { id: 'database', title: 'Database', weight: 30 },
                { id: 'store', title: 'Store', weight: 60 },
                { id: 'objects', title: 'Objects', weight: 20 },
            ],
            maxHeight: 223,
        });
        this.bindEvents();
        this.refresh();
    }
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.dataGrid?.destroy();
    }
    show() {
        this.refresh();
    }
    async refresh() {
        if (!this.supported) {
            if (this.container)
                this.container.style.display = 'none';
            return;
        }
        await this.refreshData();
        this.dataGrid?.clear();
        const filter = this.filterText.toLowerCase();
        for (const { database, store, objects } of this.items) {
            if (filter && !`${database} ${store} ${objects}`.toLowerCase().includes(filter)) {
                continue;
            }
            this.dataGrid?.append({ database, store, objects }, { selectable: true });
        }
    }
    updateFilterText() {
        const el = this.container?.querySelector('.eruda-filter-text');
        if (!el)
            return;
        if (this.filterText) {
            el.textContent = this.filterText;
            el.style.display = '';
        }
        else {
            el.textContent = '';
            el.style.display = 'none';
        }
    }
    initTemplate(el) {
        el.innerHTML = `
            <h2 class="eruda-title" style="border-top:1px solid #ccc;border-right:1px solid #ccc;border-left:1px solid #ccc;border-bottom:none;">
                IndexedDB
                <div class="eruda-btn eruda-refresh-databases">
                    <span class="eruda-icon eruda-icon-refresh"></span>
                </div>
                <div class="eruda-btn eruda-show-detail eruda-btn-disabled">
                    <span class="eruda-icon eruda-icon-eye"></span>
                </div>
                <div class="eruda-btn eruda-delete-store eruda-btn-disabled">
                    <span class="eruda-icon eruda-icon-delete"></span>
                </div>
                <div class="eruda-btn eruda-clear-database">
                    <span class="eruda-icon eruda-icon-clear"></span>
                </div>
                <div class="eruda-btn eruda-filter">
                    <span class="eruda-icon eruda-icon-filter"></span>
                </div>
                <div class="eruda-btn eruda-filter-text" style="display:none"></div>
            </h2>
            <div class="eruda-data-grid"></div>
        `;
    }
    bindEvents() {
        if (!this.container)
            return;
        this.container.addEventListener('click', (e) => {
            const target = e.target;
            if (target.closest('.eruda-refresh-databases')) {
                this.devTools?.notify('Refreshed', { icon: 'success' });
                this.refresh();
            }
            else if (target.closest('.eruda-delete-store')) {
                if (!this.selectedItem)
                    return;
                const { database, store } = this.selectedItem;
                this.showModal({
                    type: 'confirm',
                    title: 'Delete',
                    message: `Delete store '${store}' from '${database}'?`,
                    onConfirm: () => {
                        this.deleteStore(database, store).then(() => {
                            this.devTools?.notify('Deleted', { icon: 'success' });
                            this.refresh();
                        }).catch((err) => {
                            this.devTools?.notify('Delete failed: ' + err.message, { icon: 'error' });
                        });
                    },
                });
            }
            else if (target.closest('.eruda-clear-database')) {
                if (!this.selectedItem)
                    return;
                const database = this.selectedItem.database;
                this.showModal({
                    type: 'confirm',
                    title: 'Delete',
                    message: `Are you sure that you want to delete the '${database}' database?`,
                    onConfirm: () => {
                        deleteDB(database).then(() => this.refresh());
                    },
                });
            }
            else if (target.closest('.eruda-filter')) {
                this.showModal({
                    type: 'input',
                    title: 'Filter',
                    defaultValue: this.filterText,
                    onConfirm: (val) => {
                        this.filterText = val.trim();
                        this.updateFilterText();
                        this.refresh();
                    },
                });
            }
            else if (target.closest('.eruda-show-detail')) {
                if (!this.selectedItem)
                    return;
                const { database, store } = this.selectedItem;
                this.getValue(database, store).then((val) => {
                    try {
                        this.showSources('object', JSON.parse(JSON.stringify(val)));
                    }
                    catch {
                        this.showSources('raw', val);
                    }
                });
            }
        });
        this.dataGrid
            ?.on('select', (node) => {
            this.selectedItem = {
                database: node.data.database,
                store: node.data.store,
                objects: node.data.objects,
            };
            this.updateButtons();
        })
            .on('deselect', () => {
            this.selectedItem = null;
            this.updateButtons();
        });
    }
    showModal(options) {
        const sr = document.getElementById('eruda')?.shadowRoot;
        if (!sr)
            return;
        let modal = sr.querySelector('.eruda-modal.luna-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'eruda-modal luna-modal luna-modal-platform-android luna-modal-theme-light';
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
            modal.innerHTML = `<div class="luna-modal-body" style="width:352px">
                <span class="luna-modal-icon luna-modal-icon-close" style="display:none"></span>
                <div class="luna-modal-title"></div>
                <div class="luna-modal-content"></div>
                <div class="luna-modal-footer"><div class="luna-modal-button-group"><div class="luna-modal-button luna-modal-secondary">取消</div><div class="luna-modal-button luna-modal-primary">确定</div></div></div>
            </div>`;
            sr.appendChild(modal);
        }
        const title = modal.querySelector('.luna-modal-title');
        const content = modal.querySelector('.luna-modal-content');
        const confirmBtn = modal.querySelector('.luna-modal-primary');
        const cancelBtn = modal.querySelector('.luna-modal-secondary');
        const closeBtn = modal.querySelector('.luna-modal-icon-close');
        if (!title || !content || !confirmBtn || !cancelBtn)
            return;
        title.textContent = options.title;
        let input = null;
        if (options.type === 'input') {
            content.innerHTML = '<input class="luna-modal-input" value="">';
            input = content.querySelector('.luna-modal-input');
            input.value = options.defaultValue || '';
        }
        else {
            content.innerHTML = `<div style="padding:10px 0;font-size:14px;color:#333;">${options.message || ''}</div>`;
        }
        modal.style.display = 'flex';
        if (input) {
            input.focus();
            const end = input.value.length;
            input.setSelectionRange(end, end);
        }
        const cleanup = () => {
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', onConfirm, true);
            cancelBtn.removeEventListener('click', onCancel, true);
            if (closeBtn)
                closeBtn.removeEventListener('click', onCancel, true);
            if (input)
                input.removeEventListener('keydown', onKeydown);
        };
        const onConfirm = (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
            const val = input ? input.value : '';
            options.onConfirm(val);
            cleanup();
        };
        const onCancel = (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
            cleanup();
        };
        const onKeydown = (e) => {
            if (e.key === 'Enter') {
                onConfirm(e);
            }
        };
        confirmBtn.addEventListener('click', onConfirm, true);
        cancelBtn.addEventListener('click', onCancel, true);
        if (closeBtn)
            closeBtn.addEventListener('click', onCancel, true);
        if (input)
            input.addEventListener('keydown', onKeydown);
    }
    showSources(type, data) {
        const sources = this.devTools?.get('sources');
        if (!sources)
            return;
        sources.set(type, data);
        this.devTools?.showTool('sources');
        return true;
    }
    async getValue(database, store) {
        const db = await openDB(database);
        const objects = await db.getAll(store);
        db.close();
        return objects;
    }
    updateButtons() {
        const showDetail = this.container?.querySelector('.eruda-show-detail');
        const deleteStore = this.container?.querySelector('.eruda-delete-store');
        if (showDetail) {
            if (this.selectedItem) {
                showDetail.classList.remove('eruda-btn-disabled');
            }
            else {
                showDetail.classList.add('eruda-btn-disabled');
            }
        }
        if (deleteStore) {
            if (this.selectedItem) {
                deleteStore.classList.remove('eruda-btn-disabled');
            }
            else {
                deleteStore.classList.add('eruda-btn-disabled');
            }
        }
    }
    async deleteStore(database, store) {
        const dbs = await indexedDB.databases();
        const dbInfo = dbs.find((d) => d.name === database);
        if (!dbInfo)
            return;
        await new Promise((resolve, reject) => {
            const req = indexedDB.open(database, (dbInfo.version || 1) + 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (db.objectStoreNames.contains(store)) {
                    db.deleteObjectStore(store);
                }
            };
            req.onsuccess = () => {
                req.result.close();
                resolve();
            };
            req.onblocked = () => {
                reject(new Error('Database is blocked by another connection'));
            };
            req.onerror = () => reject(req.error || new Error('Unknown error'));
        });
    }
    async refreshData() {
        try {
            const databases = await indexedDB.databases();
            const values = await Promise.all(databases.map(async (database) => {
                if (!database.name)
                    return;
                const db = await openDB(database.name);
                const databaseValues = await Promise.all(Array.from(db.objectStoreNames).map(async (store) => ({
                    database: database.name,
                    store,
                    objects: String(await db.count(store)),
                })));
                db.close();
                return databaseValues;
            }));
            this.items = values.flat().filter(Boolean);
        }
        catch {
            this.supported = false;
            if (this.container)
                this.container.style.display = 'none';
        }
    }
}
//# sourceMappingURL=ErudaIndexedDB.js.map