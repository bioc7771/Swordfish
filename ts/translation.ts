/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to compile, 
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or 
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*****************************************************************************/

class TranslationView {

    electron = require('electron');

    static SVG_BLANK: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'></svg>";
    static SVG_UNTRANSLATED = "<svg xmlns:svg='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24' version='1.1'><path d='M 19,5 V 19 H 5 V 5 H 19 M 19,3 H 5 C 3.9,3 3,3.9 3,5 v 14 c 0,1.1 0.9,2 2,2 h 14 c 1.1,0 2,-0.9 2,-2 V 5 C 21,3.9 20.1,3 19,3 Z' /></svg>"
    static SVG_TRANSLATED: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><g><g><path d='M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z'/></g><path d='M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z'/></g></svg>";
    static SVG_FINAL: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z'/></svg>";
    static SVG_LOCK: string = "<svg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 24 24' width='24'><path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z'/></svg>";

    container: HTMLDivElement;
    observer: MutationObserver;
    rowsObserver: MutationObserver;

    mainArea: HTMLDivElement;
    filesArea: HTMLDivElement;
    translationArea: HTMLDivElement;
    rightPanel: HTMLDivElement;
    segmentsArea: HTMLDivElement;
    memoryArea: HTMLDivElement;
    machineArea: HTMLDivElement;
    termsArea: HTMLDivElement;
    statusArea: HTMLDivElement;

    projectId: string;
    srcLang: string;
    tgtLang: string;
    tbody: HTMLTableSectionElement;
    sourceTh: HTMLTableCellElement;
    targetTh: HTMLTableCellElement;

    pagesSpan: HTMLSpanElement;

    maxPage: number;
    pageInput: HTMLInputElement;
    currentPage: number = 0;
    rowsPage: number = 500;
    maxRows: number;
    segmentsCount: number;
    statistics: HTMLDivElement;

    currentRow: HTMLTableRowElement;
    currentCell: HTMLTableCellElement;
    currentState: HTMLTableCellElement;
    currentTranslate: HTMLTableCellElement;
    currentContent: string;
    currentId: any = {};
    sourceTags: Map<string, string>;

    filterButton: HTMLAnchorElement;
    filterText: string = '';
    filterLanguage: string = 'source';
    caseSensitiveFilter: boolean = false;
    regExp: boolean = false;
    showUntranslated: boolean = true;
    showTranslated: boolean = true;
    showConfirmed: boolean = true;

    tmMatches: TmMatches;
    mtMatches: MtMatches;
    termsPanel: TermsPanel;

    memSelect: HTMLSelectElement;
    glossSelect: HTMLSelectElement;

