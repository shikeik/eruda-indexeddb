import type { DevTools } from 'eruda';
export interface IndexedDBItem {
    database: string;
    store: string;
    objects: string;
}
export default class ErudaIndexedDB {
    private dataGrid;
    private items;
    private devTools;
    private selectedItem;
    private supported;
    private container;
    private dataGridEl;
    private filterText;
    init($container: HTMLElement, devTools: DevTools): void;
    destroy(): void;
    show(): void;
    private refresh;
    private updateFilterText;
    private initTemplate;
    private bindEvents;
    private showModal;
    private showSources;
    private getValue;
    private updateButtons;
    private deleteStore;
    private refreshData;
}
//# sourceMappingURL=ErudaIndexedDB.d.ts.map