    constructor(div: HTMLDivElement, projectId: string, sourceLang: string, targetLang: string) {
        this.container = div;
        this.projectId = projectId;
        this.srcLang = sourceLang;
        this.tgtLang = targetLang;

        this.sourceTags = new Map<string, string>();
        let topBar: HTMLDivElement = document.createElement('div');
        topBar.className = 'toolbar';
        div.appendChild(topBar);

        this.buildTopBar(topBar);

        this.mainArea = document.createElement('div');
        this.mainArea.id = 'main' + projectId;
        this.mainArea.style.display = 'flex';
        div.appendChild(this.mainArea);

        let verticalPanels: VerticalSplit = new VerticalSplit(this.mainArea);
        verticalPanels.setWeights([75, 25]);
        this.filesArea = verticalPanels.leftPanel();

        this.translationArea = verticalPanels.leftPanel();
        this.translationArea.style.height = '100%';

        this.rightPanel = verticalPanels.rightPanel();

        this.container.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'PageDown') {
                event.preventDefault();
                event.cancelBubble = true;
                this.gotoNext();
            }
            if (event.key === 'PageUp') {
                event.preventDefault();
                event.cancelBubble = true;
                this.gotoPrevious();
            }
        });

        this.buildTranslationArea();
        this.buildRightSide();

        this.electron.ipcRenderer.on('set-segments-count', (event: Electron.IpcRendererEvent, arg: any) => {
            if (arg.project === this.projectId) {
                this.setSegmentsCount(arg.count);
            }
        });
        this.electron.ipcRenderer.on('set-segments', (event: Electron.IpcRendererEvent, arg: any) => {
            if (arg.project === this.projectId) {
                this.setSegments(arg.segments);
            }
        });
        this.watchSizes();

        setTimeout(() => {
            this.setSize();
        }, 200);

        this.electron.ipcRenderer.send('get-segments-count', { project: this.projectId });
        this.electron.ipcRenderer.send('get-project-memories', { project: this.projectId });
        this.electron.ipcRenderer.send('get-project-glossaries', { project: this.projectId });
        this.electron.ipcRenderer.on('request-memories', () => {
            this.electron.ipcRenderer.send('get-project-memories', { project: this.projectId });
        });
        this.electron.ipcRenderer.on('request-glossaries', () => {
            this.electron.ipcRenderer.send('get-project-glossaries', { project: this.projectId });
        });
        this.electron.ipcRenderer.send('get-zoom');
        this.electron.ipcRenderer.on('set-zoom', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setzoom(arg.zoom);
        });
        this.setSpellChecker();
    }

    setzoom(zoom: string): void {
        let style: HTMLStyleElement = document.getElementById('zoom') as HTMLStyleElement;
        if (!style) {
            style = document.createElement('style');
            style.id = 'zoom';
            document.head.appendChild(style);
        }
        style.innerHTML = '.zoomable td { font-size: ' + zoom + 'em; } .zoom { font-size: ' + zoom + 'em; }';
    }

    buildTopBar(topBar: HTMLDivElement): void {
        let exportTranslations = document.createElement('a');
        exportTranslations.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Export Translations</span>';
        exportTranslations.className = 'tooltip';
        exportTranslations.addEventListener('click', () => {
            this.exportTranslations();
        });
        topBar.appendChild(exportTranslations);

        let saveEdit = document.createElement('a');
        saveEdit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Save Changes</span>';
        saveEdit.className = 'tooltip';
        saveEdit.style.marginLeft = '20px';
        saveEdit.addEventListener('click', () => {
            this.saveEdit({ confirm: false, next: 'none' });
        });
        topBar.appendChild(saveEdit);

        let cancelEdit = document.createElement('a');
        cancelEdit.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Discard Changes</span>';
        cancelEdit.className = 'tooltip';
        cancelEdit.addEventListener('click', () => {
            this.cancelEdit();
        });
        topBar.appendChild(cancelEdit);

        let confirmEdit = document.createElement('a');
        confirmEdit.innerHTML = TranslationView.SVG_FINAL +
            '<span class="tooltiptext bottomTooltip">Confirm Translation</span>';
        confirmEdit.className = 'tooltip';
        confirmEdit.style.marginLeft = '20px';
        confirmEdit.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'none' });
        });
        topBar.appendChild(confirmEdit);

        let confirmNextUntranslated = document.createElement('a');
        confirmNextUntranslated.innerHTML = TranslationView.SVG_UNTRANSLATED +
            '<span class="tooltiptext bottomTooltip">Confirm and go to Next Untranslated</span>';
        confirmNextUntranslated.className = 'tooltip';
        confirmNextUntranslated.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'untranslated' });
        });
        topBar.appendChild(confirmNextUntranslated);

        let confirmNextUnconfirmed = document.createElement('a');
        confirmNextUnconfirmed.innerHTML = TranslationView.SVG_TRANSLATED +
            '<span class="tooltiptext bottomTooltip">Confirm and go to Next Uncornfirmed</span>';
        confirmNextUnconfirmed.className = 'tooltip';
        confirmNextUnconfirmed.addEventListener('click', () => {
            this.saveEdit({ confirm: true, next: 'unconfirmed' });
        });
        topBar.appendChild(confirmNextUnconfirmed);

        this.filterButton = document.createElement('a');
        this.filterButton.innerHTML = ' <svg version="1.1" viewBox="0 0 24 24" height="24" width="24"><path style="stroke-width:0.829702" d="M 18.091348,3.6666667 11.913044,14.119167 v 4.936666 l -0.826087,-0.5 V 14.119167 L 4.9086522,3.6666667 Z M 21,2 H 2 L 9.4347826,14.578333 V 19.5 L 13.565217,22 v -7.421667 z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Filter Segments</span>';
        this.filterButton.className = 'tooltip';
        this.filterButton.style.marginLeft = '20px';
        this.filterButton.addEventListener('click', () => {
            this.filterSegments();
        });
        topBar.appendChild(this.filterButton);

        let replaceText = document.createElement('a');
        replaceText.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M11 6c1.38 0 2.63.56 3.54 1.46L12 10h6V4l-2.05 2.05C14.68 4.78 12.93 4 11 4c-3.53 0-6.43 2.61-6.92 6H6.1c.46-2.28 2.48-4 4.9-4zm5.64 9.14c.66-.9 1.12-1.97 1.28-3.14H15.9c-.46 2.28-2.48 4-4.9 4-1.38 0-2.63-.56-3.54-1.46L10 12H4v6l2.05-2.05C7.32 17.22 9.07 18 11 18c1.55 0 2.98-.51 4.14-1.36L20 21.49 21.49 20l-4.85-4.86z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Replace Text</span>';
        replaceText.className = 'tooltip';
        replaceText.addEventListener('click', () => {
            this.replaceText();
        });
        topBar.appendChild(replaceText);

        let statisticsButton = document.createElement('a');
        statisticsButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Project Statistics</span>';
        statisticsButton.className = 'tooltip';
        statisticsButton.style.marginLeft = '20px';
        statisticsButton.addEventListener('click', () => {
            this.generateStatistics();
        });
        topBar.appendChild(statisticsButton);


        let concordanceButton = document.createElement('a');
        concordanceButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M21.172 24l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Concordance Search</span>';
        concordanceButton.className = 'tooltip';
        concordanceButton.style.marginLeft = '20px';
        concordanceButton.addEventListener('click', () => {
            this.concordanceSearch();
        });
        topBar.appendChild(concordanceButton);

        let addTermButton = document.createElement('a');
        addTermButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Add Term to Glossary</span>';
        addTermButton.className = 'tooltip';
        addTermButton.style.marginLeft = '20px';
        addTermButton.addEventListener('click', () => {
            this.addTerm();
        });
        topBar.appendChild(addTermButton);

        let termSearchButton = document.createElement('a');
        termSearchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13 8h-8v-1h8v1zm0 2h-8v-1h8v1zm-3 2h-5v-1h5v1zm11.172 12l-7.387-7.387c-1.388.874-3.024 1.387-4.785 1.387-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9c0 1.761-.514 3.398-1.387 4.785l7.387 7.387-2.828 2.828zm-12.172-8c3.859 0 7-3.14 7-7s-3.141-7-7-7-7 3.14-7 7 3.141 7 7 7z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Search Term in Glossary</span>';
        termSearchButton.className = 'tooltip';
        termSearchButton.addEventListener('click', () => {
            this.searchTerm();
        });
        topBar.appendChild(termSearchButton);

        let tagsAnalysisButton = document.createElement('a');
        tagsAnalysisButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2V7h-4v2h2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Check Inline Tags</span>';
        tagsAnalysisButton.className = 'tooltip';
        tagsAnalysisButton.style.marginLeft = '20px';
        tagsAnalysisButton.addEventListener('click', () => {
            Main.electron.ipcRenderer.send('analyze-tags', { project: this.projectId });
        });
        topBar.appendChild(tagsAnalysisButton);

        let spaceAnalysisButton = document.createElement('a');
        spaceAnalysisButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>' +
            '<span class="tooltiptext bottomTooltip">Check Initial/Trailing Spaces</span>';
        spaceAnalysisButton.className = 'tooltip';
        spaceAnalysisButton.addEventListener('click', () => {
            Main.electron.ipcRenderer.send('analyze-spaces', { project: this.projectId });
        });
        topBar.appendChild(spaceAnalysisButton);

        let filler: HTMLSpanElement = document.createElement('span');
        filler.innerHTML = '&nbsp;';
        filler.className = 'fill_width';
        topBar.appendChild(filler);

        let memLabel: HTMLLabelElement = document.createElement('label');
        memLabel.style.marginTop = '4px';
        memLabel.innerHTML = 'Memory';
        memLabel.setAttribute('for', 'memSelect' + this.projectId);
        topBar.appendChild(memLabel);

        this.memSelect = document.createElement('select');
        this.memSelect.id = 'memSelect' + this.projectId;
        this.memSelect.style.marginTop = '4px';
        this.memSelect.style.minWidth = '180px';
        this.memSelect.addEventListener('change', () => {
            this.electron.ipcRenderer.send('set-project-memory', { project: this.projectId, memory: this.memSelect.value });
        });
        topBar.appendChild(this.memSelect);

        let requestTranslation = document.createElement('a');
        requestTranslation.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M21 21h-1.713l-.658-1.846h-3l-.663 1.846h-1.659l3.04-8h1.603l3.05 8zm-2.814-3.12l-1.049-3.018-1.054 3.018h2.103zm-9.464-12.037l.125-.562-1.02-.199-.101.464c-.345-.05-.712-.057-1.083-.019.009-.249.023-.494.045-.728h1.141v-.966h-1.004c.049-.246.092-.394.134-.533l-.997-.3c-.072.245-.134.484-.195.833h-1.138v.966h1.014c-.027.312-.043.637-.048.964-1.119.411-1.595 1.195-1.595 1.905 0 .84.663 1.578 1.709 1.482 1.301-.118 2.169-1.1 2.679-2.308.525.303.746.814.548 1.286-.185.436-.725.852-1.757.831v1.041c1.146.018 2.272-.417 2.715-1.469.431-1.028-.062-2.151-1.172-2.688zm-1.342.71c-.162.36-.375.717-.648.998-.041-.3-.07-.628-.086-.978.249-.032.499-.038.734-.02zm-1.758.336c.028.44.078.844.148 1.205-.927.169-.963-.744-.148-1.205zm15.378 5.111c.552 0 1 .449 1 1v8c0 .551-.448 1-1 1h-8c-.552 0-1-.449-1-1v-8c0-.551.448-1 1-1h8zm0-2h-8c-1.656 0-3 1.343-3 3v8c0 1.657 1.344 3 3 3h8c1.657 0 3-1.343 3-3v-8c0-1.657-1.343-3-3-3zm-13 3c0-.342.035-.677.102-1h-5.102c-.552 0-1-.449-1-1v-8c0-.551.448-1 1-1h8c.552 0 1 .449 1 1v5.101c.323-.066.657-.101 1-.101h1v-5c0-1.657-1.343-3-3-3h-8c-1.656 0-3 1.343-3 3v8c0 1.657 1.344 3 3 3h5v-1z"/></svg>' +
            '<span class="tooltiptext bottomCenterTooltip">Apply Translation Memory to All Segments</span>';
        requestTranslation.className = 'tooltip';
        requestTranslation.style.marginLeft = '4px';
        requestTranslation.addEventListener('click', () => {
            this.applyTranslationMemoryAll();
        });
        topBar.appendChild(requestTranslation);

        let glossLabel: HTMLLabelElement = document.createElement('label');
        glossLabel.style.marginLeft = '20px';
        glossLabel.style.marginTop = '4px';
        glossLabel.innerHTML = 'Glossary';
        glossLabel.setAttribute('for', 'glossSelect' + this.projectId);
        topBar.appendChild(glossLabel);

        this.glossSelect = document.createElement('select');
        this.glossSelect.id = 'glossSelect' + this.projectId;
        this.glossSelect.style.marginTop = '4px';
        this.glossSelect.style.minWidth = '180px';
        this.glossSelect.addEventListener('change', () => {
            this.electron.ipcRenderer.send('set-project-glossary', { project: this.projectId, glossary: this.glossSelect.value });
        });
        topBar.appendChild(this.glossSelect);

        let requestTerms = document.createElement('a');
        requestTerms.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><path d="M14.17,5L19,9.83V19H5V5L14.17,5L14.17,5 M14.17,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V9.83 c0-0.53-0.21-1.04-0.59-1.41l-4.83-4.83C15.21,3.21,14.7,3,14.17,3L14.17,3z M7,15h10v2H7V15z M7,11h10v2H7V11z M7,7h7v2H7V7z"/></svg>' +
            '<span class="tooltiptext bottomRightTooltip">Get Terms for All Segments</span>';
        requestTerms.className = 'tooltip';
        requestTerms.style.marginRight = '10px';
        requestTerms.addEventListener('click', () => {
            this.applyTerminologyAll();
        });
        topBar.appendChild(requestTerms);
    }

    close(): void {
        this.rowsObserver.disconnect();
        this.observer.disconnect();
    }

    getContainer(): HTMLDivElement {
        return this.container;
    }

    setSize() {
        let main = document.getElementById('main');
        this.container.style.width = main.clientWidth + 'px';
        this.container.style.height = main.clientHeight + 'px';
        this.mainArea.style.height = (main.clientHeight - 34) + 'px';
        this.mainArea.style.width = this.container.clientWidth + 'px';
    }

    watchSizes(): void {
        let targetNode: HTMLElement = document.getElementById('main');
        let config: any = { attributes: true, childList: false, subtree: false };
        this.observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    this.setSize();
                }
            }
        });
        this.observer.observe(targetNode, config);
    }

    exportTranslations() {
        this.electron.ipcRenderer.send('export-open-project', { project: this.projectId });
    }

    setSegmentsCount(count: number): void {

        this.segmentsCount = count;

        this.maxPage = Math.ceil(this.segmentsCount / this.rowsPage);
        if (this.maxPage * this.rowsPage < this.segmentsCount) {
            this.maxPage++;
        }

        this.pagesSpan.innerText = 'of ' + this.maxPage;
        this.pageInput.value = '1';
        this.getSegments();
    }

    getSegments(): void {
        this.container.classList.add('wait');

        let params: any = {
            project: this.projectId,
            start: this.currentPage * this.rowsPage,
            count: this.rowsPage,
            filterText: this.filterText,
            filterLanguage: this.filterLanguage,
            caseSensitiveFilter: this.caseSensitiveFilter,
            regExp: this.regExp,
            showUntranslated: this.showUntranslated,
            showTranslated: this.showTranslated,
            showConfirmed: this.showConfirmed
        };
        this.electron.ipcRenderer.send('get-segments', params);
    }

    buildTranslationArea(): void {
        let tableContainer: HTMLDivElement = document.createElement('div');
        tableContainer.classList.add('divContainer');
        tableContainer.classList.add('fill_width');
        this.translationArea.appendChild(tableContainer);

        let table: HTMLTableElement = document.createElement('table');
        table.classList.add('stripes');
        table.classList.add('zoomable');
        table.style.width = 'calc(100% - 2px)';
        tableContainer.appendChild(table);

        let thead: HTMLTableSectionElement = document.createElement('thead');
        table.appendChild(thead);

        let tr: HTMLTableRowElement = document.createElement('tr');
        thead.appendChild(tr);

        let th = document.createElement('th');
        th.classList.add('fixed');
        th.innerText = '#'
        tr.appendChild(th);

        this.sourceTh = document.createElement('th');
        this.sourceTh.innerText = 'Source (' + this.srcLang + ')';
        this.sourceTh.style.minWidth = '200px';
        tr.appendChild(this.sourceTh);

        th = document.createElement('th');
        th.innerText = 'Status';
        th.colSpan = 3;
        tr.appendChild(th);

        this.targetTh = document.createElement('th');
        this.targetTh.innerText = 'Target (' + this.tgtLang + ')';
        this.targetTh.style.minWidth = '200px';
        tr.appendChild(this.targetTh);

        this.tbody = document.createElement('tbody');
        table.appendChild(this.tbody);

        this.statusArea = document.createElement('div');
        this.statusArea.classList.add('toolbar');
        this.statusArea.style.borderTopColor = 'var(--accent-color)';
        this.translationArea.appendChild(this.statusArea);

        let firstLink: HTMLAnchorElement = document.createElement('a');
        firstLink.classList.add('tooltip');
        firstLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" /></svg>' +
            '<span class="tooltiptext topTooltip">First Page</span>';
        firstLink.addEventListener('click', () => {
            this.firstPage();
        });
        this.statusArea.appendChild(firstLink);

        let previousLink: HTMLAnchorElement = document.createElement('a');
        previousLink.classList.add('tooltip');
        previousLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>' +
            '<span class="tooltiptext topTooltip">Previous Page</span>';
        previousLink.addEventListener('click', () => {
            this.previousPage();
        });
        this.statusArea.appendChild(previousLink);

        let pageLabel: HTMLLabelElement = document.createElement('label');
        pageLabel.innerText = 'Page';
        pageLabel.setAttribute('for', 'page' + this.projectId);
        pageLabel.style.marginLeft = '10px';
        pageLabel.style.marginTop = '4px';
        this.statusArea.appendChild(pageLabel);

        let pageDiv: HTMLDivElement = document.createElement('div');
        pageDiv.classList.add('tooltip');
        this.statusArea.appendChild(pageDiv);

        this.pageInput = document.createElement('input');
        this.pageInput.type = 'number';
        this.pageInput.style.marginLeft = '10px';
        this.pageInput.style.marginTop = '4px';
        this.pageInput.style.width = '50px';
        this.pageInput.value = '0';
        this.pageInput.addEventListener('change', () => {
            let page = Number.parseInt(this.pageInput.value, 10);
            if (page >= 0 && page <= this.maxPage) {
                this.currentPage = page;
                this.getSegments();
            }
        });
        pageDiv.appendChild(this.pageInput);
        pageDiv.insertAdjacentHTML('beforeend', '<span class="tooltiptext topTooltip">Enter page number and press ENTER</span>');

        this.pagesSpan = document.createElement('span');
        this.pagesSpan.classList.add('noWrap');
        this.pagesSpan.innerText = 'of'
        this.pagesSpan.style.marginLeft = '10px';
        this.pagesSpan.style.marginTop = '4px';
        this.pagesSpan.innerText = '0';
        this.statusArea.appendChild(this.pagesSpan);

        let nextLink: HTMLAnchorElement = document.createElement('a');
        nextLink.classList.add('tooltip');
        nextLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>' +
            '<span class="tooltiptext topTooltip">Next Page</span>';
        nextLink.addEventListener('click', () => {
            this.nextPage();
        });
        this.statusArea.appendChild(nextLink);

        let lastLink: HTMLAnchorElement = document.createElement('a');
        lastLink.classList.add('tooltip');
        lastLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24">' +
            '<path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" /></svg>' +
            '<span class="tooltiptext topTooltip">Last Page</span>';
        lastLink.addEventListener('click', () => {
            this.lastPage();
        });
        this.statusArea.appendChild(lastLink);

        let rowsLabel: HTMLLabelElement = document.createElement('label');
        rowsLabel.innerText = 'Rows/Page';
        rowsLabel.setAttribute('for', 'rows_page' + this.projectId);
        rowsLabel.style.marginLeft = '10px';
        rowsLabel.style.marginTop = '4px';
        this.statusArea.appendChild(rowsLabel);

        let rowDiv = document.createElement('div');
        rowDiv.classList.add('tooltip');
        this.statusArea.appendChild(rowDiv);

        let rowsInput: HTMLInputElement = document.createElement('input');
        rowsInput.id = 'rows_page' + this.projectId;
        rowsInput.type = 'number';
        rowsInput.style.marginLeft = '10px';
        rowsInput.style.marginTop = '4px';
        rowsInput.style.width = '50px';
        rowsInput.value = '' + this.rowsPage;
        rowsInput.addEventListener('change', () => {
            this.rowsPage = Number.parseInt(rowsInput.value, 10);
            this.maxPage = Math.ceil(this.segmentsCount / this.rowsPage);
            if (this.maxPage * this.rowsPage < this.segmentsCount) {
                this.maxPage++;
            }
            this.pagesSpan.innerText = 'of ' + this.maxPage;
            this.pageInput.value = '1';
            this.firstPage();
        });
        rowDiv.appendChild(rowsInput);
        rowDiv.insertAdjacentHTML('beforeend', '<span class="tooltiptext topTooltip">Enter number of rows/page and press ENTER</span>');

        let goToLink: HTMLAnchorElement = document.createElement('a');
        goToLink.style.marginLeft = '10px';
        goToLink.classList.add('tooltip');
        goToLink.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M17.27 6.73l-4.24 10.13-1.32-3.42-.32-.83-.82-.32-3.43-1.33 10.13-4.23M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>' +
            '<span class="tooltiptext topTooltip">Go To Segment...</span>';
        goToLink.addEventListener('click', () => {
            this.electron.ipcRenderer.send('show-go-to-window');
        });
        this.statusArea.appendChild(goToLink);

        let filler: HTMLSpanElement = document.createElement('span');
        filler.innerHTML = '&nbsp;';
        filler.className = 'fill_width';
        this.statusArea.appendChild(filler);

        this.statistics = document.createElement('div');
        this.statistics.innerHTML = '&nbsp;';
        this.statistics.classList.add('stats');
        this.statusArea.appendChild(this.statistics);

        let config: any = { attributes: true, childList: false, subtree: false };
        this.rowsObserver = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    tableContainer.style.height = (this.translationArea.clientHeight - 34) + 'px';
                    tableContainer.style.width = this.translationArea.clientWidth + 'px';
                    this.sourceTh.style.minWidth = (this.translationArea.clientWidth * 0.4) + 'px';
                    this.targetTh.style.minWidth = (this.translationArea.clientWidth * 0.4) + 'px';
                }
            }
        });
        this.rowsObserver.observe(this.translationArea, config);
    }

    buildRightSide(): void {
        let horizontalSplit: ThreeHorizontalPanels = new ThreeHorizontalPanels(this.rightPanel);

        this.memoryArea = horizontalSplit.topPanel();
        let memoryTitle: HTMLDivElement = document.createElement('div');
        memoryTitle.classList.add('titlepanel');
        memoryTitle.innerText = 'Translation Memory';
        this.memoryArea.appendChild(memoryTitle);
        let matchesContainer: HTMLDivElement = document.createElement('div');
        matchesContainer.classList.add('fill_width');
        this.memoryArea.appendChild(matchesContainer);
        this.tmMatches = new TmMatches(matchesContainer, this.projectId);

        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    matchesContainer.style.height = (this.memoryArea.clientHeight - memoryTitle.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.memoryArea, config);

        this.machineArea = horizontalSplit.centerPanel();
        let machineTitle: HTMLDivElement = document.createElement('div');
        machineTitle.classList.add('titlepanel');
        machineTitle.innerText = 'Machine Translation';
        this.machineArea.appendChild(machineTitle);
        let mtContainer: HTMLDivElement = document.createElement('div');
        mtContainer.classList.add('fill_width');
        this.machineArea.appendChild(mtContainer);
        this.mtMatches = new MtMatches(mtContainer, this.projectId);

        observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    mtContainer.style.height = (this.machineArea.clientHeight - machineTitle.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.machineArea, config);

        this.termsArea = horizontalSplit.bottomPanel();
        let termsTitle: HTMLDivElement = document.createElement('div');
        termsTitle.classList.add('titlepanel');
        termsTitle.innerText = 'Terms';
        this.termsArea.appendChild(termsTitle);
        let termsContainer: HTMLDivElement = document.createElement('div');
        termsContainer.classList.add('fill_width');
        this.termsArea.appendChild(termsContainer);
        this.termsPanel = new TermsPanel(termsContainer, this.projectId);

        observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    termsContainer.style.height = (this.termsArea.clientHeight - termsTitle.clientHeight) + 'px';
                }
            }
        });
        observer.observe(this.termsArea, config);
    }

    generateStatistics(): void {
        this.electron.ipcRenderer.send('generate-statistics', { project: this.projectId });
    }

    setSegments(arg: any[]): void {
        this.tbody.innerHTML = '';
        this.tbody.parentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        let length = arg.length;
        if (length === 0 && this.filterButton.classList.contains('active')) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Nothing to display, consider clearing current filter' });
            this.container.classList.remove('wait');
            return;
        }
        for (let i = 0; i < length; i++) {
            let row: any = arg[i];
            let tr: HTMLTableRowElement = document.createElement('tr');
            tr.setAttribute('data-file', row.file);
            tr.setAttribute('data-unit', row.unit);
            tr.setAttribute('data-id', row.segment);
            tr.addEventListener('click', (event: MouseEvent) => this.rowClickListener(event));
            this.tbody.appendChild(tr);

            let td: HTMLTableCellElement = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.classList.add('initial');
            td.innerText = row.index + 1;
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('source');
            td.lang = this.srcLang;
            td.classList.add('initial');
            if (row.preserve) {
                td.classList.add('preserve');
            }
            td.innerHTML = row.source;
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.classList.add('translate');
            td.innerHTML = row.translate ? TranslationView.SVG_BLANK : TranslationView.SVG_LOCK;
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('center');
            td.classList.add('match');
            if (row.match > 0) {
                td.innerHTML = row.match + '%';
            }
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('middle');
            td.classList.add('state');
            td.classList.add(row.state);
            if (row.state === 'initial') {
                td.innerHTML = TranslationView.SVG_BLANK;
            }
            if (row.state === 'translated') {
                td.innerHTML = TranslationView.SVG_TRANSLATED;
            }
            if (row.state === 'final') {
                td.innerHTML = TranslationView.SVG_FINAL;
            }
            tr.appendChild(td);

            td = document.createElement('td');
            td.classList.add('target');
            td.lang = this.tgtLang;
            td.spellcheck = true;
            if (row.preserve) {
                td.classList.add('preserve');
            }
            td.innerHTML = row.target;
            tr.appendChild(td);
        }
        this.tmMatches.clear();
        this.mtMatches.clear();
        this.termsPanel.clear();
        this.currentRow = undefined;
        this.container.classList.remove('wait');

        let rows: HTMLCollection = this.tbody.rows;
        this.selectRow((rows[0] as HTMLTableRowElement), true);
    }

    firstPage(): void {
        this.currentPage = 0;
        this.pageInput.value = '' + (this.currentPage + 1);
        this.getSegments();
    }

    previousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.pageInput.value = '' + (this.currentPage + 1);
            this.getSegments();
        }
    }

    nextPage(): void {
        if (this.currentPage < this.maxPage - 1) {
            this.currentPage++;
            this.pageInput.value = '' + (this.currentPage + 1);
            this.getSegments();
        }
    }

    lastPage(): void {
        this.currentPage = this.maxPage - 1;
        this.pageInput.value = '' + (this.currentPage + 1);
        this.getSegments();
    }

    rowClickListener(event: MouseEvent): void {
        let clickedRow: HTMLTableRowElement = event.currentTarget as HTMLTableRowElement;
        if (clickedRow === this.currentRow) {
            return;
        }
        this.saveEdit({ confirm: false, next: 'clicked', segment: clickedRow.rowIndex });
    }

    getMachineTranslations() {
        this.electron.ipcRenderer.send('machine-translate', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id
        });
    }

    getTmMatches() {
        if (this.memSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        this.electron.ipcRenderer.send('tm-translate', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id,
            memory: this.memSelect.value
        });
    }

    saveEdit(arg: any): void {
        let confirm: boolean = arg.confirm;
        let next: string = arg.next;
        this.currentCell.classList.remove('editing');
        this.currentRow.classList.remove('currentRow');
        let translation = this.currentCell.innerHTML;
        this.currentCell.innerHTML = this.highlightSpaces(translation);

        let isConfirmed: boolean = this.currentState.classList.contains('final');
        if (!confirm && isConfirmed && this.currentContent === translation) {
            confirm = true;
        }
        if (arg.unconfirm) {
            confirm = false;
            this.currentState.classList.remove('final');
            if (translation === '') {
                this.currentState.classList.add('initial');
                this.currentState.innerHTML = TranslationView.SVG_BLANK;
            } else {
                this.currentState.classList.add('translated');
                this.currentState.innerHTML = TranslationView.SVG_TRANSLATED;
            }
        }
        if (confirm) {
            this.currentState.classList.remove('initial');
            this.currentState.classList.remove('translated');
            this.currentState.classList.add('final');
            this.currentState.innerHTML = TranslationView.SVG_FINAL;
        } else {
            if (translation === '') {
                if (this.currentState.classList.contains('translated')) {
                    this.currentState.classList.remove('translated');
                    this.currentState.classList.add('initial');
                    this.currentState.innerHTML = TranslationView.SVG_BLANK;
                }
            } else {
                if (this.currentState.classList.contains('initial')) {
                    this.currentState.classList.remove('initial');
                    this.currentState.classList.add('translated');
                    this.currentState.innerHTML = TranslationView.SVG_TRANSLATED;
                }
            }
        }
        this.electron.ipcRenderer.send('save-translation', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id, translation: translation,
            confirm: confirm,
            memory: this.memSelect.value
        });
        let rows: HTMLCollection = this.tbody.rows;
        if (next === 'none') {
            this.selectRow(this.currentRow, true);
        }
        if (next === 'clicked') {
            let index = arg.segment - 1;
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row, true);
        }
        if (next === 'number') {
            let index = arg.segment - 1;
            if (index < 0) {
                index = 0;
            }
            if (index >= rows.length) {
                index = rows.length - 1;
            }
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row, true);
            this.electron.ipcRenderer.send('close-go-to');
        }
        if (next === 'next') {
            let index = this.currentRow.rowIndex;
            if (index >= rows.length) {
                index = rows.length - 1;
            }
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row, true);
        }
        if (next === 'previous') {
            let index = this.currentRow.rowIndex - 2;
            if (index < 0) {
                index = 0;
            }
            let row: HTMLTableRowElement = (rows[index] as HTMLTableRowElement);
            this.selectRow(row, true);
        }
        if (next === 'untranslated') {
            let found: boolean = false;
            let length: number = rows.length;
            for (let i: number = this.currentRow.rowIndex; i < length; i++) {
                let row: HTMLTableRowElement = (rows[i] as HTMLTableRowElement);
                let cell: HTMLTableCellElement = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                if (cell.classList.contains('initial')) {
                    found = true;
                    this.selectRow(row, true);
                    break;
                }
            }
            if (!found) {
                this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'No more untranslated segments on this page' });
            }
        }
        if (next === 'unconfirmed') {
            let found: boolean = false;
            let length: number = rows.length;
            for (let i: number = this.currentRow.rowIndex; i < length; i++) {
                let row: HTMLTableRowElement = (rows[i] as HTMLTableRowElement);
                let cell: HTMLTableCellElement = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                if (cell.classList.contains('translated')) {
                    found = true;
                    this.selectRow(row, true);
                    break;
                }
            }
            if (!found) {
                this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'No more unconfirmed segments on this page' });
            }
        }
    }

    nextUntranslated(): void {
        this.saveEdit({ confirm: false, next: 'untranslated' });
        return;
    }

    nextUnconfirmed(): void {
        this.saveEdit({ confirm: false, next: 'unconfirmed' });
        return;
    }

    centerRow(row: HTMLTableRowElement): void {
        setTimeout(() => {
            row.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }

    selectRow(row: HTMLTableRowElement, focus: boolean) {
        if (this.currentRow) {
            this.currentRow.classList.remove('currentRow');
        }
        this.currentRow = row;
        this.currentRow.classList.add('currentRow');
        let id = this.currentRow.getAttribute('data-id');
        let file = this.currentRow.getAttribute('data-file');
        let unit = this.currentRow.getAttribute('data-unit');

        let sameRow: boolean = (id === this.currentId.id && file === this.currentId.file && unit === this.currentId.unit);

        this.currentId = { id: id, file: file, unit: unit };
        let source: HTMLTableCellElement = this.currentRow.getElementsByClassName('source')[0] as HTMLTableCellElement;
        this.sourceTags = this.getTags(source);

        this.currentCell = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        this.currentState = this.currentRow.getElementsByClassName('state')[0] as HTMLTableCellElement;
        this.currentTranslate = this.currentRow.getElementsByClassName('translate')[0] as HTMLTableCellElement;
        this.currentContent = this.currentCell.innerHTML;
        if (this.currentTranslate.innerHTML.indexOf('path') === -1) { // SVG_BLANK doesn't have 'path'
            this.currentCell.contentEditable = 'true';
            this.currentCell.classList.add('editing');
        } else {
            console.log(this.currentTranslate.innerHTML);
        }

        if (!sameRow) {
            this.tmMatches.clear();
            this.mtMatches.clear();
            this.termsPanel.clear();

            this.electron.ipcRenderer.send('get-matches', {
                project: this.projectId,
                file: this.currentId.file,
                unit: this.currentId.unit,
                segment: this.currentId.id
            });
            this.electron.ipcRenderer.send('get-terms', {
                project: this.projectId,
                file: this.currentId.file,
                unit: this.currentId.unit,
                segment: this.currentId.id
            });
        }
        this.centerRow(this.currentRow);
        if (focus) {
            this.currentCell.focus();
        }
    }

    cancelEdit(): void {
        this.currentCell.innerHTML = this.currentContent;
    }

    getTags(element: HTMLTableCellElement): Map<string, string> {
        let map = new Map<string, string>();
        let children: HTMLCollectionOf<HTMLImageElement> = element.getElementsByTagName('img');
        let length: number = children.length;
        for (let i = 0; i < length; i++) {
            let child: HTMLElement = children[i];
            map.set(child.getAttribute('data-id'), child.outerHTML);
        }
        return map;
    }

    copySource(): void {
        let source: HTMLTableCellElement = this.currentRow.getElementsByClassName('source')[0] as HTMLTableCellElement;
        this.currentCell.innerHTML = source.innerHTML;
    }

    insertTag(arg: any): void {
        if (arg.tag) {
            let tag: string = '' + arg.tag;
            if (this.sourceTags.has(tag)) {
                let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
                let targetTags = this.getTags(target);
                if (targetTags.has(tag)) {
                    this.removeTag(tag);
                }
                this.electron.ipcRenderer.send('paste-tag', this.sourceTags.get(tag));
            }
        } else {
            this.electron.ipcRenderer.send('show-tag-window');
        }
    }

    autoPropagate(rows: any[]): void {
        let length = rows.length;
        for (let i = 0; i < length; i++) {
            this.updateBody(rows[i]);
        }
    }

    updateBody(data: any): void {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length = rows.length;
        for (let i = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === data.file && row.getAttribute('data-unit') === data.unit
                && row.getAttribute('data-id') === data.segment) {
                (row.getElementsByClassName('match')[0] as HTMLTableCellElement).innerHTML = data.match + '%';
                if (data.target) {
                    (row.getElementsByClassName('state')[0] as HTMLTableCellElement).classList.remove('initial');
                    (row.getElementsByClassName('state')[0] as HTMLTableCellElement).classList.add('translated');
                    (row.getElementsByClassName('target')[0] as HTMLTableCellElement).innerHTML = data.target;
                }
                break;
            }
        }
    }

    setMatches(matches: any[]): void {
        this.tmMatches.clear();
        this.mtMatches.clear();
        let length = matches.length;
        let max: number = 0;
        for (let i = 0; i < length; i++) {
            let match = matches[i];
            match.project = this.projectId;
            if (match.type === 'tm') {
                this.tmMatches.add(match);
                if (match.similarity > max) {
                    max = match.similarity;
                }
            }
            if (match.type === 'mt') {
                this.mtMatches.add(match);
            }
        }
        if (max > 0) {
            (this.currentRow.getElementsByClassName('match')[0] as HTMLTableCellElement).innerHTML = max + '%';
        }
    }

    setTerms(terms: any[]): void {
        this.termsPanel.setTerms(terms);
    }

    setTarget(arg: any): void {
        let rows: HTMLCollectionOf<HTMLTableRowElement> = this.tbody.getElementsByTagName('tr');
        let length = rows.length;
        for (let i = 0; i < length; i++) {
            let row: HTMLTableRowElement = rows[i];
            if (row.getAttribute('data-file') === arg.file && row.getAttribute('data-unit') === arg.unit
                && row.getAttribute('data-id') === arg.segment) {
                (row.getElementsByClassName('target')[0] as HTMLTableCellElement).innerHTML = arg.target;
                let state = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                state.classList.remove('initial');
                state.classList.add('translated');
                state.innerHTML = TranslationView.SVG_TRANSLATED;

                this.currentCell = row.getElementsByClassName('target')[0] as HTMLTableCellElement;
                this.currentState = row.getElementsByClassName('state')[0] as HTMLTableCellElement;
                this.currentTranslate = row.getElementsByClassName('translate')[0] as HTMLTableCellElement;
                this.currentContent = this.currentCell.innerHTML;
                this.currentCell.contentEditable = 'true';
                this.currentCell.classList.add('editing');
                this.currentCell.focus();
                break;
            }
        }
    }

    setProjectMemories(arg: any): void {
        let memories: any[] = arg.memories;
        if (memories.length === 0) {
            this.memSelect.innerHTML = '<option value="none" class="error">-- No Memory --</option>';
            return;
        }
        let array: string[] = [];
        let options = '<option value="none" class="error">-- Select Memory --</option>';
        let length = memories.length;
        for (let i = 0; i < length; i++) {
            let mem: string[] = memories[i];
            array.push(mem[0]);
            options = options + '<option value="' + mem[0] + '">' + mem[1] + '</option>';
        }
        this.memSelect.innerHTML = options;
        if (array.includes(arg.default)) {
            this.memSelect.value = arg.default;
        }
    }

    setStatistics(stats: any): void {
        this.statistics.innerHTML = '';
        let span: HTMLSpanElement = document.createElement('span');
        span.classList.add('stats');
        span.innerText = stats.text;
        this.statistics.appendChild(span);

        let svg: HTMLSpanElement = document.createElement('span');
        svg.classList.add('stats');
        svg.innerHTML = stats.svg;
        this.statistics.appendChild(svg);
    }

    setSpellChecker(): void {
        this.electron.ipcRenderer.send('spell-language', this.tgtLang);
    }

    filterSegments(): void {
        let params: any = {
            projectId: this.projectId,
            filterText: this.filterText,
            filterLanguage: this.filterLanguage,
            caseSensitiveFilter: this.caseSensitiveFilter,
            regExp: this.regExp,
            showUntranslated: this.showUntranslated,
            showTranslated: this.showTranslated,
            showConfirmed: this.showConfirmed
        };
        this.electron.ipcRenderer.send('show-filter-segments', params);
    }

    setFilters(args: any): void {
        this.filterText = args.filterText;
        this.filterLanguage = args.filterLanguage;
        this.caseSensitiveFilter = args.caseSensitiveFilter;
        this.regExp = args.regExp;
        this.showUntranslated = args.showUntranslated;
        this.showTranslated = args.showTranslated;
        this.showConfirmed = args.showConfirmed;
        this.saveEdit({ confirm: false, next: 'none' });
        if (this.filterText === '') {
            this.filterButton.classList.remove('active');
        } else {
            this.filterButton.classList.add('active');
        }
        this.currentPage = 0;
        this.getSegments();
    }

    applyTranslationMemoryAll(): void {
        if (this.memSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        this.electron.ipcRenderer.send('search-memory-all', { project: this.projectId, memory: this.memSelect.value });
    }

    removeAllTranslations(): void {
        this.electron.ipcRenderer.send('remove-translations', { project: this.projectId });
    }

    removeAllMatches(): void {
        this.electron.ipcRenderer.send('remove-matches', { project: this.projectId });
    }

    removeAllMachineTranslations(): void {
        this.electron.ipcRenderer.send('remove-machine-translations', { project: this.projectId });
    }

    unconfirmAllTranslations(): void {
        this.electron.ipcRenderer.send('unconfirm-translations', { project: this.projectId });
    }

    pseudoTranslate(): void {
        this.electron.ipcRenderer.send('pseudo-translate', { project: this.projectId });
    }

    copyAllSources(): void {
        this.electron.ipcRenderer.send('copy-sources', { project: this.projectId });
    }

    confirmAllTranslations(): void {
        this.electron.ipcRenderer.send('confirm-translations', { project: this.projectId });
    }

    acceptAll100Matches(): void {
        this.electron.ipcRenderer.send('accept-100-matches', { project: this.projectId });
    }

    insertNextTag(): void {
        let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        let targetTags = this.getTags(target);
        let length = this.sourceTags.size + 1;
        for (let i = 1; i < length; i++) {
            if (!targetTags.has('' + i)) {
                this.insertTag({ tag: i });
                return;
            }
        }
    }

    insertRemainingTags(): void {
        let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        let targetTags = this.getTags(target);
        let length = this.sourceTags.size + 1;
        let tags: string = '';
        for (let i = 1; i < length; i++) {
            if (!targetTags.has('' + i)) {
                tags = tags + this.sourceTags.get('' + i);
            }
        }
        if (tags !== '') {
            this.electron.ipcRenderer.send('paste-tag', tags);
        }
    }

    removeTags(): void {
        let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        let targetTags = this.getTags(target);
        for (let key of this.sourceTags.keys()) {
            if (targetTags.has(key)) {
                this.removeTag(key.valueOf());
            }
        }
    }

    removeTag(tag: string): void {
        let target: HTMLTableCellElement = this.currentRow.getElementsByClassName('target')[0] as HTMLTableCellElement;
        let children: HTMLCollectionOf<HTMLImageElement> = target.getElementsByTagName('img');
        let length: number = children.length;
        for (let i = 0; i < length; i++) {
            let child: HTMLElement = children[i];
            if (tag === child.getAttribute('data-id')) {
                target.removeChild(child);
                return;
            }
        }
    }

    replaceText(): void {
        this.electron.ipcRenderer.send('show-replaceText', { project: this.projectId });
    }

    applyMachineTranslationsAll(): void {
        this.electron.ipcRenderer.send('apply-mt-all', { project: this.projectId });
    }

    acceptAllMachineTranslations(): void {
        this.electron.ipcRenderer.send('accept-mt-all', { project: this.projectId });
    }

    setProjectGlossaries(arg: any): void {
        let glossaries: any[] = arg.glossaries;
        if (glossaries.length === 0) {
            this.glossSelect.innerHTML = '<option value="none" class="error">-- No Glossary --</option>';
            return;
        }
        let array: string[] = [];
        let options = '<option value="none" class="error">-- Select Glossary --</option>';
        let length = glossaries.length;
        for (let i = 0; i < length; i++) {
            let mem: string[] = glossaries[i];
            array.push(mem[0]);
            options = options + '<option value="' + mem[0] + '">' + mem[1] + '</option>';
        }
        this.glossSelect.innerHTML = options;
        if (array.includes(arg.default)) {
            this.glossSelect.value = arg.default;
        }
    }

    concordanceSearch(): void {
        if (this.memSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select memory' });
            return;
        }
        this.electron.ipcRenderer.send('concordance-search', { memories: [this.memSelect.value] });
    }

    searchTerm(): void {
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.electron.ipcRenderer.send('show-term-search', { glossary: this.glossSelect.value });
    }

    addTerm(): void {
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.electron.ipcRenderer.send('show-add-term', { glossary: this.glossSelect.value, srcLang: this.srcLang, tgtLang: this.tgtLang });
    }

    applyTerminologyAll(): void {
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        this.electron.ipcRenderer.send('get-project-terms', { project: this.projectId, glossary: this.glossSelect.value });
    }

    applyTerminology(): void {
        if (this.glossSelect.value === 'none') {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select glossary' });
            return;
        }
        if (!this.currentCell) {
            this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select segment' });
            return;
        }
        this.electron.ipcRenderer.send('get-segment-terms', {
            project: this.projectId,
            file: this.currentId.file,
            unit: this.currentId.unit,
            segment: this.currentId.id,
            glossary: this.glossSelect.value
        });
    }

    insertTerm(arg: any): void {
        let term: string = '';
        if (arg.term) {
            term = this.termsPanel.getTerm(arg.term);
        } else {
            term = this.termsPanel.getSelected();
        }
        if (term !== '') {
            this.electron.ipcRenderer.send('paste-text', term);
        }
    }

    toggleLock(): void {
        if (this.currentRow) {
            this.electron.ipcRenderer.send('lock-segment', {
                project: this.projectId,
                file: this.currentId.file,
                unit: this.currentId.unit,
                segment: this.currentId.id
            });
            return;
        }
        this.electron.ipcRenderer.send('show-message', { type: 'warning', message: 'Select segment' });
    }

    highlightSpaces(text: string): string {
        let start: string = '';
        for (let i = 0; i < text.length; i++) {
            let c = text.charAt(i);
            if (!this.isWhiteSpace(c)) {
                break;
            }
            start = start + c;
        }
        if (start !== '') {
            text = "<span class='space'>" + start + "</span>" + text.substring(start.length);
        }
        let end: string = '';
        for (let i = text.length - 1; i >= 0; i--) {
            let c = text.charAt(i);
            if (!this.isWhiteSpace(c)) {
                break;
            }
            end = end + c;
        }
        if (end !== '') {
            text = text.substring(0, text.length - end.length) + "<span class='space'>" + end + "</span>";
        }
        return text;
    }

    isWhiteSpace(c: string): boolean {
        return (c === ' ' || c === '\n' || c === '\t' || c === '\u00A0');
    }

    nextMatch(): void {
        this.tmMatches.nextMatch();
    }

    previousMatch(): void {
        this.tmMatches.previousMatch();
    }

    nextMT(): void {
        this.mtMatches.nextMatch();
    }

    previousMT(): void {
        this.mtMatches.previousMatch();
    }

    gotoNext(): void {
        this.saveEdit({ next: 'next', confirm: false });
    }

    gotoPrevious(): void {
        this.saveEdit({ next: 'previous', confirm: false });
    }

    openSegment(arg: any): void {
        this.saveEdit({ next: 'number', confirm: false, segment: arg.segment });
    }

    getSrcLang(): string {
        return this.srcLang;
    }

    getTgtLang(): string {
        return this.tgtLang;
    }
}